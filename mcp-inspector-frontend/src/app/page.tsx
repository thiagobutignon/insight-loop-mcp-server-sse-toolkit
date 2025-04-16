/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ToolResult } from "./model/tool-result";
import { ParameterInfo } from "./model/parameter-info";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ParameterForm } from "@/components/parameter-form";
import { Header } from "@/components/header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { getParametersFromPrompt } from "./mcp/get-parameters-from-prompt";
import { getParametersFromTool } from "./mcp/get-parameters-from-tool";
import { AIForm } from "@/components/ai-form";
import { LogArea } from "@/components/log-area";

const SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL;

type ActiveSection = "Tools" | "Prompts";

export default function HomePage() {
  // --- Existing State (Keep as is) ---
  const [isConnected, setIsConnected] = useState(false);
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTransport] = useState<SSEClientTransport | null>(null);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [activeSection, setActiveSection] = useState<ActiveSection>("Tools");

  useEffect(() => {
    let clientInstance: Client | null = null;
    let transportInstance: SSEClientTransport | null = null;

    const connect = async () => {
      try {
        if (!SERVER_URL) {
          addMessage("❌ SERVER_URL is not defined.");
          return;
        }
        addMessage(
          `🔌 Attempting to connect to MCP server at ${SERVER_URL}...`
        );
        transportInstance = new SSEClientTransport(new URL(`${SERVER_URL}`));
        setTransport(transportInstance);

        clientInstance = new Client({
          name: "insight-loop-mcp-client-sse",
          version: "1.0.0",
        });
        setMcpClient(clientInstance);

        // --- Event Listeners ---
        transportInstance.onclose = () => {
          addMessage("🔌 Connection closed.");
          setIsConnected(false);
          setAvailableTools([]);
          setAvailablePrompts([]);
          resetSelections();
        };
        transportInstance.onerror = (error) => {
          addMessage(
            `❌ Connection error: ${error.message || "Unknown error"}`
          );
          console.error("MCP Transport Error:", error);
          setIsConnected(false);
          setAvailableTools([]);
          setAvailablePrompts([]);
          resetSelections();
        };

        await clientInstance.connect(transportInstance);
        setIsConnected(true);
        addMessage("✅ Connected successfully!");

        // List available tools after connecting
        try {
          const toolsResult = await clientInstance.listTools();
          setAvailableTools(toolsResult.tools);
          addMessage(
            `🛠️ Found tools: ${
              toolsResult.tools.length > 0
                ? toolsResult.tools.map((t) => t.name).join(", ")
                : "None"
            }`
          );
        } catch (error) {
          console.error("Error listing tools:", error);
          addMessage("⚠️ Failed to list tools.");
        }

        // List available prompts
        try {
          const promptsResult = await clientInstance.listPrompts();
          console.log(`------ promptsResult ${JSON.stringify(promptsResult)},`);
          setAvailablePrompts(promptsResult.prompts);
          addMessage(
            `💡 Found prompts: ${
              promptsResult.prompts.length > 0
                ? promptsResult.prompts.map((p) => p.name).join(", ")
                : "None"
            }`
          );
        } catch (error) {
          console.error("Error listing prompts:", error);
          addMessage(
            "⚠️ Failed to list prompts. The server might not support this feature or an error occurred."
          );
          // Don't assume prompts are unsupported, could be a temp error
          setAvailablePrompts([]);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addMessage(`❌ Connection failed: ${errorMessage}`);
        console.error("MCP Connection Error:", error);
        setIsConnected(false);
        resetSelections();
      }
    };

    connect();

    // Cleanup function
    return () => {
      addMessage("🔌 Cleaning up connection...");
      clientInstance
        ?.close()
        .catch((err) => console.error("Error closing client:", err));
      transportInstance?.close(); // Also explicitly close transport
      setIsConnected(false);
      setMcpClient(null);
      setTransport(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Existing Functions (Keep addMessage, scroll useEffect, resetSelections, handleSelectTool, handleSelectPrompt, handleInputChange, parseParamValue, handleCallMcpTool, handleCallMcpPrompt) ---

  // Function to add messages to the log
  const addMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}: ${message}`, // More compact timestamp
    ]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset all selections
  const resetSelections = () => {
    setSelectedTool(null);
    setSelectedPrompt(null);
    setInputs({});
  };

  // Handle selecting a tool
  const handleSelectTool = (tool: Tool) => {
    console.log("Selected Tool:", tool.name);
    resetSelections();
    setSelectedTool(tool);
    addMessage(`Selected tool: ${tool.name}`);
  };

  // Handle selecting a prompt
  const handleSelectPrompt = (prompt: Prompt) => {
    console.log("Selected Prompt:", prompt.name);
    resetSelections();
    setSelectedPrompt(prompt);
    addMessage(`Selected prompt: ${prompt.name}`);
  };

  /**
   * Gets parameter information from either a Tool or a Prompt.
   *
   * @param item The Tool or Prompt object, or null.
   * @param itemType A string literal indicating whether the item is a "Tool" or "Prompt".
   * @returns An array of ParameterInfo objects, or an empty array if item is null or parameters cannot be determined.
   */
  const getParameters = (
    item: Tool | Prompt | null,
    itemType: "Tool" | "Prompt"
  ): ParameterInfo[] => {
    if (!item) {
      console.log("Input item is null. Returning empty parameters.");
      return [];
    }

    let parameters: ParameterInfo[] = [];
    const itemName = item?.name ?? `Unnamed ${itemType}`; // Use nullish coalescing for default name

    console.log(`----- Processing ${itemType}: ${itemName} -----`);

    try {
      switch (itemType) {
        case "Tool":
          // Type guard to ensure 'item' is compatible with 'Tool' before passing
          if ("inputSchema" in item) {
            parameters = getParametersFromTool(item as Tool);
          } else {
            console.warn(
              `Item identified as Tool is missing 'inputSchema'. Item:`,
              item
            );
          }
          break;

        case "Prompt":
          // Type guard to ensure 'item' is compatible with 'Prompt' before passing
          if ("arguments" in item) {
            parameters = getParametersFromPrompt(item as Prompt);
          } else {
            console.warn(
              `Item identified as Prompt is missing 'arguments'. Item:`,
              item
            );
          }
          break;

        default:
          // This case should technically be unreachable due to the itemType constraint,
          // but it's good practice for exhaustive checks.
          console.warn(`Unknown itemType encountered: ${itemType}`);
          // itemType is asserted as never here for type safety
          // const _exhaustiveCheck: never = itemType;
          break;
      }
    } catch (error) {
      // Catch unexpected errors during the switch or helper function calls
      console.error(
        `An unexpected error occurred while processing ${itemType} "${itemName}":`,
        error
      );
      // Return empty array or re-throw depending on desired error handling strategy
      return [];
    }

    console.log(`Parameters found for ${itemType} "${itemName}":`, parameters);
    return parameters;
  };

  // Handle input change for parameters
  const handleInputChange = (paramName: string, value: any) => {
    setInputs((prev) => {
      const param =
        getParameters(selectedTool, "Tool").find((p) => p.name === paramName) ||
        getParameters(selectedPrompt, "Prompt").find(
          (p) => p.name === paramName
        );
      const parsedValue = param?.type === "boolean" ? Boolean(value) : value;
      return {
        ...prev,
        [paramName]: parsedValue,
      };
    });
  };

  // Parse value based on parameter type
  const parseParamValue = (value: any, type: string) => {
    if (typeof value === type && value !== "") {
      // Don't return empty string if type matches
      return value;
    }

    if (type === "number") {
      const num = Number(value);
      return isNaN(num) ? undefined : num; // Return undefined if not a valid number
    }
    if (type === "boolean") {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.toLowerCase() === "true";
      return Boolean(value);
    }
    if ((type === "object" || type === "array") && value === "") {
      // Allow submitting empty string, let validation handle if needed
      // Or return undefined/null if empty means "not provided"
      return undefined; // Or return {} / [] if empty means empty object/array
    }
    if (value === "") return undefined; // Treat empty strings generally as undefined for optional params

    return String(value); // Default to string
  };

  // Function to call the selected MCP tool with parameters
  const handleCallMcpTool = async () => {
    if (!mcpClient || !isConnected || !selectedTool) {
      addMessage("⚠️ Not connected or no tool selected.");
      return;
    }

    setIsLoading(true);
    addMessage(`⏳ Calling tool: "${selectedTool.name}"...`);

    try {
      const args: Record<string, any> = {};
      const parameters = getParameters(selectedTool, "Tool");

      let hasRequiredMissing = false;
      if (parameters.length > 0) {
        parameters.forEach((param) => {
          const rawValue = inputs[param.name];
          const parsedValue = parseParamValue(rawValue, param.type);

          // Basic Required Check (before parsing potentially makes it undefined)
          if (
            param.required &&
            (rawValue === undefined || rawValue === null || rawValue === "")
          ) {
            addMessage(`❌ Missing required parameter: ${param.name}`);
            hasRequiredMissing = true;
          }

          if (parsedValue !== undefined) {
            // Only include defined values
            args[param.name] = parsedValue;
          } else if (param.required && !hasRequiredMissing) {
            // If parsing made it undefined, but it was required
            addMessage(
              `❌ Invalid or missing required parameter: ${param.name}`
            );
            hasRequiredMissing = true;
          }
        });
      }

      if (hasRequiredMissing) {
        setIsLoading(false);
        return; // Stop execution if required fields are missing
      }

      addMessage(`➡️ Sending arguments: ${JSON.stringify(args)}`);

      const result = (await mcpClient.callTool({
        name: selectedTool.name,
        arguments: Object.keys(args).length > 0 ? args : undefined, // Send undefined if no args
      })) as ToolResult;

      addMessage(`✅ Tool response received for "${selectedTool.name}".`);

      if (result.isError) {
        // Assuming error content is typically text or a simple object
        const errorContent =
          Array.isArray(result.content) && result.content[0]?.type === "text"
            ? result.content[0].text
            : JSON.stringify(result.content);
        addMessage(`❌ Tool Error: ${errorContent}`);
      } else {
        // Handle different success content types more robustly
        let resultText = "Received complex object."; // Default
        if (Array.isArray(result.content) && result.content.length > 0) {
          const contentItem = result.content[0]; // Use a more descriptive name
          if (contentItem.type === "text") {
            resultText = contentItem.text;
          } else if (contentItem.type === "json") {
            // Access the 'json' property correctly after checking the type
            // Access the 'json' property correctly after checking the type - using 'as any' for simplicity
            resultText = `JSON: ${JSON.stringify(
              (contentItem as any).json,
              null,
              2
            )}`;
          } else {
            // Fallback for other potential types
            resultText = `Content type: ${
              contentItem.type
            }, Data: ${JSON.stringify(contentItem, null, 2)}`;
          }
        } else if (result.content) {
          resultText = JSON.stringify(result.content, null, 2);
        }

        addMessage(`📄 Tool Result: ${resultText}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addMessage(
        `❌ Error calling tool "${selectedTool.name}": ${errorMessage}`
      );
      console.error("MCP Tool Call Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to call the selected MCP prompt with parameters
  const handleCallMcpPrompt = async () => {
    if (!mcpClient || !isConnected || !selectedPrompt) {
      addMessage("⚠️ Not connected or no prompt selected.");
      return;
    }

    setIsLoading(true);
    addMessage(`⏳ Calling prompt: "${selectedPrompt.name}"...`);

    try {
      const args: Record<string, any> = {};
      const parameters = getParameters(selectedPrompt, "Prompt");

      let hasRequiredMissing = false;
      if (parameters.length > 0) {
        parameters.forEach((param) => {
          // For prompts, treat most inputs as strings unless specified otherwise
          // Keep raw value, server/prompt definition should handle types
          const value = inputs[param.name];

          if (
            param.required &&
            (value === undefined || value === null || value === "")
          ) {
            addMessage(`❌ Missing required parameter: ${param.name}`);
            hasRequiredMissing = true;
          }
          // Include even if empty string, as it might be valid input for a prompt
          if (value !== undefined && value !== null) {
            args[param.name] = value;
          } else if (param.required && !hasRequiredMissing) {
            addMessage(`❌ Missing required parameter: ${param.name}`);
            hasRequiredMissing = true;
          }
        });
      }

      if (hasRequiredMissing) {
        setIsLoading(false);
        return;
      }

      addMessage(`➡️ Sending arguments: ${JSON.stringify(args)}`);

      const instructions = mcpClient.listPrompts();
      console.log(`---- instructions ${JSON.stringify(instructions)}`);

      const result = await mcpClient.getPrompt({
        name: selectedPrompt.name,
        arguments: Object.keys(args).length > 0 ? args : undefined,
      });

      addMessage(`✅ Prompt response received for "${selectedPrompt.name}".`);
      // Prompts often don't return direct results in `getPrompt`,
      // they might trigger other actions or messages. The standard SDK might just return success/error.
      // Log the raw result for debugging.
      addMessage(
        `📄 Prompt Result Structure: ${JSON.stringify(result, null, 2)}`
      );

      if (result.isError) {
        addMessage(`❌ Prompt Error: ${JSON.stringify(result.content)}`);
      } else {
        // Adapt this message based on how your MCP server/prompts actually behave.
        // Does it send messages back through a different channel?
        addMessage(
          ` R️un prompt "${selectedPrompt.name}" request sent successfully. Monitor logs or other outputs for results.`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addMessage(
        `❌ Error calling prompt "${selectedPrompt.name}": ${errorMessage}`
      );
      console.error("MCP Prompt Call Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Layout ---
  return (
    <>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header
          isConnected={isConnected}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          availablePromptsLength={availablePrompts.length}
          resetSelections={resetSelections}
        />
        {/* Main Content Area (Sidebar + Log/Input) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <Sidebar
              activeSection={activeSection}
              availableTools={availableTools}
              selectedTool={selectedTool}
              isConnected={isConnected}
              onSelectTool={handleSelectTool}
              availablePrompts={availablePrompts}
              selectedPrompt={selectedPrompt}
              onSelectPrompt={handleSelectPrompt}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Area (Log + Parameters + Input) */}
          <ResizablePanel defaultSize={75} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Log Area */}
                <ResizablePanel defaultSize={50} minSize={30} className="overflow-y-auto">
                  <div className="p-4 h-full overflow-y-auto">
                    <LogArea messages={messages} />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  {/* Parameter/Action Area */}
                  <div className="border-t overflow-y-auto max-h-full">
                    {/* Conditionally render ParameterForm */}
                    {selectedTool && (
                      <div className="p-4">
                        <ParameterForm
                          item={selectedTool}
                          getParameters={getParameters}
                          inputs={inputs}
                          handleInputChange={handleInputChange}
                          onSubmit={handleCallMcpTool}
                          isLoading={isLoading}
                          isConnected={isConnected}
                          itemType="Tool"
                        />
                      </div>
                    )}
                    {selectedPrompt && (
                      <>
                        <Tabs defaultValue="parameters">
                          {/* Fixed Tabs Header */}
                          <div className="fixed bg-[#f0d2d219] w-full grid grid-cols-2 h-16">
                            <TabsList className="grid grid-cols-2">
                              <TabsTrigger
                                className="hover:bg-sky-700"
                                value="parameters"
                              >
                                Parameters
                              </TabsTrigger>
                              <TabsTrigger
                                className="hover:bg-sky-700"
                                value="openai-panel"
                              >
                                OpenAI Panel
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          {/* Tabs Content */}
                          <div className="pt-16 pl-4 pr-4 overflow-y">
                            {" "}
                            {/* Adjust pt-20 to match the header's height */}
                            <TabsContent value="parameters" className="mt-4">
                              <ParameterForm
                                item={selectedPrompt}
                                getParameters={getParameters}
                                inputs={inputs}
                                handleInputChange={handleInputChange}
                                onSubmit={handleCallMcpPrompt}
                                isLoading={isLoading}
                                isConnected={isConnected}
                                itemType="Prompt" // Ensure itemType is correctly passed if needed by ParameterForm
                              />
                            </TabsContent>
                            <TabsContent value="openai-panel" className="mt-4">
                              <AIForm
                                mcpClient={mcpClient}
                                selectedPrompt={selectedPrompt}
                                isConnected={isConnected}
                                addMessage={addMessage}
                              />
                            </TabsContent>
                          </div>
                        </Tabs>
                      </>
                    )}
                    {/* Placeholder when nothing is selected */}
                    {!selectedTool && !selectedPrompt && (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>
                          Select a Tool or Prompt from the sidebar to view
                          parameters and actions.
                        </p>
                      </div>
                    )}
                  </div>
                </ResizablePanel>

                {/* Bottom Input Panel */}
              </div>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
