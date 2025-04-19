import fs from 'fs/promises';
import path from 'path';
import { DomainConfig } from '../ai/mcp-orchestrator.js';

const CONFIG_FILE = 'mcp-domain-config.json';

export async function saveDomainConfig(config: DomainConfig[], basePath: string = '.'): Promise<void> {
  const filePath = path.resolve(basePath, CONFIG_FILE);
  try {
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Domain configuration saved to ${filePath}`);
  } catch (error) {
    console.error(`Failed to save domain configuration to ${filePath}:`, error);
    throw error;
  }
}

export async function loadDomainConfig(basePath: string = '.'): Promise<DomainConfig[]> {
  const filePath = path.resolve(basePath, CONFIG_FILE);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);
     // Validação adicional aqui se necessário
    console.log(`Domain configuration loaded from ${filePath}`);
    return config as DomainConfig[];
  } catch (error) {
    console.error(`Failed to load domain configuration from ${filePath}:`, error);
    // Se o arquivo não existir, talvez retornar um array vazio ou lançar erro?
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`Configuration file ${filePath} not found.`);
        return []; // Retorna vazio se não encontrar, para tentar gerar
    }
    throw error;
  }
}