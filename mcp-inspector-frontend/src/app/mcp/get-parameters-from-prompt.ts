/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ParameterInfo } from "../model/parameter-info";

/**
 * Extracts parameter information from a Prompt's arguments array.
 * @param prompt The Prompt object.
 * @returns An array of ParameterInfo extracted from the prompt's arguments.
 */
export const getParametersFromPrompt = (prompt: Prompt): ParameterInfo[] => {
  const parameters: ParameterInfo[] = [];
  const args = prompt.arguments;

  console.log(
    `Parsing Prompt "${prompt.name ?? "Unnamed Prompt"}" arguments:`,
    args
  );

  // Validate the structure of the arguments
  if (!Array.isArray(args)) {
    console.warn(
      `Prompt "${
        prompt.name ?? "Unnamed Prompt"
      }" has invalid or missing arguments array.`
    );
    return parameters; // Return empty if arguments are not an array
  }

  try {
    args.forEach((arg: unknown) => {
      // Type guard to ensure arg is a valid object with a name
      if (
        arg &&
        typeof arg === "object" &&
        "name" in arg &&
        typeof arg.name === "string" &&
        arg.name // Ensure name is not an empty string
      ) {
        // Cast to PromptArgument after validation
        const validArg = arg as any;
        parameters.push({
          name: validArg.name,
          type: validArg.type ?? "string", // Default type
          description: validArg.description ?? "", // Default description
          required: Boolean(validArg.required), // Coerce to boolean
          minLength:
            typeof validArg.minLength === "number"
              ? validArg.minLength
              : undefined,
        });
      } else {
        console.warn(
          `Invalid argument structure found in Prompt "${
            prompt.name ?? "Unnamed Prompt"
          }":`,
          arg
        );
      }
    });
  } catch (error) {
    console.error(
      `Error processing arguments for Prompt "${
        prompt.name ?? "Unnamed Prompt"
      }":`,
      error
    );
    // Depending on requirements, you might want to return partial parameters or re-throw
  }

  return parameters;
};
