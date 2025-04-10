import {
  McpServer,
  PromptCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import "dotenv/config";
import { pathToFileURL } from "url";
import { globby } from "globby";
import chalk from "chalk"; // Import chalk
import { z, ZodTypeAny } from "zod"; // Import Zod

// --- Helper Logs ---
const log = console.log;
const logWarn = console.warn;
const logError = console.error;
// ---

// --- Types (as defined above) ---
interface ArgumentDefinition {
  name: string;
  description: string;
  required: boolean;
  // type?: 'string' | 'number' | 'boolean'; // Example for future extension
}
interface PromptDefinition {
  name: string;
  description?: string;
  content: string;
  arguments?: ArgumentDefinition[];
}
type PromptArgsRawShape = { [k: string]: ZodTypeAny };
// ---

/**
 * Helper function to replace placeholders like {{variable}} in a string.
 * @param template The string containing placeholders.
 * @param values An object with key-value pairs for replacement.
 * @returns The string with placeholders replaced.
 */
function replacePlaceholders(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values.hasOwnProperty(key) ? String(values[key]) : match; // Convert value to string
  });
}

/**
 * Creates a Zod schema object from an array of ArgumentDefinitions.
 * Currently assumes all arguments are strings.
 * @param argsDef Array of argument definitions.
 * @returns A Zod schema object compatible with McpServer.
 */
function createArgsSchema(argsDef: ArgumentDefinition[]): PromptArgsRawShape {
  const schema: PromptArgsRawShape = {};
  for (const arg of argsDef) {
    // --- Basic Schema (Assuming String for now) ---
    // You could extend this based on an optional `arg.type` property
    let argSchema: ZodTypeAny = z.string().describe(arg.description);

    // --- Handle Optionality ---
    if (!arg.required) {
      argSchema = argSchema.optional();
    }

    schema[arg.name] = argSchema;
  }
  return schema;
}

/**
 * Recursively scans a directory for prompt definition files (.ts or .js)
 * and registers them with the provided McpServer instance.
 */
export async function registerPromptsFromDirectoryRecursive(
  server: McpServer,
  baseDirectoryPath: string
): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
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
      absolute: true,
      ignore: ["**/*.d.ts", "**/*.map"],
    });

    if (filePaths.length === 0) {
      logWarn(chalk.yellow("⚠️ No prompt files found matching the pattern."));
      return;
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

        // Basic structure check
        if (
          !module.default ||
          typeof module.default !== "object" ||
          typeof module.default.name !== "string" ||
          typeof module.default.content !== "string"
        ) {
          logWarn(
            chalk.yellow(
              `   ⚠️ Skipping ${chalk.cyan(
                absoluteFilePath
              )}: Default export does not match minimum PromptDefinition structure ({ name: string, content: string }).`
            )
          );
          continue; // Skip this file
        }

        const promptDef = module.default as PromptDefinition;
        const promptName = promptDef.name;
        const promptDescription = promptDef.description || ""; // Use description if provided

        // --- Check for Arguments ---
        if (
          Array.isArray(promptDef.arguments) &&
          promptDef.arguments.length > 0
        ) {
          // --- Prompt WITH Arguments ---
          const argsSchema = createArgsSchema(promptDef.arguments);

          // Define the callback that receives validated arguments
          const callback: PromptCallback<PromptArgsRawShape> = (
            args,
            _extra
          ) => {
            // Replace placeholders in the content with actual argument values
            const processedContent = replacePlaceholders(
              promptDef.content,
              args
            );

            return {
              messages: [
                {
                  role: "user", // Or system, depending on your structure
                  content: {
                    type: "text",
                    text: processedContent,
                  },
                },
              ],
              // Add any other required properties for the MCP protocol here
            };
          };

          // Register using the overload with description and argsSchema
          server.prompt(promptName, promptDescription, argsSchema, callback);
          log(
            chalk.green(
              `   ✅ Registered prompt: ${chalk.bold(
                promptName
              )} (with arguments)`
            )
          );
        } else {
          // --- Prompt WITHOUT Arguments ---
          const callback: PromptCallback = (_extra) => {
            // No arguments, just return the static content
            return {
              messages: [
                {
                  role: "user", // Or system
                  content: {
                    type: "text",
                    text: promptDef.content,
                  },
                },
              ],
              // Add any other required properties for the MCP protocol here
            };
          };

          // Register using the overload with description (if provided)
          if (promptDescription) {
            server.prompt(promptName, promptDescription, callback);
          } else {
            server.prompt(promptName, callback);
          }
          log(
            chalk.green(
              `   ✅ Registered prompt: ${chalk.bold(
                promptName
              )} (no arguments)`
            )
          );
        }
      } catch (importError: any) {
        logError(
          chalk.red(
            `   ❌ Error importing or registering prompt from ${chalk.cyan(
              absoluteFilePath
            )}:`
          )
        );
        logError(importError);
      }
    }
  } catch (err: any) {
    logError(
      chalk.red(`❌ Error scanning directory ${chalk.cyan(baseDirectoryPath)}:`)
    );
    logError(err);
  }
}
