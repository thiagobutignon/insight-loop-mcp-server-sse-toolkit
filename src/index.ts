import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { dynamicCorsMiddleware } from "./middlewares/dynamic-cors-middleware.js";
import path from "path";
import { fileURLToPath } from "url";
import { registerToolsFromDirectoryRecursive } from "./lib/register-tools-recursive.js";
import chalk from "chalk"; // Import chalk
import ora from "ora"; // Import ora
import { registerPromptsFromDirectoryRecursive } from "./lib/register-prompts-recursive.js";

// --- Helper Logs ---
const log = console.log;
const logError = console.error;
const logWarn = console.warn;
// ---

const servers: { [uniqueId: string]: McpServer } = {};
const transports: { [sessionId: string]: SSEServerTransport } = {};

async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer({
    name: "insight-loop-mcp-server-sse",
    version: "1.0.0",
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const toolsDir = path.resolve(__dirname, "tools");
  const promptsDir = path.resolve(__dirname, "prompts");

  // Use ora spinner for tool registration
  const spinner = ora(
    `Registering tools from ${chalk.cyan(toolsDir)}...`
  ).start();
  try {
    await registerToolsFromDirectoryRecursive(server, toolsDir);
    // Assuming registerToolsFromDirectoryRecursive doesn't return the count easily
    spinner.succeed(chalk.green(`⚙️  Tools registered successfully.`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to register tools: ${error.message}`));
    // Re-throw the error to prevent server creation if tools fail to load
    throw error;
  }

  const promptSpinner = ora(
    `Registering prompts from ${chalk.cyan(promptsDir)}...`
  ).start();
  try {
    // Call the prompt registration function
    await registerPromptsFromDirectoryRecursive(server, promptsDir);
    // You could enhance registerPromptsFromDirectoryRecursive to return the count if needed
    promptSpinner.succeed(chalk.green(`💬 Prompts registered successfully.`));
  } catch (error: any) {
    promptSpinner.fail(
      chalk.red(`Failed to register prompts: ${error.message}`)
    );
    logError(error); // Log the full error for debugging
    // Decide if prompt loading failure is critical. If so, re-throw:
    // throw error;
    // If not critical, just log the warning/error and continue.
    // For consistency with tools, let's make it critical for now:
    throw error;
  }

  return server;
}

const app = express();

// Apply CORS middleware
app.use(dynamicCorsMiddleware);

// SSE Route
app.get("/sse", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  let mcpServer: McpServer;

  try {
    // Create MCP server instance for this connection
    // Spinner for server creation (includes tool loading)
    const serverSpinner = ora("Initializing new MCP session...").start();
    mcpServer = await createMcpServer();
    servers[uniqueId] = mcpServer;
    serverSpinner.succeed(
      chalk.blue(`🖥️  MCP server instance created for session.`)
    );

    // Create SSE transport
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;

    log(
      chalk.green(`🔌 New connection established: ${chalk.yellow(sessionId)}`)
    );

    // Handle connection close
    res.on("close", () => {
      log(chalk.yellow(`🔌 Connection closed: ${chalk.yellow(sessionId)}`));
      delete transports[sessionId];
      delete servers[uniqueId]; // Clean up the specific server instance
      log(chalk.dim(`   Resources cleaned up for ${chalk.yellow(sessionId)}`));
    });

    // Connect transport to the specific MCP server
    await mcpServer.connect(transport);
    log(chalk.dim(`🚌 Transport connected for ${chalk.yellow(sessionId)}`));
  } catch (error: any) {
    logError(chalk.red("Error during SSE connection setup:"), error.message);
    // Ensure resources are cleaned up if setup fails partially
    if (servers[uniqueId]) delete servers[uniqueId];
    // Close the response stream if an error occurs during setup
    if (!res.headersSent) {
      res.status(500).end("Server setup error");
    } else {
      res.end(); // End the stream if headers were already sent
    }
  }
});

// POST /messages Route
app.post("/messages", async (req: Request, res: Response) => {
  // Headers are often set by the transport itself, but setting here is safe
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];

  if (transport) {
    try {
      // The transport handles sending SSE messages back via the 'res' object
      await transport.handlePostMessage(req, res);
      // Log message receipt? Be careful, this could be very verbose.
      // log(chalk.dim(`   Received POST for ${chalk.yellow(sessionId)}`));
    } catch (error: any) {
      logError(
        chalk.red(`Error handling POST for ${chalk.yellow(sessionId)}:`),
        error.message
      );
      if (!res.headersSent) {
        res.status(500).send("Error processing message");
      } else {
        // Harder to signal error if stream already started, maybe send an SSE error event?
        res.end();
      }
    }
  } else {
    logWarn(
      chalk.yellow(
        `⚠️ No transport found for sessionId: ${chalk.yellow(
          sessionId
        )} on POST /messages`
      )
    );
    res.status(400).send("No transport found for sessionId");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  log(chalk.bold.green(`🚀 Server listening on port ${chalk.yellow(PORT)}`));
  // Changed Portuguese to English for consistency
  log(chalk.blue(`✅ Ready to accept multiple connections.`));
});

export default app;
