import path from "path";
import { globby } from "globby";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chalk from "chalk";
import ora from "ora";
import { askQuestion, readline } from "./functions/helpers/ask-question.ts";
import { improveToolDescriptions } from "./functions/automation/improve-tool-descriptions.ts";
import { createNewTool } from "./functions/tools/create-new-tool.ts";
import { createNewPrompt } from "./functions/prompts/create-new-prompt.ts";

// Load environment variables
dotenv.config();

// Set up dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Helper Function for Consistent Styling ---
const log = console.log;
const logError = console.error;

// --- Function to find all tool files ---
async function findToolFiles(toolsDir: string): Promise<string[]> {
  const toolsPath = path.resolve(path.join(__dirname, ".."), toolsDir);
  // Use ora spinner for file searching
  const spinner = ora(
    `Searching for tool files in ${chalk.cyan(toolsDir)}...`
  ).start();
  try {
    const files = await globby(["**/*.ts"], { cwd: toolsPath, absolute: true });
    if (files.length === 0) {
      spinner.warn(
        chalk.yellow(`No tool files found in ${chalk.bold(toolsDir)}`)
      );
    } else {
      spinner.succeed(
        chalk.green(`Found ${chalk.bold(files.length)} tool files.`)
      );
    }
    return files;
  } catch (error) {
    spinner.fail(chalk.red("Failed to search for tool files."));
    throw error; // Re-throw the error to be caught by the main handler
  }
}

// --- Function to find all prompt files ---
async function findPromptFiles(promptsDir: string): Promise<string[]> {
  const promptsPath = path.resolve(path.join(__dirname, ".."), promptsDir);
  // Use ora spinner for file searching
  const spinner = ora(
    `Searching for prompt files in ${chalk.cyan(promptsDir)}...`
  ).start();
  try {
    const files = await globby(["**/*.ts"], {
      cwd: promptsPath,
      absolute: true,
    });
    if (files.length === 0) {
      spinner.warn(
        chalk.yellow(`No prompt files found in ${chalk.bold(promptsDir)}`)
      );
    } else {
      spinner.succeed(
        chalk.green(`Found ${chalk.bold(files.length)} prompt files.`)
      );
    }
    return files;
  } catch (error) {
    spinner.fail(chalk.red("Failed to search for prompt files."));
    throw error; // Re-throw the error to be caught by the main handler
  }
}

// --- Main function ---
async function main() {
  try {
    log(chalk.bold.cyanBright("\n===== Development Tools CLI =====")); // Updated title

    const toolsDir = "./src/tools";
    const promptsDir = "./src/prompts"; // Directory for prompts

    // Enhanced prompt using chalk with new option
    const option = await askQuestion(`
${chalk.bold("Choose an option:")}
  ${chalk.cyan("1.")} Improve descriptions of existing tools
  ${chalk.cyan("2.")} Create a new tool
  ${chalk.cyan("3.")} Create a new prompt
  ${chalk.cyan("4.")} List all prompts
  ${chalk.cyan("5.")} Exit

${chalk.dim("Enter your choice (1-5):")} `);

    switch (option.trim()) {
      case "1":
        const toolFiles = await findToolFiles(toolsDir);
        if (toolFiles.length > 0) {
          const improveSpinner = ora("Improving tool descriptions...").start();
          try {
            await improveToolDescriptions(toolFiles);
            improveSpinner.succeed(
              chalk.green("Successfully improved tool descriptions.")
            );
          } catch (err) {
            improveSpinner.fail(
              chalk.red("Failed to improve tool descriptions.")
            );
            throw err;
          }
        }
        break;

      case "2":
        await createNewTool(toolsDir);
        break;

      case "3":
        await createNewPrompt(promptsDir);
        break;

      case "4":
        const promptFiles = await findPromptFiles(promptsDir);
        if (promptFiles.length > 0) {
          log(chalk.bold.green("\nAvailable Prompts:"));
          promptFiles.forEach((file, index) => {
            const relativePath = path.relative(
              path.join(__dirname, ".."),
              file
            );
            const promptName = path.basename(file, ".ts");
            log(
              `  ${chalk.cyan(index + 1 + ".")} ${chalk.green(
                promptName
              )} ${chalk.dim(`(${relativePath})`)}`
            );
          });
        }
        break;

      case "5":
        log(chalk.dim("Exiting..."));
        break;

      default:
        log(chalk.yellow("Invalid option. Please enter a number from 1-5."));
    }
  } catch (error) {
    ora().stop();
    logError(chalk.red("\nAn error occurred:"));
    logError(error);
  } finally {
    readline.close();
  }
}

// --- Run the main function ---
main().catch((err) => {
  ora().stop();
  logError(chalk.bold.red("\n❌ CLI failed unexpectedly!"));
  logError(chalk.red(err.message || err));
  if (err.stack) {
    logError(chalk.dim(err.stack));
  }
  process.exit(1);
});
