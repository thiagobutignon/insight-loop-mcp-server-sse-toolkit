import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import chalk from "chalk";
import express, { Request, Response } from "express";
import ora from "ora";
import path from 'path';
import { pathToFileURL } from 'url';
import { v4 as uuid } from "uuid";
import { parentPort, workerData } from "worker_threads";
import { McpServerDecorator } from "./decorators/mcp-server-decorator.js";
import { dynamicCorsMiddleware } from "./middlewares/dynamic-cors-middleware.js";

// --- Importar funções de registro INDIVIDUAIS refatoradas ---


// --- Tipos e Interfaces (ajustar conforme necessário) ---
import { ToolDefinition } from "./models/tool-definition.js";
// Importar outras definições se necessário para type checking (PromptDefinition, etc.)
import { registerAlgorithm } from "./lib/register-algorithm.js";
import { registerPrompt } from "./lib/register-prompts.js";
import { registerResource } from "./lib/register-resources.js";
import { registerTool } from "./lib/register-tools.js";
import { AlgorithmConfig } from "./models/algorithm-config.js";
import { ResourceConfig } from "./models/resource-config.js";
// Importar PromptDefinition se definida em um arquivo de modelo
interface PromptDefinition { name: string; content: string; description?: string; arguments?: any[]; }


// --- Logging para o Parent ---
const log = (message: string) => parentPort?.postMessage(`[${workerData.domainName}] ${message}`);
const logError = (message: string, error?: any) => {
    const errorString = error instanceof Error ? error.stack : JSON.stringify(error);
    parentPort?.postMessage(`[${workerData.domainName}] ERROR: ${message} ${errorString ? `\n${errorString}` : ''}`);
};
const logWarn = (message: string) => parentPort?.postMessage(`[${workerData.domainName}] WARN: ${message}`);

// --- Dados do Worker ---
interface WorkerData {
    domainName: string;
    port: number;
    assets: {
        tools: string[];
        prompts: string[];
        resources: string[];
        algorithms: string[];
    };
    basePath: string; // Diretório base para resolver caminhos relativos
}
const { domainName, port, assets, basePath } = workerData as WorkerData;

// --- Estado Local do Worker ---
const servers = new Map<string, McpServerDecorator>();
const transports = new Map<string, SSEServerTransport>();

// --- Função de Criação de Servidor para Este Worker/Domínio ---
async function createDomainMcpServer(): Promise<McpServerDecorator> {
    const server = McpServerDecorator.create({
        name: `mcp-domain-${domainName}`,
        version: "1.0.0",
    });

    log(chalk.blue(`🛠️ Registering assets for domain: ${chalk.cyan(domainName)}`));
    const spinner = ora(`Loading and registering assets...`).start();
    let successCount = 0;
    let failCount = 0;

    // Função auxiliar para importar e registrar um único asset
    async function importAndRegister(assetPath: string, type: keyof WorkerData['assets']) {
        const absolutePath = path.resolve(basePath, assetPath); // Garante caminho absoluto
        const relativePath = path.relative(basePath, absolutePath); // Para logs mais curtos
        spinner.text = `Registering ${type}: ${chalk.cyan(relativePath)}`;
        try {
            const fileUrl = pathToFileURL(absolutePath).href;
            const module = await import(fileUrl);

            if (!module || !module.default) {
                throw new Error(`No default export found in ${relativePath}`);
            }
            const definition = module.default;

            // Chamar a função de registro específica
            switch (type) {
                case 'tools':
                    registerTool(server, definition as ToolDefinition<any, any>, relativePath);
                    break;
                case 'prompts':
                    registerPrompt(server, definition as PromptDefinition, relativePath);
                    break;
                case 'resources':
                    registerResource(server, definition as ResourceConfig, relativePath);
                    break;
                case 'algorithms':
                    registerAlgorithm(server, definition as AlgorithmConfig, relativePath);
                    break;
                default:
                    throw new Error(`Unknown asset type: ${type}`);
            }
            successCount++;
        } catch (error: any) {
            failCount++;
            logError(`Failed to import or register ${type} from ${relativePath}`, error);
            // Não parar o worker, apenas logar a falha
        }
    }

    // Registrar todos os assets para este domínio
    for (const toolPath of assets.tools) await importAndRegister(toolPath, 'tools');
    for (const promptPath of assets.prompts) await importAndRegister(promptPath, 'prompts');
    for (const resourcePath of assets.resources) await importAndRegister(resourcePath, 'resources');
    for (const algoPath of assets.algorithms) await importAndRegister(algoPath, 'algorithms');

    if (failCount > 0) {
        spinner.fail(chalk.red(`Registered ${successCount} assets for domain ${chalk.cyan(domainName)}, but ${failCount} failed.`));
    } else if (successCount > 0) {
        spinner.succeed(chalk.green(`Successfully registered ${successCount} assets for domain ${chalk.cyan(domainName)}.`));
    } else {
         spinner.warn(chalk.yellow(`No assets found or registered for domain ${chalk.cyan(domainName)}.`));
    }

    return server;
}


