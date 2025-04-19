import { PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";
import { z, ZodTypeAny } from "zod";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";

const log = console.log; // Ou use o logger do worker
const logError = console.error;
const logWarn = console.warn;

// Reutilizar interfaces ou importá-las se estiverem em models
interface ArgumentDefinition {
    name: string;
    description: string;
    required: boolean;
}
interface PromptDefinition {
    name: string;
    description?: string;
    content: string;
    arguments?: ArgumentDefinition[];
}
type PromptArgsRawShape = { [k: string]: ZodTypeAny };

// Funções auxiliares podem permanecer ou ser movidas se usadas em outro lugar
function replacePlaceholders(template: string, values: Record<string, any>): string {
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

/**
 * Registers a single prompt definition onto the MCP server.
 * Assumes the promptDefinition object is valid and loaded.
 * @param server The McpServerDecorator instance.
 * @param promptDef The loaded prompt definition object (default export).
 * @param filePath Optional: The path of the file for logging purposes.
 */
export function registerPrompt(
    server: McpServerDecorator,
    promptDef: PromptDefinition,
    filePath?: string
): void {
    const logPrefix = filePath ? `[${filePath}] ` : '';

    // Basic validation
    if (
        !promptDef ||
        typeof promptDef !== "object" ||
        typeof promptDef.name !== "string" ||
        typeof promptDef.content !== "string"
    ) {
        logWarn(
            chalk.yellow(
                `${logPrefix}⚠️ Skipping registration: Invalid or incomplete PromptDefinition structure.`
            )
        );
        return;
    }

    const promptName = promptDef.name;
    const promptDescription = promptDef.description || "";
    log(chalk.dim(`${logPrefix}Registering prompt: ${chalk.bold(promptName)}...`));

    try {
        if (Array.isArray(promptDef.arguments) && promptDef.arguments.length > 0) {
            const argsSchema = createArgsSchema(promptDef.arguments);
            const callback: PromptCallback<PromptArgsRawShape> = (args, _extra) => {
                const processedContent = replacePlaceholders(promptDef.content, args);
                return { messages: [{ role: "user", content: { type: "text", text: processedContent } }] };
            };
            server.prompt(promptName, promptDescription, argsSchema, callback);
        } else {
            const callback: PromptCallback = (_extra) => {
                return { messages: [{ role: "user", content: { type: "text", text: promptDef.content } }] };
            };
            if (promptDescription) {
                server.prompt(promptName, promptDescription, callback);
            } else {
                server.prompt(promptName, callback);
            }
        }
    } catch (error: any) {
         logError(
            chalk.red(
                `${logPrefix}❌ Error registering prompt ${chalk.bold(promptName)}:`
            ),
            error
        );
        // throw error; // Opcional
    }
}
