/**
 * Unit tests for the MCP Server SSE Toolkit
 */
import { jest } from '@jest/globals';
import {Express} from 'express';
import request from 'supertest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/sse.js');
jest.mock('uuid');
jest.mock('./lib/register-tools-recursive.js');
jest.mock('./lib/register-prompts-recursive.js');
jest.mock('ora', () => jest.fn(() => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis()
})));

// Import the server module using dynamic import to handle ESM
let app: Express

describe('MCP Server SSE Toolkit', () => {
  // Set up before tests
  beforeAll(async () => {
    // Mock implementations
    (McpServer as jest.MockedClass<typeof McpServer>).mockImplementation(() => {
      return {
        name: 'insight-loop-mcp-server-sse',
        version: '1.0.0',
        connect: jest.fn().mockResolvedValue()
      } as unknown as McpServer;
    });

    (SSEServerTransport as jest.MockedClass<typeof SSEServerTransport>).mockImplementation((endpoint, response) => {
      return {
        sessionId: 'test-session-id',
        handlePostMessage: jest.fn().mockResolvedValue(undefined)
      } as unknown as SSEServerTransport;
    });

    (uuid as jest.MockedFunction<typeof uuid>).mockReturnValue('test-uuid');

    // Mock the register functions
    jest.mock('./lib/register-tools-recursive.js', () => ({
      registerToolsFromDirectoryRecursive: jest.fn().mockResolvedValue(undefined)
    }));

    jest.mock('./lib/register-prompts-recursive.js', () => ({
      registerPromptsFromDirectoryRecursive: jest.fn().mockResolvedValue(undefined)
    }));

    // Dynamically import the app to support ESM
    const serverModule = await import('../src/server');
    app = serverModule.default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    test('should initialize express server', () => {
      expect(app).toBeDefined();
    });
  });

  describe('SSE Connection', () => {
    test('should establish SSE connection', async () => {
      const response = await request(app)
        .get('/sse')
        .set('Accept', 'text/event-stream');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
      
      expect(McpServer).toHaveBeenCalledWith({
        name: 'insight-loop-mcp-server-sse',
        version: '1.0.0'
      });
      
      // Verify a transport was created and connected
      expect(SSEServerTransport).toHaveBeenCalled();
      const mockMcpServerInstance = (McpServer as jest.MockedClass<typeof McpServer>).mock.instances[0];
      expect(mockMcpServerInstance.connect).toHaveBeenCalled();
    });

    test('should handle server creation errors', async () => {
      // Mock the MCP server to throw an error
      (McpServer as jest.MockedClass<typeof McpServer>).mockImplementationOnce(() => {
        throw new Error('Server creation error');
      });

      const response = await request(app)
        .get('/sse')
        .set('Accept', 'text/event-stream');
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server setup error');
    });
  });

  describe('Message Handling', () => {
    test('should handle POST messages with valid sessionId', async () => {
      // Setup a mock transport
      const mockTransport = {
        sessionId: 'test-session-id',
        handlePostMessage: jest.fn().mockResolvedValue(undefined)
      };
      
      // Directly set the mock transport in the transports map
      // We need to access the private map in the server
      const serverModule = await import('../src/server');
      const transportsMap = Reflect.get(serverModule, 'transports');
      transportsMap.set('test-session-id', mockTransport);

      const response = await request(app)
        .post('/messages?sessionId=test-session-id')
        .send({ message: 'test-message' });
      
      expect(mockTransport.handlePostMessage).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('should reject POST messages with missing sessionId', async () => {
      const response = await request(app)
        .post('/messages')
        .send({ message: 'test-message' });
      
      expect(response.status).toBe(400);
      expect(response.text).toBe('Parâmetro sessionId ausente');
    });

    test('should reject POST messages with invalid sessionId', async () => {
      const response = await request(app)
        .post('/messages?sessionId=non-existent-id')
        .send({ message: 'test-message' });
      
      expect(response.status).toBe(400);
      expect(response.text).toBe('Transporte não encontrado para sessionId');
    });

    test('should handle errors in message processing', async () => {
      // Setup a mock transport that throws an error
      const mockTransport = {
        sessionId: 'error-session-id',
        handlePostMessage: jest.fn().mockRejectedValue(new Error('Message processing error'))
      };
      
      // Add the transport to the map
      const serverModule = await import('../src/server');
      const transportsMap = Reflect.get(serverModule, 'transports');
      transportsMap.set('error-session-id', mockTransport);

      const response = await request(app)
        .post('/messages?sessionId=error-session-id')
        .send({ message: 'error-message' });
      
      expect(mockTransport.handlePostMessage).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.text).toBe('Erro no processamento da mensagem');
    });
  });

  describe('Resource Management', () => {
    test('should clean up resources when SSE connection closes', async () => {
      // This is harder to test directly. We would need to:
      // 1. Create a request to /sse
      // 2. Mock the 'close' event on the response
      // 3. Verify that cleanup happens
      
      // We can't easily do this with supertest, so we'll mock at a lower level
      const mockResponse = {
        set: jest.fn(),
        on: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
        headersSent: false
      };
      
      // Directly call the /sse route handler
      const serverModule = await import('../src/server');
      const app = serverModule.default;
      
      // Find the /sse route and extract its handler
      const sseRoute = app._router.stack.find(
        (layer: any) => layer.route && layer.route.path === '/sse'
      );
      
      if (sseRoute) {
        const sseHandler = sseRoute.route.stack[0].handle;
        
        // Call the handler with mock request and response
        await sseHandler({ query: {} }, mockResponse, () => {});
        
        // Verify response was set up correctly
        expect(mockResponse.set).toHaveBeenCalledWith({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        
        // Find the 'close' event handler
        const onCall = mockResponse.on.mock.calls.find(
          (call) => call[0] === 'close'
        );
        
        if (onCall) {
          const closeHandler = onCall[1];
          
          // Execute the close handler to simulate connection close
          closeHandler();
          
          // Verify resources were cleaned up
          const serversMap = Reflect.get(serverModule, 'servers');
          const transportsMap = Reflect.get(serverModule, 'transports');
          
          expect(serversMap.has('test-uuid')).toBe(false);
          expect(transportsMap.has('test-session-id')).toBe(false);
        } else {
          fail('Could not find close event handler');
        }
      } else {
        fail('Could not find /sse route');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle errors with the global error middleware', async () => {
      // Create a route that throws an error
      app.get('/error-test', () => {
        throw new Error('Test error');
      });

      const response = await request(app).get('/error-test');
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Erro interno do servidor');
    });
  });
});