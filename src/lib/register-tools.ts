import chalk from "chalk";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";
import { ToolDefinition } from "../models/tool-definition.js"; // Assume que ToolDefinition está correto

const log = console.log; // Ou use o logger do worker se chamado de lá
const logError = console.error;
const logWarn = console.warn;

/**
 * Registers a single tool definition onto the MCP server.
 * Assumes the toolDefinition object is valid and loaded.
 * @param server The McpServerDecorator instance.
 * @param toolDefinition The loaded tool definition object (default export).
 * @param filePath Optional: The path of the file for logging purposes.
 */
export function registerTool(
    server: McpServerDecorator,
    toolDefinition: ToolDefinition<any, any>,
    filePath?: string
): void {
    const logPrefix = filePath ? `[${filePath}] ` : '';

    // Basic validation of the loaded definition
    if (
        !toolDefinition ||
        typeof toolDefinition !== "object" ||
        !toolDefinition.name ||
        !toolDefinition.handler ||
        !toolDefinition.inputSchema
    ) {
        logWarn(
            chalk.yellow(
                `${logPrefix}⚠️ Skipping registration: Invalid or incomplete ToolDefinition structure.`
            )
        );
        return;
    }

    try {
        log(chalk.dim(`${logPrefix}Registering tool: ${chalk.bold(toolDefinition.name)}...`));
        server.tool(
            toolDefinition.name,
            toolDefinition.description || `${toolDefinition.name} tool`, // Default description
            toolDefinition.inputSchema,
            toolDefinition.handler
        );
        // Log de sucesso agora é feito no worker após a chamada
    } catch (error: any) {
        logError(
            chalk.red(
                `${logPrefix}❌ Error registering tool ${chalk.bold(toolDefinition.name)}:`
            ),
            error
        );
        // Decide se deve relançar o erro ou apenas logar
        // throw error; // Opcional: parar o worker se um registro falhar
    }
}