// --- Configuração do Express para Este Worker ---
async function startServer() {
    const app = express();
    app.use(dynamicCorsMiddleware);
    app.use(express.urlencoded({ extended: true }));

    let domainMcpServer: McpServerDecorator;
    try {
        domainMcpServer = await createDomainMcpServer();
         // Log extra para confirmar que o server foi criado (mesmo sem assets)
         if (!domainMcpServer) throw new Error("MCP Server creation unexpectedly failed.");
         log(chalk.dim(`MCP Server instance created for domain ${domainName}.`));
    } catch (error) {
        logError("Critical failure during MCP server initialization for domain.", error);
        process.exit(1);
    }

    // Endpoints /sse e /messages (semelhantes à versão anterior, usando domainMcpServer)
     app.get("/sse", async (req: Request, res: Response) => {
        res.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        const uniqueId = uuid();

        try {
            servers.set(uniqueId, domainMcpServer); // Referência à única instância

            const transport = new SSEServerTransport("/messages", res);
            const sessionId = transport.sessionId;
            transports.set(sessionId, transport);

            log(chalk.green(`🔌 New connection: ${chalk.yellow(sessionId)}`));

            res.on("close", () => {
                log(chalk.yellow(`🔌 Connection closed: ${chalk.yellow(sessionId)}`));
                transports.delete(sessionId);
                servers.delete(uniqueId);
                log(chalk.dim(`   Resources released for ${chalk.yellow(sessionId)}`));
            });

            await domainMcpServer.connect(transport);
            log(chalk.dim(`🚌 Transport connected for ${chalk.yellow(sessionId)}`));

        } catch (error: any) {
            logError(chalk.red("Error during SSE connection setup:"), error.message);
            servers.delete(uniqueId);
             if (!res.headersSent) {
                 res.status(500).end("Server setup error");
             } else {
                 res.end();
            }
        }
    });

    app.post("/messages", async (req: Request, res: Response) => {
        res.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        const sessionId = req.query.sessionId as string;
        if (!sessionId) {
            logWarn("⚠️ SessionId missing in request.");
            return res.status(400).send("Missing sessionId parameter");
        }

        const transport = transports.get(sessionId);
        if (!transport) {
            logWarn(`⚠️ Transport not found for sessionId: ${chalk.yellow(sessionId)}`);
            return res.status(400).send("Transport not found for sessionId");
        }

        try {
            await transport.handlePostMessage(req, res);
        } catch (error: any) {
            logError(`Error processing message for ${chalk.yellow(sessionId)}:`, error);
            if (!res.headersSent) {
                res.status(500).send("Error processing message");
            } else {
                res.end();
            }
        }
    });

    // Middleware de erro
    app.use((err: any, req: Request, res: Response, next: Function) => {
        logError("Unhandled error in worker request handler:", err);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        } else {
            res.end();
        }
    });


    app.listen(port, () => {
        log(chalk.bold.green(`✅ Domain '${chalk.cyan(domainName)}' server ready and listening on port ${chalk.yellow(port)}`));
        parentPort?.postMessage(`READY:${domainName}:${port}`);
    });
}

// --- Iniciar o Servidor do Worker ---
startServer().catch(err => {
    logError(chalk.red.bold(`💥 Worker failed to start unexpectedly:`), err);
    process.exit(1);
});