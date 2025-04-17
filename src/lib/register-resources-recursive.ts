import chalk from "chalk";
import "dotenv/config";
import { globby } from "globby";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { McpServerDecorator } from "../decorators/mcp-server-decorator.js";
import { ResourceConfig } from "../models/resource-config.js";


const log = console.log;
const logWarn = console.warn;
const logError = console.error;

/**
 * Dynamically loads and registers resources from the resources directory
 */
export async function registerDynamicResources(
  server: McpServerDecorator,
  baseDirectoryPath?: string
): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const resourcesDir = baseDirectoryPath || __dirname;
  
  const isDev = process.env.NODE_ENV !== "production";
  const pattern = isDev
    ? `${resourcesDir}/**/*.ts`
    : `${resourcesDir}/**/*.js`;
    
  log(
    chalk.blue(
      `🔍 Searching for resource files with pattern: ${chalk.cyan(pattern)}`
    )
  );
  
  try {
    const filePaths = await globby(pattern, {
      absolute: true,
      ignore: ["**/*.d.ts", "**/*.map", "**/index.ts", "**/index.js", "**/types.ts", "**/types.js"],
    });
    
    if (filePaths.length === 0) {
      logWarn(chalk.yellow("⚠️ No resource files found matching the pattern."));
      return;
    }
    
    log(
      chalk.blue(
        `📦 Found ${chalk.bold(filePaths.length)} potential resource files.`
      )
    );
    
    for (const absoluteFilePath of filePaths) {
      const fileUrl = pathToFileURL(absoluteFilePath).href;
      log(
        chalk.dim(
          `📄 Attempting to import resource from: ${chalk.cyan(absoluteFilePath)}`
        )
      );
      
      try {
        const module = await import(fileUrl);
        if (
          !module.default ||
          typeof module.default !== "object" ||
          typeof module.default.name !== "string" ||
          !module.default.template ||
          typeof module.default.handler !== "function"
        ) {
          logWarn(
            chalk.yellow(
              `   ⚠️ Skipping ${chalk.cyan(
                absoluteFilePath
              )}: Default export does not match ResourceConfig structure ({ name: string, template: ResourceTemplate|string, handler: function }).`
            )
          );
          continue;
        }
        
        const resource: ResourceConfig = module.default;
        
        // Register the resource
        server.resource(
          resource.name,
          resource.template,
          resource.handler
        );
        
        log(
          chalk.green(
            `   ✅ Registered resource: ${chalk.bold(resource.name)}`
          )
        );
      } catch (importError: any) {
        logError(
          chalk.red(
            `   ❌ Error importing or registering resource from ${chalk.cyan(
              absoluteFilePath
            )}:`
          )
        );
        logError(importError);
      }
    }
  } catch (err: any) {
    logError(
      chalk.red(`❌ Error scanning directory ${chalk.cyan(resourcesDir)}:`)
    );
    logError(err);
  }
}