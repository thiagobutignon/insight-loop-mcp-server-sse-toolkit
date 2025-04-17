import {
  PromptCallback
} from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";
import "dotenv/config";
import { globby } from "globby";
import { pathToFileURL } from "url";
import { z, ZodTypeAny } from "zod";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";

const log = console.log;
const logWarn = console.warn;
const logError = console.error;

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

function replacePlaceholders(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values.hasOwnProperty(key) ? String(values[key]) : match;
  });
}

function createArgsSchema(argsDef: ArgumentDefinition[]): PromptArgsRawShape {
  const schema: PromptArgsRawShape = {};
  for (const arg of argsDef) {
    let argSchema: ZodTypeAny = z.string().describe(arg.description);

    if (!arg.required) {
      argSchema = argSchema.optional();
    }

    schema[arg.name] = argSchema;
  }
  return schema;
}

export async function registerPromptsFromDirectoryRecursive(
  server: McpServerDecorator,
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

  console.log(`[FUNC_LOG] Resolved pattern: ${pattern}`);


  try {
    console.log("[FUNC_LOG] Preparing to call globby...");

    const filePaths = await globby(pattern, {
      absolute: true,
      ignore: ["**/*.d.ts", "**/*.map"],
    });

    console.log(`[FUNC_LOG] globby returned ${filePaths?.length ?? 'undefined'} paths:`, filePaths); // Log result


    if (filePaths.length === 0) {
      logWarn(chalk.yellow("⚠️ No prompt files found matching the pattern."));
      console.log("[FUNC_LOG] Exiting: No files found.");

      return;
    }

    log(
      chalk.blue(
        `💬 Found ${chalk.bold(filePaths.length)} potential prompt files.`
      )
    );

    console.log(`[FUNC_LOG] Found ${filePaths.length} files. Looping...`);

    for (const absoluteFilePath of filePaths) {
      console.log(`[FUNC_LOG] Processing file: ${absoluteFilePath}`);

      const fileUrl = pathToFileURL(absoluteFilePath).href;
      log(
        chalk.dim(
          `📄 Attempting to import prompt from: ${chalk.cyan(absoluteFilePath)}`
        )
      );
      console.log(`[FUNC_LOG] Attempting dynamic import for: ${fileUrl}`);

      try {
        const module = await import(fileUrl);
        console.log("[FUNC_LOG] Dynamic import successful. Module:", module);

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

          console.log(`[FUNC_LOG] Skipping ${absoluteFilePath}: Invalid structure.`);

          continue;
        }

        console.log("[FUNC_LOG] Module structure valid.");

        const promptDef = module.default as PromptDefinition;
        const promptName = promptDef.name;
        const promptDescription = promptDef.description || "";

        if (
          Array.isArray(promptDef.arguments) &&
          promptDef.arguments.length > 0
        ) {
          console.log(`[FUNC_LOG] Prompt ${promptName} has arguments. Creating schema...`);

          const argsSchema = createArgsSchema(promptDef.arguments);

          const callback: PromptCallback<PromptArgsRawShape> = (
            args,
            _extra
          ) => {
            console.log(`[FUNC_LOG] Callback executing for ${promptName} (with args):`, args);

            const processedContent = replacePlaceholders(
              promptDef.content,
              args
            );

            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: processedContent,
                  },
                },
              ],
            };
          };
          console.log(`[FUNC_LOG] Calling server.prompt for ${promptName} (with args)`);

          server.prompt(promptName, promptDescription, argsSchema, callback);
          log(
            chalk.green(
              `   ✅ Registered prompt: ${chalk.bold(
                promptName
              )} (with arguments)`
            )
          );
        } else {
          const callback: PromptCallback = (_extra) => {
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
            };
          };

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
