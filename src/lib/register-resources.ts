import chalk from "chalk";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";
import { ResourceConfig } from "../models/resource-config.js"; // Assume que ResourceConfig está correto

const log = console.log; // Ou use o logger do worker
const logError = console.error;
const logWarn = console.warn;

/**
 * Registers a single resource definition onto the MCP server.
 * Assumes the resourceConfig object is valid and loaded.
 * @param server The McpServerDecorator instance.
 * @param resourceConfig The loaded resource definition object (default export).
 * @param filePath Optional: The path of the file for logging purposes.
 */
export function registerResource(
    server: McpServerDecorator,
    resourceConfig: ResourceConfig,
    filePath?: string
): void {
    const logPrefix = filePath ? `[${filePath}] ` : '';

    // Basic validation
    if (
        !resourceConfig ||
        typeof resourceConfig !== "object" ||
        typeof resourceConfig.name !== "string" ||
        !resourceConfig.template ||
        typeof resourceConfig.handler !== "function"
    ) {
         logWarn(
            chalk.yellow(
                `${logPrefix}⚠️ Skipping registration: Invalid or incomplete ResourceConfig structure.`
            )
        );
        return;
    }

    log(chalk.dim(`${logPrefix}Registering resource: ${chalk.bold(resourceConfig.name)}...`));
    try {
        server.resource(
            resourceConfig.name,
            resourceConfig.template,
            resourceConfig.handler
        );
    } catch (error: any) {
        logError(
            chalk.red(
                `${logPrefix}❌ Error registering resource ${chalk.bold(resourceConfig.name)}:`
            ),
            error
        );
    }
}
