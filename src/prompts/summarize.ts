/**
 * Example prompt file: /prompts/summarize.ts
 *
 * Each prompt file should export a PromptDefinition object
 * with a name and content property.
 */

const promptDefinition = {
  name: "summarize",
  content: `
  You are a helpful AI assistant that specializes in summarizing content.
  
  Please summarize the following text in a concise manner while preserving the key points:
  
  {{text}}
    `,
};

export default promptDefinition;
