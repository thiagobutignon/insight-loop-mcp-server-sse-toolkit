export type ToolContent = { type: "text"; text: string };
export interface ToolResult {
  isError: boolean;
  content: ToolContent[];
}
