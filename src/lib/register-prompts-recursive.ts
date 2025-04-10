import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import "dotenv/config";
import { pathToFileURL } from "url";
import { globby } from "globby";
import chalk from "chalk"; // Import chalk

// --- Helper Logs ---
const log = console.log;
const logWarn = console.warn;
const logError = console.error;
// ---

/**
 * Defines the expected structure of a default export from a prompt module.
 */
interface PromptDefinition {
  name: string;
  content: string;
}

/**
 * Recursively scans a directory for prompt definition files (.ts or .js)
 * and registers them with the provided McpServer instance.
 *
 * Assumes each prompt file default exports an object matching the
 * PromptDefinition interface: { name: string, content: string }.
 *
 * @param server The McpServer instance to register prompts with.
 * @param baseDirectoryPath The root directory to search for prompt files.
 */
export async function registerPromptsFromDirectoryRecursive(
  server: McpServer,
  baseDirectoryPath: string
): Promise<void> {
  const isDev = process.env.NODE_ENV !== "PRODUCTION";

  // Define the search pattern for prompt files
  const pattern = isDev
    ? `${baseDirectoryPath}/**/*.ts`
    : `${baseDirectoryPath}/**/*.js`;

  log(
    chalk.blue(
      `🔍 Searching for prompt files with pattern: ${chalk.cyan(pattern)}`
    )
  );

  try {
    const filePaths = await globby(pattern, {
      absolute: true, // Ensure absolute paths are returned
      ignore: ["**/*.d.ts", "**/*.map"], // Ignore TypeScript definition and map files
    });

    if (filePaths.length === 0) {
      logWarn(chalk.yellow("⚠️ No prompt files found matching the pattern."));
      return; // Exit early if no files found
    }

    log(
      chalk.blue(
        `💬 Found ${chalk.bold(filePaths.length)} potential prompt files.`
      )
    );

    for (const absoluteFilePath of filePaths) {
      const fileUrl = pathToFileURL(absoluteFilePath).href;
      log(
        chalk.dim(
          `📄 Attempting to import prompt from: ${chalk.cyan(absoluteFilePath)}`
        )
      );

      try {
        const module = await import(fileUrl);

        // Check if the default export looks like a PromptDefinition
        if (
          module.default &&
          typeof module.default === "object" &&
          typeof module.default.name === "string" && // Check for name (string)
          typeof module.default.content === "string" // Check for content (string)
        ) {
          const promptDef = module.default as PromptDefinition;

          // Register the prompt by converting the string content to a handler function
          server.prompt(promptDef.name, (extra) => {
            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: promptDef.content,
                  },
                },
              ],
              // Add any other required properties for the MCP protocol here
            };
          });

          // Style the success message
          log(
            chalk.green(
              `   ✅ Registered prompt: ${chalk.bold(promptDef.name)}`
            )
          );
        } else {
          // Style the warning for incorrect format
          logWarn(
            chalk.yellow(
              `   ⚠️ Skipping ${chalk.cyan(
                absoluteFilePath
              )}: Default export does not match expected PromptDefinition structure ({ name: string, content: string }).`
            )
          );
        }
      } catch (importError: any) {
        // Style the import/registration error message
        logError(
          chalk.red(
            `   ❌ Error importing or registering prompt from ${chalk.cyan(
              absoluteFilePath
            )}:`
          )
        );
        logError(importError); // Log the actual error object
      }
    }
  } catch (err: any) {
    // Style the directory scanning error message
    logError(
      chalk.red(`❌ Error scanning directory ${chalk.cyan(baseDirectoryPath)}:`)
    );
    logError(err); // Log the actual error
    // Optionally re-throw if this is a critical failure
    // throw err;
  }
}
