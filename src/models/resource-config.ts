import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ResourceConfig {
  name: string;
  template: ResourceTemplate | string;
  handler: (uri: any, params?: any) => Promise<any>;
}