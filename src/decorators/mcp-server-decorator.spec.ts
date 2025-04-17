import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { ZodRawShape, z } from "zod";
import { McpServerDecorator } from "./mcp-server-decorator";

describe("McpServerDecorator", () => {
  let mockMcpServer: any;
  let decorator: McpServerDecorator;
  let dummySignal: AbortSignal;
  let dummyExtra: RequestHandlerExtra;

  beforeEach(() => {
    // Create a dummy AbortSignal for RequestHandlerExtra
    dummySignal = new AbortController().signal;
    dummyExtra = { signal: dummySignal };

    mockMcpServer = {
      server: { id: "test-server" },
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      resource: jest.fn(),
      tool: jest.fn(),
      prompt: jest.fn(),
    };
    decorator = new McpServerDecorator(mockMcpServer);
  });

  describe("delegated properties and methods", () => {
    test("should expose server property", () => {
      expect(decorator.server).toBe(mockMcpServer.server);
    });

    test("should delegate connect", async () => {
      const transport = { type: "test" };
      await decorator.connect(transport as any);
      expect(mockMcpServer.connect).toHaveBeenCalledWith(transport);
    });

    test("should delegate close", async () => {
      await decorator.close();
      expect(mockMcpServer.close).toHaveBeenCalled();
    });

    test("should delegate resource", () => {
      decorator.resource("arg1", 2, { key: "value" });
      expect(mockMcpServer.resource).toHaveBeenCalledWith("arg1", 2, { key: "value" });
    });

    test("should delegate tool", () => {
      decorator.tool("toolName", { opt: true });
      expect(mockMcpServer.tool).toHaveBeenCalledWith("toolName", { opt: true });
    });

    test("should delegate prompt", () => {
      decorator.prompt("prompt text");
      expect(mockMcpServer.prompt).toHaveBeenCalledWith("prompt text");
    });
  });

  describe("algorithm registration and execution", () => {
    test("registers and executes zero-arg algorithm without description", async () => {
      const callback = jest.fn((extra: RequestHandlerExtra) => "result");
      decorator.algorithm("noArgsAlgo", callback);

      const result = await decorator.executeAlgorithm("noArgsAlgo", undefined, dummyExtra);
      expect(result).toBe("result");
      expect(callback).toHaveBeenCalledWith(dummyExtra);

      const alg = decorator.algorithms.get("noArgsAlgo");
      expect(alg).toBeDefined();
      expect(alg?.name).toBe("noArgsAlgo");
      expect(alg?.description).toBeUndefined();
    });

    test("default extra is used when none provided for zero-arg algorithm", async () => {
      const callback = jest.fn((extra: any) => extra);
      decorator.algorithm("defaultExtraAlgo", callback as any);

      const result = await decorator.executeAlgorithm("defaultExtraAlgo");
      expect(result).toEqual({});
      expect(callback).toHaveBeenCalledWith({});
    });

    test("registers and executes zero-arg algorithm with description", async () => {
      const callback = jest.fn((extra: RequestHandlerExtra) => 42);
      decorator.algorithm("descAlgo", "A test algo", callback);

      const result = await decorator.executeAlgorithm("descAlgo", undefined, dummyExtra);
      expect(result).toBe(42);
      expect(callback).toHaveBeenCalledWith(dummyExtra);

      const alg = decorator.algorithms.get("descAlgo");
      expect(alg?.description).toBe("A test algo");
    });

    test("default extra is used when none provided for arg-based algorithm", async () => {
      const paramsSchema: ZodRawShape = { x: z.number() };
      const callback = jest.fn((args: any, extra: any) => extra);
      decorator.algorithm("argsNoExtra", paramsSchema, callback as any);

      const result = await decorator.executeAlgorithm("argsNoExtra", { x: 1 });
      expect(result).toEqual({});
      expect(callback).toHaveBeenCalledWith({ x: 1 }, {});
    });

    test("registers and executes arg-based algorithm without description", async () => {
      const paramsSchema: ZodRawShape = { x: z.number() };
      const callback = jest.fn((args: { x: number }, extra: RequestHandlerExtra) => args);
      decorator.algorithm("argsAlgo", paramsSchema, callback as any);

      const inputArgs = { x: 5 };
      const result = await decorator.executeAlgorithm("argsAlgo", inputArgs, dummyExtra);
      expect(result).toEqual(inputArgs);
      expect(callback).toHaveBeenCalledWith(inputArgs, dummyExtra);

      const alg = decorator.algorithms.get("argsAlgo");
      expect(alg).toBeDefined();
    });

    test("registers and executes arg-based algorithm with description", async () => {
      const paramsSchema: ZodRawShape = { a: z.string(), b: z.boolean() };
      const callback = jest.fn((args: { a: string; b: boolean }, extra: RequestHandlerExtra) => args);
      decorator.algorithm("fullAlgo", "Full algo", paramsSchema, callback as any);

      const inputArgs = { a: "test", b: true };
      const result = await decorator.executeAlgorithm("fullAlgo", inputArgs, dummyExtra);
      expect(result).toEqual(inputArgs);
      expect(callback).toHaveBeenCalledWith(inputArgs, dummyExtra);

      const alg = decorator.algorithms.get("fullAlgo");
      expect(alg?.description).toBe("Full algo");
    });

    test("throws error when executing non-existent algorithm", async () => {
      await expect(decorator.executeAlgorithm("unknown", undefined, dummyExtra)).rejects.toThrow("Algorithm 'unknown' not found");
    });
  });

  describe("static create method", () => {
    test("should create a McpServerDecorator from implementation and options", () => {
      const dummyImpl = {} as any;
      const dummyOptions = { someOption: true } as any;
      const decorator2 = McpServerDecorator.create(dummyImpl, dummyOptions);
      expect(decorator2).toBeInstanceOf(McpServerDecorator);
      expect(decorator2.server).toBeDefined();
    });
  });
});
