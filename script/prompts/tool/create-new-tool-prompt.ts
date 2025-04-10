export const CREATE_NEW_TOOL_PROMPT = `As an AI specialized in creating TypeScript tool files, you will generate complete code for a new function based on the provided details.

Create a TypeScript tool file following this format:
\`\`\`typescript
import { z } from "zod";

const toolNameVar = {
  name: "function_name",
  description: "Detailed description of the tool.",
  inputSchema: {
    param1: z.number().describe("Description of param1"),
    param2: z.string().describe("Description of param2"),
    // Additional parameters as needed
  },

  handler: async (input: { param1: number; param2: string }) => {
    // Implementation
    return { content: [{ text: "Result", type: "text" }] };
  },
};

export default toolNameVar;
\`\`\`

Follow these guidelines:
1. Use the tool name, function name, and description provided
2. Design appropriate input parameters based on the description and example
3. Implement a handler function that returns a result in the format { content: [{ text: string, type: "text" }] }
4. Create clear parameter descriptions using zod schema
5. Ensure the code is well-structured and follows TypeScript best practices
6. Return only the complete code with no additional text or explanations
`;
