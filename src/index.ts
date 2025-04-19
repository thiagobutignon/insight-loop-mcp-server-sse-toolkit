import chalk from "chalk";
import 'dotenv/config';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { getDomainConfigurationFromAI } from "./ai/mcp-orchestrator.js";
import { discoverAllAssets } from "./lib/assets-discovery.js";
import { loadDomainConfig, saveDomainConfig } from "./lib/config-manager.js";

const log = console.log;
const logError = console.error;
const logWarn = console.warn;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_PORT = 6999;
const MIN_PORT = 6000;

async function main() {
  log(chalk.bold.cyan("🚀 Starting Multi-Domain MCP Server Orchestrator..."));

  let domainConfigs;
  const configFilePath = path.resolve(__dirname); // Salva/Carrega config na pasta raiz (ou 'dist' após build)

  try {
    // 1. Tenta carregar a configuração existente
    log(chalk.blue("🔄 Attempting to load existing domain configuration..."));
    domainConfigs = await loadDomainConfig(configFilePath);

    if (!domainConfigs || domainConfigs.length === 0) {
      log(chalk.yellow("⚠️ No existing configuration found or configuration is empty. Generating new configuration..."));

      // 2. Descobrir Ativos
      const allAssets = await discoverAllAssets(__dirname);
      if (allAssets.length === 0) {
        logWarn(chalk.yellow("⚠️ No assets (tools, prompts, resources, algorithms) found. Cannot create domains."));
        return;
      }

      // 3. Chamar IA para obter configuração
      domainConfigs = await getDomainConfigurationFromAI(allAssets);

      // 4. Salvar a configuração gerada
      await saveDomainConfig(domainConfigs, configFilePath);
    } else {
        log(chalk.green("✅ Successfully loaded existing domain configuration."));
    }

    // 5. Determinar número de workers
    const numCpus = os.cpus().length;
    const numDomains = domainConfigs.length;
    const numWorkers = Math.min(numDomains, numCpus, MAX_PORT - MIN_PORT + 1);

    log(chalk.blue(`⚙️ System has ${numCpus} CPU threads.`));
    log(chalk.blue(`📊 Configuration defines ${numDomains} domains.`));
    if (numWorkers < numDomains) {
        logWarn(chalk.yellow(`⚠️ Will start ${numWorkers} servers due to CPU thread limit (${numCpus}) or port range limit. Some domains might not be started.`));
    } else {
        log(chalk.blue(`🚀 Starting ${numWorkers} MCP domain servers...`));
    }


    // 6. Iniciar Workers
    const workerScriptPath = path.resolve(__dirname, 'mcp-worker.ts'); // Aponta para o JS compilado
    for (let i = 0; i < numWorkers; i++) {
      const domainConfig = domainConfigs[i];
      const port = MIN_PORT + i;

      const workerData = {
        domainName: domainConfig.domainName,
        port: port,
        assets: domainConfig.assets, // Passa os caminhos dos arquivos
        basePath: __dirname // Passa o diretório base para resolução de caminhos no worker
      };

      log(chalk.magenta(`  -> Spawning worker for domain '${chalk.bold(domainConfig.domainName)}' on port ${chalk.yellow(port)}...`));

      const nodeOptions = `--import tsx`;
      const worker = new Worker(workerScriptPath, { workerData, 
        
        env: { // <-- TENTATIVA 2: Usar env para definir NODE_OPTIONS
          ...process.env, // Herda o ambiente atual
          NODE_OPTIONS: nodeOptions + (process.env.NODE_OPTIONS ? ` ${process.env.NODE_OPTIONS}` : '') // Adiciona nossas opções
      }
       });

      worker.on('online', () => {
        log(chalk.green(`  ✅ Worker for domain '${chalk.bold(domainConfig.domainName)}' (Port: ${port}) is online.`));
      });

      worker.on('message', (msg) => {
        log(chalk.gray(`  [Worker ${domainConfig.domainName}]: ${msg}`));
      });

      worker.on('error', (err) => {
        logError(chalk.red(`  ❌ Error in worker for domain '${chalk.bold(domainConfig.domainName)}' (Port: ${port}):`), err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          logError(chalk.red(`  🛑 Worker for domain '${chalk.bold(domainConfig.domainName)}' (Port: ${port}) stopped with exit code ${code}.`));
        } else {
          log(chalk.yellow(`  🚪 Worker for domain '${chalk.bold(domainConfig.domainName)}' (Port: ${port}) exited cleanly.`));
        }
      });
    }

  } catch (error) {
    logError(chalk.red.bold("💥 Orchestrator failed to start:"), error);
    process.exit(1); // Sai se a orquestração falhar
  }
}

main();