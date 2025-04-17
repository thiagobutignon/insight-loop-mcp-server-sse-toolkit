import chalk from "chalk";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import ora from "ora";
import path from "path";
import { initGeminiClient } from "../../llm/gemini-open-ai.ts";
import { IMPROVE_TOOL_DESCRIPTION_PROMPT } from "../../prompts/automation/improve-tool-description-prompt.ts";

dotenv.config();

const log = console.log;
const logError = console.error;
const logWarn = console.warn;

export async function improveToolDescriptions(
  toolFiles: string[]
): Promise<void> {
  const client = initGeminiClient();
  const systemPrompt = IMPROVE_TOOL_DESCRIPTION_PROMPT;
  const rate = process.env.GEMINI_RATE_LIMIT;
  const model = process.env.GEMINI_MODEL;

  if (!rate) {
    logError(
      chalk.bold.red(
        "Error: GEMINI_RATE_LIMIT not found in environment variables."
      )
    );
    process.exit(1);
  }
  if (!model) {
    logError(
      chalk.bold.red("Error: GEMINI_MODEL not found in environment variables.")
    );
    process.exit(1);
  }

  log(
    chalk.blue(
      `Processing ${chalk.bold(
        toolFiles.length
      )} files (rate limit: ${chalk.bold(rate)} reqs/min)...`
    )
  );

  const overallSpinner = ora({
    text: `Starting improvement process...`,
    spinner: "dots",
    color: "blue",
  }).start();

  let successCount = 0;
  let unchangedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toolFiles.length; i++) {
    const filePath = toolFiles[i];
    const baseName = path.basename(filePath);
    const progressPrefix = `[${i + 1}/${toolFiles.length}] ${chalk.cyan(
      baseName
    )}`;

    overallSpinner.text = `${progressPrefix}: Reading file...`;

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, "utf-8");
    } catch (readError: any) {
      overallSpinner.stop();
      logError(
        chalk.red(`\n${progressPrefix}: Error reading file:`),
        readError.message
      );
      overallSpinner.start(); 
      errorCount++;
      continue; 
    }

    overallSpinner.text = `${progressPrefix}: Parsing descriptions...`;
    const descriptionMatch = fileContent.match(/description:\s*"([^"]+)"/);
    const paramMatches = Array.from(
      fileContent.matchAll(/(\w+):\s*z\.\w+\(\)\.describe\("([^"]+)"\)/g)
    );

    if (!descriptionMatch) {
      overallSpinner.stopAndPersist({
        symbol: chalk.yellow("!"),
        text: `${progressPrefix}: ${chalk.yellow(
          "No description found. Skipping."
        )}`,
      });
      overallSpinner.start(); 
      skippedCount++;
      continue;
    }

    let promptContent = `Tool file: ${baseName}\n\n`;
    promptContent += `Current description: ${descriptionMatch[0]}\n\n`;
    if (paramMatches.length > 0) {
      promptContent += "Current parameter descriptions:\n";
      paramMatches.forEach((match) => (promptContent += `${match[0]}\n`));
    }

    let llmSpinner;

    try {
      llmSpinner = ora(
        `${progressPrefix}: Calling LLM for improvements...`
      ).start();

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptContent },
        ],
      });

      const improvedDescriptions = response.choices[0].message.content?.trim();

      if (!improvedDescriptions) {
        llmSpinner.warn(chalk.yellow(`No improvements received from LLM.`));
        skippedCount++;
        continue;
      }

      llmSpinner.text = `${progressPrefix}: Processing LLM response...`;

      let updatedContent = fileContent;
      const findReplacePattern =
        /<<<FIND>>>(.+?)<<<\/FIND>>>\s*<<<REPLACE>>>(.+?)<<<\/REPLACE>>>/gs;
      let match;
      let madeChanges = false;
      let replacementsLog = "";

      while ((match = findReplacePattern.exec(improvedDescriptions)) !== null) {
        const findText = match[1].trim();
        const replaceText = match[2].trim();

        replacementsLog += `\n  ${chalk.dim(
          "Attempting replace:"
        )} "${findText}" -> "${replaceText}"`;

        if (updatedContent.includes(findText)) {
          updatedContent = updatedContent.replace(findText, replaceText);
          replacementsLog += ` ${chalk.green("✓")}`;
          madeChanges = true;
        } else {
          const cleanFindText = findText.replace(/["',]+$/, "");
          if (updatedContent.includes(cleanFindText)) {
            updatedContent = updatedContent.replace(cleanFindText, replaceText);
            replacementsLog += ` ${chalk.yellow("✓ (cleaned)")}`;
            madeChanges = true;
          } else {
            replacementsLog += ` ${chalk.red("✗ (not found)")}`;
          }
        }
      }

      if (madeChanges) {
        llmSpinner.text = `${progressPrefix}: Writing updated file...`;
        await fs.writeFile(filePath, updatedContent, "utf-8");
        llmSpinner.succeed(chalk.green(`Updated successfully.`));

        successCount++;
      } else {
        llmSpinner.info(chalk.blue(`No changes applied.`));
        unchangedCount++;
      }
    } catch (error: any) {
      errorCount++;
      if (llmSpinner) {
        llmSpinner.fail(chalk.red(`Error during processing: ${error.message}`));
      } else {
        overallSpinner.stop();
        logError(
          chalk.red(`\n${progressPrefix}: Error preparing LLM call:`),
          error.message
        );
        overallSpinner.start();
      }
    }
  }

  overallSpinner.stop();
  log(chalk.bold("\n----- Improvement Process Complete -----"));
  if (successCount > 0)
    log(chalk.green(`✅ Successfully updated: ${successCount}`));
  if (unchangedCount > 0)
    log(chalk.blue(`⚪ No changes applied: ${unchangedCount}`));
  if (skippedCount > 0)
    log(chalk.yellow(`🟡 Skipped (no desc/LLM issue): ${skippedCount}`));
  if (errorCount > 0) log(chalk.red(`❌ Errors encountered: ${errorCount}`));
  log("--------------------------------------");
}
