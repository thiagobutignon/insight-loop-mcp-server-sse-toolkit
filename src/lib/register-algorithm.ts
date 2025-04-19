import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import chalk from "chalk";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";
import { AlgorithmConfig } from "../models/algorithm-config.js"; // Assume que AlgorithmConfig está correto

const log = console.log; // Ou use o logger do worker
const logError = console.error;
const logWarn = console.warn;

/**
 * Registers a single algorithm definition onto the MCP server decorator.
 * Assumes the algorithmConfig object is valid and loaded.
 * @param server The McpServerDecorator instance.
 * @param algorithmConfig The loaded algorithm definition object (default export).
 * @param filePath Optional: The path of the file for logging purposes.
 */
export function registerAlgorithm(
    server: McpServerDecorator,
    algorithmConfig: AlgorithmConfig,
    filePath?: string
): void {
    const logPrefix = filePath ? `[${filePath}] ` : '';

    // Basic validation
     if (
        !algorithmConfig ||
        typeof algorithmConfig !== "object" ||
        typeof algorithmConfig.name !== "string" ||
        typeof algorithmConfig.handler !== "function"
    ) {
        logWarn(
            chalk.yellow(
                `${logPrefix}⚠️ Skipping registration: Invalid or incomplete AlgorithmConfig structure.`
            )
        );
        return;
    }

    log(chalk.dim(`${logPrefix}Registering algorithm: ${chalk.bold(algorithmConfig.name)}...`));
    try {
        if (algorithmConfig.paramsSchema) {
            const typedHandler = algorithmConfig.handler as (args: any, extra: RequestHandlerExtra) => any;
            if (algorithmConfig.description) {
                server.algorithm(
                    algorithmConfig.name,
                    algorithmConfig.description,
                    algorithmConfig.paramsSchema,
                    typedHandler
                );
            } else {
                server.algorithm(
                    algorithmConfig.name,
                    algorithmConfig.paramsSchema,
                    typedHandler
                );
            }
        } else {
            const typedHandler = algorithmConfig.handler as (extra: RequestHandlerExtra) => any;
            if (algorithmConfig.description) {
                server.algorithm(
                    algorithmConfig.name,
                    algorithmConfig.description,
                    typedHandler
                );
            } else {
                server.algorithm(
                    algorithmConfig.name,
                    typedHandler
                );
            }
        }
    } catch (error: any) {
       logError(
            chalk.red(
                `${logPrefix}❌ Error registering algorithm ${chalk.bold(algorithmConfig.name)}:`
            ),
            error
        );
       // throw error; // Opcional
    }
}
