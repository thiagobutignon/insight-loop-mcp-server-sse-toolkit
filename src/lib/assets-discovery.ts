import { globby } from "globby";
import path from "path";
import { pathToFileURL } from "url";

// Tipos simplificados para o exemplo
export interface AssetInfo {
  type: 'tool' | 'prompt' | 'resource' | 'algorithm';
  filePath: string;
  name?: string; // Extrair nome se possível para a IA
  description?: string; // Extrair descrição se possível
  // Outros metadados relevantes para a IA podem ser adicionados
}

async function discoverAssetsInDirectory(baseDirectoryPath: string, assetType: AssetInfo['type']): Promise<AssetInfo[]> {
  const isDev = process.env.NODE_ENV !== "production";
  const pattern = isDev ? `${baseDirectoryPath}/**/*.ts` : `${baseDirectoryPath}/**/*.js`;
  const ignorePatterns = ["**/*.d.ts", "**/*.map", "**/index.ts", "**/index.js", "**/types.ts", "**/types.js"];

  const filePaths = await globby(pattern, { absolute: true, ignore: ignorePatterns });

  const assets: AssetInfo[] = [];
  for (const filePath of filePaths) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      // Tenta extrair nome/descrição do export default
      const name = module.default?.name;
      const description = module.default?.description;
      assets.push({ type: assetType, filePath, name, description });
    } catch (error) {
      console.warn(`Could not import or process ${filePath}: ${error}`);
    }
  }
  return assets;
}

export async function discoverAllAssets(basePath: string): Promise<AssetInfo[]> {
  const toolsDir = path.resolve(basePath, "tools");
  const promptsDir = path.resolve(basePath, "prompts");
  const resourcesDir = path.resolve(basePath, "resources");
  const algorithmsDir = path.resolve(basePath, "algorithms");

  console.log("Discovering assets...");
  const tools = await discoverAssetsInDirectory(toolsDir, 'tool');
  const prompts = await discoverAssetsInDirectory(promptsDir, 'prompt');
  const resources = await discoverAssetsInDirectory(resourcesDir, 'resource');
  const algorithms = await discoverAssetsInDirectory(algorithmsDir, 'algorithm');
  console.log(`Discovered: ${tools.length} tools, ${prompts.length} prompts, ${resources.length} resources, ${algorithms.length} algorithms.`);

  return [...tools, ...prompts, ...resources, ...algorithms];
}