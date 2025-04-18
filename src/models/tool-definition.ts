import { ZodTypeAny, z } from "zod";

export type ToolHandler<Schema extends ZodTypeAny, Output = any> = (
  input: z.infer<Schema>,
  context: any
) => Promise<Output>;

export type ToolDefinition<Schema extends ZodTypeAny, Output = any> = {
  name: string;
  description: string;
  inputSchema: Schema;
  handler: ToolHandler<Schema, Output>;
};
