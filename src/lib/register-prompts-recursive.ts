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
          continue;
        }

        const promptDef = module.default as PromptDefinition;
        const promptName = promptDef.name;
        const promptDescription = promptDef.description || "";

        if (
          Array.isArray(promptDef.arguments) &&
          promptDef.arguments.length > 0
        ) {
          const argsSchema = createArgsSchema(promptDef.arguments);

          const callback: PromptCallback<PromptArgsRawShape> = (
            args,
            _extra
          ) => {
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
