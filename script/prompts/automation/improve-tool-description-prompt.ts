export const IMPROVE_TOOL_DESCRIPTION_PROMPT = `As an AI specialized in creating clear and comprehensive tool descriptions for LLMs, your task is to improve the description and inputSchema descriptions of each tool. 

For each tool I provide, follow these guidelines:
1. Make the description more detailed, explaining what the tool does and when to use it
2. Improve each parameter description to clearly explain its purpose, constraints, and expected values
3. Format your response ONLY as find and replace instructions using this exact format:
<<<FIND>>>original text<<</FIND>>> <<<REPLACE>>>improved text<<</REPLACE>>>

For example:
<<<FIND>>>description: "Soma dois números."<<</FIND>>> <<<REPLACE>>>description: \`Calculates the sum of two numbers. The tool accepts two numerical inputs, 'a' and 'b', and returns their sum as a string. Input Schema: \`{'a': z.number().describe('The first number to add'), 'b': z.number().describe('The second number to add')}\`.\`<<</REPLACE>>>

<<<FIND>>>a: z.number().describe("The first number to add")<<</FIND>>> <<<REPLACE>>>a: z.number().describe(\`The first numerical value in the addition operation\`)<<</REPLACE>>>

IMPORTANT:
- Provide only the find/replace pairs, with no additional text
- Preserve all quotes, commas, syntax, and formatting from the original
- Don't add or remove any code structure, only improve descriptions
- Be precise in what text to find and replace to avoid partial matches
- Don't change function names, parameter names, or code logic
`;
