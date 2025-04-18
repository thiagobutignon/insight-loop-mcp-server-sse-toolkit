import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import chalk from "chalk";
import express, { NextFunction, Request, Response } from "express";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { McpServerDecorator } from "./decorators/mcp-server-decorator.js";
import { registerDynamicAlgorithms } from "./lib/register-algorithm-recursive.js";
import { registerPromptsFromDirectoryRecursive } from "./lib/register-prompts-recursive.js";
import { registerDynamicResources } from "./lib/register-resources-recursive.js";
import { registerToolsFromDirectoryRecursive } from "./lib/register-tools-recursive.js";
import { dynamicCorsMiddleware } from "./middlewares/dynamic-cors-middleware.js";

const log = console.log;
const logError = console.error;
const logWarn = console.warn;

const servers = new Map<string, McpServerDecorator>();
const transports = new Map<string, SSEServerTransport>();

async function createMcpServer(): Promise<McpServerDecorator> {
  const server = McpServerDecorator.create({
    name: "insight-loop-mcp-server-sse",
    version: "1.0.0",
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const toolsDir = path.resolve(__dirname, "tools");
  const promptsDir = path.resolve(__dirname, "prompts");
  const resourcesDir = path.resolve(__dirname, "resources");
  const algorithmsDir = path.resolve(__dirname, "algorithms");

  const spinner = ora(
    `Registering tools from ${chalk.cyan(toolsDir)}...`
  ).start();
  try {
    await registerToolsFromDirectoryRecursive(server, toolsDir);
    spinner.succeed(chalk.green("⚙️  Tools register successful"));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to register the tools: ${error.message}`));
    throw error;
  }

  const promptSpinner = ora(`Registering prompts: ${chalk.cyan(promptsDir)}...`).start();
  try {
    await registerPromptsFromDirectoryRecursive(server, promptsDir);
    promptSpinner.succeed(chalk.green(`💬 Prompts registered successfully.`));
  } catch (error: any) {
    promptSpinner.fail(
      chalk.red(`Failed to register prompts: ${error.message}`)
    );
    logError(error); 
    throw error;
  }

  const resourcesSpinner = ora(`Registering resources...`).start();
  try {
    await registerDynamicResources(server, resourcesDir);
    
    resourcesSpinner.succeed(chalk.green(`📦 Resources registered successfully.`));
  } catch (error: any) {
    resourcesSpinner.fail(
      chalk.red(`Failed to register resources: ${error.message}`)
    );
    logError(error);
    throw error;
  }
  
  const algorithmsSpinner = ora(`Registering algorithms...`).start();
  try {
    await registerDynamicAlgorithms(server, algorithmsDir);
    
    algorithmsSpinner.succeed(chalk.green(`🧮 Algorithms registered successfully.`));
  } catch (error: any) {
    algorithmsSpinner.fail(
      chalk.red(`Failed to register algorithms: ${error.message}`)
    );
    logError(error);
    throw error;
  }

  return server;
}

const app = express();

app.use(dynamicCorsMiddleware);

app.use(express.urlencoded({ extended: true }));

app.get("/sse", async (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const uniqueId = uuid();
  let mcpServer: McpServerDecorator;

  try {
    const serverSpinner = ora("Initializing new MCP session...").start();
    mcpServer = await createMcpServer();
    servers.set(uniqueId, mcpServer);
    serverSpinner.succeed(
      chalk.blue(`🖥️  MCP server instance created for session.`)
    );


    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    log(
      chalk.green(`🔌 New connection established: ${chalk.yellow(sessionId)}`)
    );

    res.on("close", () => {
      log(chalk.yellow(`🔌 Conexão encerrada: ${chalk.yellow(sessionId)}`));
      transports.delete(sessionId);
      servers.delete(uniqueId);
      log(chalk.dim(`   Recursos liberados para ${chalk.yellow(sessionId)}`));
    });

    await mcpServer.connect(transport);
    log(chalk.dim(`🚌 Transport connected for ${chalk.yellow(sessionId)}`));
  } catch (error: any) {
    logError(chalk.red("Erro durante a configuração da conexão SSE:"), error.message);
    if (servers.has(uniqueId)) servers.delete(uniqueId);
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
    logWarn(chalk.yellow("⚠️ Sessão não informada na requisição."));
    return res.status(400).send("Parâmetro sessionId ausente");
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    logWarn(chalk.yellow(`⚠️ Transporte não encontrado para sessionId: ${chalk.yellow(sessionId)}`));
    return res.status(400).send("Transporte não encontrado para sessionId");
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (error: any) {
    logError(chalk.red(`Erro ao processar mensagem para ${chalk.yellow(sessionId)}:`), error.message);
    if (!res.headersSent) {
      res.status(500).send("Erro no processamento da mensagem");
    } else {
      res.end();
    }
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logError(chalk.red("Erro não tratado:"), err);
  if (!res.headersSent) {
    res.status(500).send("Erro interno do servidor");
  } else {
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  log(chalk.bold.green(`🚀 Server up and running on port ${chalk.yellow(PORT)}`));
  log(chalk.blue("✅ Ready to accept multiple connections"));
});

export default app;
