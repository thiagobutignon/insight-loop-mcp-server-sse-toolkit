import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolDefinition } from "./tool-definition.js";
import "dotenv/config";
import { pathToFileURL } from "url";
import { globby } from "globby";
import chalk from "chalk"; // Import chalk

// --- Helper Logs ---
const log = console.log;
const logWarn = console.warn;
const logError = console.error;
// ---

export async function registerToolsFromDirectoryRecursive(
  server: McpServer,
  baseDirectoryPath: string
): Promise<void> {
  const isDev = process.env.NODE_ENV !== "PRODUCTION";

  // Define the search pattern
  const pattern = isDev
    ? `${baseDirectoryPath}/**/*.ts`
    : `${baseDirectoryPath}/**/*.js`;

  // Use chalk for styling the log message
  log(
    chalk.blue(
      `🔍 Searching for tool files with pattern: ${chalk.cyan(pattern)}`
    )
  );

  try {
    const filePaths = await globby(pattern, {
      absolute: true, // Ensure absolute paths are returned
      ignore: ["**/*.d.ts", "**/*.map"], // Use globby's ignore option
    });

    if (filePaths.length === 0) {
      // Style the warning message
      logWarn(chalk.yellow("⚠️ No tool files found matching the pattern."));
      return; // Exit early if no files found
    }

    log(
      chalk.blue(
        `💎 Found ${chalk.bold(filePaths.length)} potential tool files.`
      )
    );

    for (const absoluteFilePath of filePaths) {
      // No need for the .d.ts or .map check here anymore due to globby ignore

      const fileUrl = pathToFileURL(absoluteFilePath).href;
      // Style the import attempt message - dim is good for repetitive logs
      log(
        chalk.dim(
          `⚒️ Attempting to import tool from: ${chalk.cyan(absoluteFilePath)}`
        )
      );

      try {
        const module = await import(fileUrl);

        // Check if the default export looks like a ToolDefinition
        if (
          module.default &&
          typeof module.default === "object" &&
          module.default.name && // Check for required properties
          module.default.handler &&
          module.default.inputSchema
          // Note: description is optional in McpServer.tool, but good practice to have
        ) {
          const tool = module.default as ToolDefinition<any, any>;
          // Style the success message
          log(chalk.green(`   ✅ Registered tool: ${chalk.bold(tool.name)}`));
          server.tool(
            tool.name,
            tool.description || `${tool.name} tool`, // Provide default description if missing
            tool.inputSchema,
            tool.handler
          );
        } else {
          // Style the warning for incorrect format
          logWarn(
            chalk.yellow(
              `   ⚠️ Skipping ${chalk.cyan(
                absoluteFilePath
              )}: Default export does not match expected ToolDefinition structure.`
            )
          );
        }
      } catch (importError: any) {
        // Style the import/registration error message
        logError(
          chalk.red(
            `   ❌ Error importing or registering tool from ${chalk.cyan(
              absoluteFilePath
            )}:`
          )
        );
        // Log the actual error object separately for clarity
        logError(importError);
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
