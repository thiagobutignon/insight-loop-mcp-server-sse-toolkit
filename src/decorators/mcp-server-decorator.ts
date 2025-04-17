import { Server, ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { Implementation } from "@modelcontextprotocol/sdk/types.js";

import { z, ZodRawShape, ZodTypeAny } from "zod";

// Define an Algorithm interface following the Interface Segregation Principle
export interface Algorithm {
  name: string;
  description?: string;
  execute: (...args: any[]) => any | Promise<any>;
}

// Define a Zod schema for algorithm validation
export const AlgorithmSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  execute: z.function()
    .args(z.array(z.any()))
    .returns(z.any())
});

// Define a type for algorithm callbacks with Zod validation
export type AlgorithmCallback<Args extends undefined | ZodRawShape = undefined> = 
  Args extends ZodRawShape 
    ? (args: z.objectOutputType<Args, ZodTypeAny>, extra: RequestHandlerExtra) => any | Promise<any>
    : (extra: RequestHandlerExtra) => any | Promise<any>;

/**
 * McpServerDecorator decorator following the Decorator pattern
 * This adheres to:
 * - Single Responsibility Principle: Adds only algorithm functionality
 * - Open/Closed Principle: Extends McpServer without modifying it
 * - Liskov Substitution Principle: Can be used wherever McpServer is used
 * - Interface Segregation Principle: Provides only necessary interfaces
 * - Dependency Inversion Principle: Depends on abstractions not implementations
 */
export class McpServerDecorator {
  private readonly _mcpServer: McpServer;
  private readonly _registeredAlgorithms: Map<string, Algorithm> = new Map();

  constructor(mcpServer: McpServer) {
    this._mcpServer = mcpServer;
  }

  // Delegate properties to the decorated McpServer
  get server(): Server {
    return this._mcpServer.server;
  }

  // Delegate methods to the decorated McpServer
  connect(transport: Transport): Promise<void> {
    return this._mcpServer.connect(transport);
  }

  close(): Promise<void> {
    return this._mcpServer.close();
  }

  resource(...args: any[]): void {
    // @ts-ignore - Using spread operator with any
    return this._mcpServer.resource(...args);
  }

  tool(...args: any[]): void {
    // @ts-ignore - Using spread operator with any
    return this._mcpServer.tool(...args);
  }

  prompt(...args: any[]): void {
    // @ts-ignore - Using spread operator with any
    return this._mcpServer.prompt(...args);
  }

  // Get all registered algorithms
  get algorithms(): Map<string, Algorithm> {
    return this._registeredAlgorithms;
  }

  /**
   * Registers a zero-argument algorithm `name`, which will run the given function when called.
   */
  algorithm(name: string, cb: AlgorithmCallback): void;

  /**
   * Registers a zero-argument algorithm `name` (with a description) which will run the given function when called.
   */
  algorithm(name: string, description: string, cb: AlgorithmCallback): void;

  /**
   * Registers an algorithm `name` accepting the given arguments, which must be an object containing named properties 
   * associated with Zod schemas. When called, the function will be run with the parsed and validated arguments.
   */
  algorithm<Args extends ZodRawShape>(name: string, paramsSchema: Args, cb: AlgorithmCallback<Args>): void;

  /**
   * Registers an algorithm `name` (with a description) accepting the given arguments, which must be an object containing 
   * named properties associated with Zod schemas. When called, the function will be run with the parsed and validated arguments.
   */
  algorithm<Args extends ZodRawShape>(
    name: string, 
    description: string, 
    paramsSchema: Args, 
    cb: AlgorithmCallback<Args>
  ): void;

  // Implementation of the algorithm method overloads
  algorithm(...args: any[]): void {
    const name = args[0] as string;
    
    if (args.length === 2) {
      // Zero-argument algorithm without description
      const cb = args[1] as AlgorithmCallback;
      this._registerAlgorithm(name, undefined, undefined, cb);
    } else if (args.length === 3) {
      if (typeof args[1] === 'string') {
        // Zero-argument algorithm with description
        const description = args[1];
        const cb = args[2] as AlgorithmCallback;
        this._registerAlgorithm(name, description, undefined, cb);
      } else {
        // Algorithm with args schema but no description
        const paramsSchema = args[1] as ZodRawShape;
        const cb = args[2] as AlgorithmCallback<ZodRawShape>;
        this._registerAlgorithm(name, undefined, paramsSchema, cb);
      }
    } else if (args.length === 4) {
      // Algorithm with args schema and description
      const description = args[1] as string;
      const paramsSchema = args[2] as ZodRawShape;
      const cb = args[3] as AlgorithmCallback<ZodRawShape>;
      this._registerAlgorithm(name, description, paramsSchema, cb);
    }
  }

  /**
   * Executes a registered algorithm by name with the provided arguments.
   */
  async executeAlgorithm(name: string, args?: any, extra?: RequestHandlerExtra): Promise<any> {
    const algorithm = this._registeredAlgorithms.get(name);
    if (!algorithm) {
      throw new Error(`Algorithm '${name}' not found`);
    }
    return algorithm.execute(extra || {}, args);
  }


  private _registerAlgorithm<Args extends ZodRawShape | undefined>(
    name: string,
    description: string | undefined,
    paramsSchema: Args | undefined,
    cb: AlgorithmCallback<Args extends ZodRawShape ? Args : undefined>
  ): void {
    // Create algorithm executor function
    const execute = async (extra: RequestHandlerExtra, args?: any): Promise<any> => {
      if (paramsSchema) {
        // Validate args using Zod schema
        const schema = z.object(paramsSchema);
        const validatedArgs = schema.parse(args);
        return (cb as AlgorithmCallback<ZodRawShape>)(validatedArgs, extra);
      } else {
        // No args validation needed
        return (cb as AlgorithmCallback)(extra);
      }
    };

    // Create and register the algorithm
    const algorithm: Algorithm = {
      name,
      description,
      execute
    };

    // Validate using AlgorithmSchema
    AlgorithmSchema.parse(algorithm);
    
    this._registeredAlgorithms.set(name, algorithm);
  }

  // Factory method to create a decorated instance from implementation
  static create(serverInfo: Implementation, options?: ServerOptions): McpServerDecorator {
    const mcpServer = new McpServer(serverInfo, options);
    return new McpServerDecorator(mcpServer);
  }
}