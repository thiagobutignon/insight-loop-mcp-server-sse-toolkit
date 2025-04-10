import path from "path";
import { initGeminiClient } from "../../llm/gemini-open-ai.ts";
import { CREATE_NEW_TOOL_PROMPT } from "../../prompts/tool/create-new-tool-prompt.ts";
import { askQuestion } from "../helpers/ask-question.ts";
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import chalk from "chalk"; // Import chalk
import ora from "ora"; // Import ora

// Load environment variables
dotenv.config();

// --- Helper Logs (optional, but good practice for consistency) ---
const log = console.log;
const logError = console.error;
// ---

export async function createNewTool(toolsDir: string): Promise<void> {
  const client = initGeminiClient();
  let spinner; // Declare spinner variable here to access it in catch block if needed

  try {
    // --- Ask for tool details with styled prompts ---
    const toolName = await askQuestion(
      `${chalk.blue("Enter the tool name")} ${chalk.dim("(e.g., sumTwo)")}: `
    );
    const functionName = await askQuestion(
      `${chalk.blue("Enter the function name")} ${chalk.dim(
        "(e.g., sum_two)"
      )}: `
    );
    const folderPath = await askQuestion(
      `${chalk.blue("Enter subfolder path")} ${chalk.dim(
        "(optional, press Enter for root tools directory)"
      )}: `
    );
    const description = await askQuestion(
      `${chalk.blue("Enter a brief description")} ${chalk.dim(
        "of what the tool does"
      )}: `
    );
    const example = await askQuestion(
      `${chalk.blue("Provide an example")} ${chalk.dim(
        "of how this tool should be used"
      )}: `
    );

    // Calculate paths
    const basePath = path.resolve(process.cwd(), toolsDir);
    const targetDir = folderPath ? path.join(basePath, folderPath) : basePath;

    // --- Create directory if it doesn't exist ---
    log(chalk.dim(`Ensuring directory exists: ${chalk.cyan(targetDir)}`)); // Dim info message
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      logError(chalk.red("Error creating directory:"), error.message);
      // Optionally log the full error: logError(error);
      return; // Exit if directory creation fails
    }

    // --- Prepare for LLM ---
    const systemPrompt = CREATE_NEW_TOOL_PROMPT;
    const userPrompt = `
Tool Name: ${toolName}
Function Name: ${functionName}
Description: ${description}
Example: ${example}

Please generate a complete TypeScript tool file based on these details.`;

    const model = process.env.GEMINI_MODEL;
    if (!model) {
      logError(
        chalk.bold.red(
          "Error: GEMINI_MODEL not found in environment variables."
        )
      );
      process.exit(1); // Exit directly for critical config error
    }

    // --- Generate the file content using LLM (with spinner) ---
    spinner = ora(chalk.cyan("Generating tool code via LLM...")).start();

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    spinner.text = chalk.cyan("Processing LLM response..."); // Update spinner text

    const generatedCode = response.choices[0].message.content?.trim() || "";

    // Extract just the code if it's wrapped in markdown code blocks
    const codeMatch =
      generatedCode.match(/```typescript\s*([\s\S]*?)\s*```/) ||
      generatedCode.match(/```\s*([\s\S]*?)\s*```/);
    const finalCode = codeMatch ? codeMatch[1].trim() : generatedCode; // Trim extracted code

    if (!finalCode) {
      spinner.warn(
        chalk.yellow("LLM returned empty content. Cannot create file.")
      );
      return;
    }

    // --- Write the file ---
    spinner.text = chalk.cyan("Writing tool file..."); // Update spinner text
    const filePath = path.join(targetDir, `${toolName}.ts`);
    await fs.writeFile(filePath, finalCode, "utf-8");

    // --- Success ---
    spinner.succeed(
      chalk.green(`Created new tool at: ${chalk.bold.cyan(filePath)}`)
    );
  } catch (error: any) {
    // --- Error Handling ---
    if (spinner) {
      spinner.fail(chalk.red("Tool creation failed.")); // Stop spinner on failure
    } else {
      // If error happened before spinner started
      logError(chalk.red("An error occurred during tool creation setup."));
    }
    logError(chalk.red("Error details:"), error.message || error);
    // Optionally log the full stack trace for debugging:
    // if (error.stack) {
    //   logError(chalk.dim(error.stack));
    // }
  }
}
