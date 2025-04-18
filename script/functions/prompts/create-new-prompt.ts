import chalk from "chalk";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import ora from "ora";
import path from "path";
import { initGeminiClient } from "../../llm/gemini-open-ai.ts";
import { CREATE_NEW_PROMPT_TEMPLATE } from "../../prompts/prompts/create-new-prompt-template.ts";
import { askQuestion } from "../helpers/ask-question.ts";

dotenv.config();

const log = console.log;
const logError = console.error;

export async function createNewPrompt(promptsDir: string): Promise<void> {
  const client = initGeminiClient();
  let spinner;

  try {
    const promptName = await askQuestion(
      `${chalk.blue("Enter the prompt name")} ${chalk.dim(
        "(e.g., summarize)"
      )}: `
    );
    const folderPath = await askQuestion(
      `${chalk.blue("Enter subfolder path")} ${chalk.dim(
        "(optional, press Enter for root prompts directory)"
      )}: `
    );
    const description = await askQuestion(
      `${chalk.blue("Enter a brief description")} ${chalk.dim(
        "of what the prompt does"
      )}: `
    );

    const variables = await askQuestion(
      `${chalk.blue("List the template variables")} ${chalk.dim(
        "(e.g., text, language, tone - comma separated)"
      )}: `
    );

    const exampleScenario = await askQuestion(
      `${chalk.blue("Describe an example scenario")} ${chalk.dim(
        "where this prompt would be used"
      )}: `
    );

    const basePath = path.resolve(process.cwd(), promptsDir);
    const targetDir = folderPath ? path.join(basePath, folderPath) : basePath;

    log(chalk.dim(`Ensuring directory exists: ${chalk.cyan(targetDir)}`));
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      logError(chalk.red("Error creating directory:"), error.message);
      return;
    }

    const systemPrompt = CREATE_NEW_PROMPT_TEMPLATE;

    const variableList = variables
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);

    const userPrompt = `
Prompt Name: ${promptName}
Description: ${description}
Template Variables: ${variableList.join(", ")}
Example Scenario: ${exampleScenario}

Please generate a complete TypeScript prompt file based on these details. The prompt should be well-structured and designed to work with the MCP protocol.`;

    const model = process.env.GEMINI_MODEL;
    if (!model) {
      logError(
        chalk.bold.red(
          "Error: GEMINI_MODEL not found in environment variables."
        )
      );
      process.exit(1);
    }

    spinner = ora(chalk.cyan("Generating prompt template via LLM...")).start();

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    spinner.text = chalk.cyan("Processing LLM response...");

    const generatedCode = response.choices[0].message.content?.trim() || "";

    const codeMatch =
      generatedCode.match(/```typescript\s*([\s\S]*?)\s*```/) ||
      generatedCode.match(/```\s*([\s\S]*?)\s*```/);
    const finalCode = codeMatch ? codeMatch[1].trim() : generatedCode;

    if (!finalCode) {
      spinner.warn(
        chalk.yellow("LLM returned empty content. Cannot create file.")
      );
      return;
    }

    spinner.text = chalk.cyan("Writing prompt file...");
    const filePath = path.join(targetDir, `${promptName}.ts`);
    await fs.writeFile(filePath, finalCode, "utf-8");

    spinner.succeed(
      chalk.green(`Created new prompt at: ${chalk.bold.cyan(filePath)}`)
    );

    log("\n" + chalk.yellow("Example usage with MCP:"));
    log(
      chalk.dim(`
POST /v1/prompts/${promptName}
{
  "input": {${variableList
    .map(
      (v) => `
    "${v}": "example ${v} value"`
    )
    .join(",")}
  }
}
`)
    );
  } catch (error: any) {
    if (spinner) {
      spinner.fail(chalk.red("Prompt creation failed."));
    } else {
      logError(chalk.red("An error occurred during prompt creation setup."));
    }
    logError(chalk.red("Error details:"), error.message || error);
  }
}
