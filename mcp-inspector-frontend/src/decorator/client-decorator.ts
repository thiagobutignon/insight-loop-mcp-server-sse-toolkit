/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, ClientOptions } from "@modelcontextprotocol/sdk/client/index.js";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { Implementation, Notification, Request, Result } from "@modelcontextprotocol/sdk/types.js";

/**
 * Custom request for algorithm execution
 */
export interface ExecuteAlgorithmRequest extends Request {
  method: "executeAlgorithm";
  params: {
    name: string;
    args?: any;
  };
}

/**
 * Custom result for algorithm execution
 */
export interface ExecuteAlgorithmResult extends Result {
  result: any;
}

/**
 * List algorithms request
 */
export interface ListAlgorithmsRequest extends Request {
  method: "listAlgorithms";
  params: Record<string, never>; // Empty object with proper type
}

/**
 * MCP Client Decorator following the Decorator pattern
 * This extends the base MCP Client with algorithm execution capabilities
 */
export class McpClientDecorator<
  RequestT extends Request = Request,
  NotificationT extends Notification = Notification,
  ResultT extends Result = Result
> {
  private readonly _client: Client<RequestT | ExecuteAlgorithmRequest | ListAlgorithmsRequest, NotificationT, ResultT | ExecuteAlgorithmResult>;

  /**
   * Create a new instance of McpClientDecorator
   */
  constructor(client: Client<RequestT | ExecuteAlgorithmRequest | ListAlgorithmsRequest, NotificationT, ResultT | ExecuteAlgorithmResult>) {
    this._client = client;
  }

  /**
   * Get the underlying client
   */
  get client(): Client<RequestT | ExecuteAlgorithmRequest | ListAlgorithmsRequest, NotificationT, ResultT | ExecuteAlgorithmResult> {
    return this._client;
  }

  /**
   * Delegate connect method to the underlying client
   */
  async connect(transport: Transport, options?: RequestOptions): Promise<void> {
    return this._client.connect(transport, options);
  }

  /**
   * Execute an algorithm on the server
   * 
   * @param name The name of the algorithm to execute
   * @param args Optional arguments to pass to the algorithm
   * @param options Request options
   * @returns The result of the algorithm execution
   */
  async executeAlgorithm<T = any>(
    name: string,
    args?: any,
    options?: RequestOptions
  ): Promise<T> {
    try {
      // Create the request object
      const request: ExecuteAlgorithmRequest = {
        method: "executeAlgorithm",
        params: {
          name,
          args
        }
      };

      // Use any to bypass TypeScript's overload resolution
      // This is safely typed because we know the structure of our request
      const result = await (this._client as any).request(request, options);

      return result.result as T;
    } catch (error) {
      console.error(`Error executing algorithm ${name}:`, error);
      throw error;
    }
  }

  /**
   * List available algorithms on the server
   */
  async listAlgorithms(options?: RequestOptions): Promise<{
    algorithms: Array<{
      name: string;
      description?: string;
      argsSchema?: Record<string, any>;
    }>
  }> {
    try {
      // Create the request object
      const request: ListAlgorithmsRequest = {
        method: "listAlgorithms",
        params: {}
      };

      // Use any to bypass TypeScript's overload resolution
      const result = await (this._client as any).request(request, options);

      return result as any;
    } catch (error) {
      console.error("Error listing algorithms:", error);
      throw error;
    }
  }

  // Delegate methods to the decorated client
  async ping(options?: RequestOptions): Promise<any> {
    return this._client.ping(options);
  }

  async complete(params: any, options?: RequestOptions): Promise<any> {
    return this._client.complete(params, options);
  }

  async setLoggingLevel(level: any, options?: RequestOptions): Promise<any> {
    return this._client.setLoggingLevel(level, options);
  }

  async getPrompt(params: any, options?: RequestOptions): Promise<any> {
    return this._client.getPrompt(params, options);
  }

  async listPrompts(params?: any, options?: RequestOptions): Promise<any> {
    return this._client.listPrompts(params, options);
  }

  async listResources(params?: any, options?: RequestOptions): Promise<any> {
    return this._client.listResources(params, options);
  }

  async listResourceTemplates(params?: any, options?: RequestOptions): Promise<any> {
    return this._client.listResourceTemplates(params, options);
  }

  async readResource(params: any, options?: RequestOptions): Promise<any> {
    return this._client.readResource(params, options);
  }

  async subscribeResource(params: any, options?: RequestOptions): Promise<any> {
    return this._client.subscribeResource(params, options);
  }

  async unsubscribeResource(params: any, options?: RequestOptions): Promise<any> {
    return this._client.unsubscribeResource(params, options);
  }

  async callTool(params: any, resultSchema?: any, options?: RequestOptions): Promise<any> {
    return this._client.callTool(params, resultSchema, options);
  }

  async listTools(params?: any, options?: RequestOptions): Promise<any> {
    return this._client.listTools(params, options);
  }

  async sendRootsListChanged(): Promise<void> {
    return this._client.sendRootsListChanged();
  }

  getServerCapabilities(): any {
    return this._client.getServerCapabilities();
  }

  getServerVersion(): Implementation | undefined {
    return this._client.getServerVersion();
  }

  getInstructions(): string | undefined {
    return this._client.getInstructions();
  }
  
  /**
   * Factory method to create a client decorator instance
   */
  static create(
    clientInfo: Implementation,
    options?: ClientOptions
  ): McpClientDecorator {
    const client = new Client(clientInfo, options);
    return new McpClientDecorator(client);
  }
}