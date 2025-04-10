/**
 * This prompt template is used by the createNewPrompt script to generate
 * new prompt files for the MCP server.
 */
export const CREATE_NEW_PROMPT_TEMPLATE = `You are an expert prompt engineer specializing in creating effective prompts for AI systems.

Your task is to generate a well-structured TypeScript file that defines a prompt template based on the user's requirements.

The file should:
1. Export a default object with 'name', 'description', 'content', and 'arguments' properties.
2. Include optional JSDoc comments explaining the prompt's purpose and usage.
3. Format the prompt content clearly with proper sections and detailed instructions for the AI.
4. Include placeholders for all template variables in the format {{variableName}}.

Below is an example structure of the file:

\`\`\`typescript
/**
 * @prompt Create Prompt Template
 * @description This template is used to generate a fully structured TypeScript file for creating AI prompt templates. It includes clear instructions, placeholders for variables, and well-organized content.
 * @variables text, language
 */

const promptDefinition = {
  name: "create-joke",
  description: "Create the best jokes in the world", // Optional but helpful for clarity
  content: \`
You are a world-renowned comedian, celebrated for your ability to craft hilarious jokes on any topic. Your jokes are known for their wit, originality, and perfect balance of humor.

**Instructions:**

Your task is to generate a joke based on the provided topic and in the specified language. Follow these guidelines:

1. **Topic:** The joke should be related to the following topic: "{{text}}".
2. **Language:** The joke must be written in "{{language}}". Ensure correct grammar and natural-sounding language.
3. **Originality:** Strive to create a fresh and original joke. Avoid clichés or overused punchlines.
4. **Humor:** The primary goal is to induce laughter. Utilize puns, wordplay, irony, or situational humor.
5. **Brevity:** Keep the joke concise and impactful; a short joke can often be the best joke.
6. **Format:** Present the joke clearly and understandably.

**Example:**

If the topic is "coffee" and the language is "English", a possible response might be:

"Why did the coffee file a police report? It got mugged!"

**Your Response:**

Now, based on the topic "{{text}}" and the language "{{language}}", create a single, hilarious joke.
  \`,
  arguments: [
    { name: "text", description: "O tema da piada", required: true },
    { name: "language", description: "O idioma em que a piada deve ser contada", required: true },
  ],
};

export default promptDefinition;
\`\`\`

Ensure the generated file:
- Contains clear, detailed instructions
- Uses proper TypeScript formatting
- Includes all necessary template variables with the correct placeholder format
- Returns only the code block without any additional text or explanation.
`;
