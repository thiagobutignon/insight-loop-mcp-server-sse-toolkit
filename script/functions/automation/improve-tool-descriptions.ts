import path from "path";
import * as dotenv from "dotenv";
import { initGeminiClient } from "../../llm/gemini-open-ai.ts";
import { IMPROVE_TOOL_DESCRIPTION_PROMPT } from "../../prompts/automation/improve-tool-description-prompt.ts";
import { promises as fs } from "fs";
import chalk from "chalk"; // Import chalk
import ora from "ora"; // Import ora

dotenv.config();

// --- Helper Logs ---
const log = console.log;
const logError = console.error;
const logWarn = console.warn;
// ---

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

  // Overall progress spinner
  const overallSpinner = ora({
    text: `Starting improvement process...`,
    spinner: "dots", // Or choose another spinner style
    color: "blue",
  }).start();

  let successCount = 0;
  let unchangedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process files with rate limiting
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
      overallSpinner.stop(); // Stop spinner before logging error
      logError(
        chalk.red(`\n${progressPrefix}: Error reading file:`),
        readError.message
      );
      overallSpinner.start(); // Restart spinner for next iteration
      errorCount++;
      continue; // Skip to next file
    }

    // Extract the current description and parameter descriptions
    overallSpinner.text = `${progressPrefix}: Parsing descriptions...`;
    const descriptionMatch = fileContent.match(/description:\s*"([^"]+)"/);
    const paramMatches = Array.from(
      fileContent.matchAll(/(\w+):\s*z\.\w+\(\)\.describe\("([^"]+)"\)/g)
    );

    if (!descriptionMatch) {
      // Use ora's persist to keep the message without disrupting the spinner
      overallSpinner.stopAndPersist({
        symbol: chalk.yellow("!"),
        text: `${progressPrefix}: ${chalk.yellow(
          "No description found. Skipping."
        )}`,
      });
      overallSpinner.start(); // Restart spinner
      skippedCount++;
      continue;
    }

    // Prepare the content to send to the LLM
    let promptContent = `Tool file: ${baseName}\n\n`;
    promptContent += `Current description: ${descriptionMatch[0]}\n\n`;
    if (paramMatches.length > 0) {
      promptContent += "Current parameter descriptions:\n";
      paramMatches.forEach((match) => (promptContent += `${match[0]}\n`));
    }

    let llmSpinner;

    try {
      // Call the LLM to improve descriptions
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
        continue; // Skip to next file
      }

      llmSpinner.text = `${progressPrefix}: Processing LLM response...`;

      // Process the find and replace patterns
      let updatedContent = fileContent;
      const findReplacePattern =
        /<<<FIND>>>(.+?)<<<\/FIND>>>\s*<<<REPLACE>>>(.+?)<<<\/REPLACE>>>/gs;
      let match;
      let madeChanges = false;
      let replacementsLog = ""; // Accumulate log messages

      while ((match = findReplacePattern.exec(improvedDescriptions)) !== null) {
        const findText = match[1].trim(); // Trim whitespace
        const replaceText = match[2].trim(); // Trim whitespace

        // Log the attempt (can be made less verbose if needed)
        replacementsLog += `\n  ${chalk.dim(
          "Attempting replace:"
        )} "${findText}" -> "${replaceText}"`;

        if (updatedContent.includes(findText)) {
          updatedContent = updatedContent.replace(findText, replaceText);
          replacementsLog += ` ${chalk.green("✓")}`;
          madeChanges = true;
        } else {
          // Try cleaning potential trailing commas/quotes before giving up
          const cleanFindText = findText.replace(/["',]+$/, "");
          if (updatedContent.includes(cleanFindText)) {
            updatedContent = updatedContent.replace(cleanFindText, replaceText);
            replacementsLog += ` ${chalk.yellow("✓ (cleaned)")}`;
            madeChanges = true;
          } else {
            replacementsLog += ` ${chalk.red("✗ (not found)")}`;
            // Optionally log more details for debugging failed replacements
            // logWarn(`\n    ${chalk.yellow('Warning:')} Could not find exact text for replacement in ${baseName}: "${findText}"`);
          }
        }
      }

      if (madeChanges) {
        llmSpinner.text = `${progressPrefix}: Writing updated file...`;
        await fs.writeFile(filePath, updatedContent, "utf-8");
        llmSpinner.succeed(chalk.green(`Updated successfully.`));
        // Persist the replacement log if desired
        // overallSpinner.stopAndPersist({ symbol: ' ', text: replacementsLog });
        // overallSpinner.start();
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
        // Error occurred before LLM spinner started (e.g., during setup)
        overallSpinner.stop(); // Stop overall spinner to show error clearly
        logError(
          chalk.red(`\n${progressPrefix}: Error preparing LLM call:`),
          error.message
        );
        overallSpinner.start(); // Restart for next file
      }
      // Optionally log full error stack: logError(error);
    }
  }

  // Final summary
  overallSpinner.stop(); // Stop the main spinner before final summary
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
