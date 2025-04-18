import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import chalk from "chalk";
import "dotenv/config";
import { globby } from "globby";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";
import { AlgorithmConfig } from "../models/algorithm-config.js";

const log = console.log;
const logWarn = console.warn;
const logError = console.error;


/**
 * Registers a single algorithm
 */
function registerAlgorithm(server: McpServerDecorator, algorithm: AlgorithmConfig): void {
    try {
      if (algorithm.paramsSchema) {
        // For algorithms with parameters schema
        const typedHandler = algorithm.handler as (args: any, extra: RequestHandlerExtra) => any;
        
        if (algorithm.description) {
          server.algorithm(
            algorithm.name,
            algorithm.description,
            algorithm.paramsSchema,
            typedHandler
          );
        } else {
          server.algorithm(
            algorithm.name,
            algorithm.paramsSchema,
            typedHandler
          );
        }
      } else {
        // For algorithms without parameters schema
        const typedHandler = algorithm.handler as (extra: RequestHandlerExtra) => any;
        
        if (algorithm.description) {
          server.algorithm(
            algorithm.name,
            algorithm.description,
            typedHandler
          );
        } else {
          server.algorithm(
            algorithm.name,
            typedHandler
          );
        }
      }
    } catch (error) {
      logError(chalk.red(`Error registering algorithm ${algorithm.name}:`), error);
      throw error;
    }
  }
/**
 * Dynamically loads and registers algorithms from the algorithms directory
 */
export async function registerDynamicAlgorithms(
  server: McpServerDecorator,
  baseDirectoryPath?: string
): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const algorithmsDir = baseDirectoryPath || __dirname;
  
  const isDev = process.env.NODE_ENV !== "production";
  const pattern = isDev
    ? `${algorithmsDir}/**/*.ts`
    : `${algorithmsDir}/**/*.js`;
    
  log(
    chalk.blue(
      `🔍 Searching for algorithm files with pattern: ${chalk.cyan(pattern)}`
    )
  );
  
  try {
    const filePaths = await globby(pattern, {
      absolute: true,
      ignore: ["**/*.d.ts", "**/*.map", "**/index.ts", "**/index.js", "**/types.ts", "**/types.js"],
    });
    
    if (filePaths.length === 0) {
      logWarn(chalk.yellow("⚠️ No algorithm files found matching the pattern."));
      return;
    }
    
    log(
      chalk.blue(
        `🧮 Found ${chalk.bold(filePaths.length)} potential algorithm files.`
      )
    );
    
    for (const absoluteFilePath of filePaths) {
      const fileUrl = pathToFileURL(absoluteFilePath).href;
      log(
        chalk.dim(
          `📄 Attempting to import algorithm from: ${chalk.cyan(absoluteFilePath)}`
        )
      );
      
      try {
        const module = await import(fileUrl);
        if (
          !module.default ||
          typeof module.default !== "object" ||
          typeof module.default.name !== "string" ||
          typeof module.default.handler !== "function"
        ) {
          logWarn(
            chalk.yellow(
              `   ⚠️ Skipping ${chalk.cyan(
                absoluteFilePath
              )}: Default export does not match AlgorithmConfig structure ({ name: string, handler: function }).`
            )
          );
          continue;
        }
        
        const algorithm: AlgorithmConfig = module.default;
        
        // Register the algorithm
        registerAlgorithm(server, algorithm);
        
        log(
          chalk.green(
            `   ✅ Registered algorithm: ${chalk.bold(algorithm.name)}`
          )
        );
      } catch (importError: any) {
        logError(
          chalk.red(
            `   ❌ Error importing or registering algorithm from ${chalk.cyan(
              absoluteFilePath
            )}:`
          )
        );
        logError(importError);
      }
    }
  } catch (err: any) {
    logError(
      chalk.red(`❌ Error scanning directory ${chalk.cyan(algorithmsDir)}:`)
    );
    logError(err);
  }
}