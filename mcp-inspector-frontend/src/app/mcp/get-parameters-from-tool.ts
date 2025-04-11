/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ParameterInfo } from "../model/parameter-info";

/**
 * Extracts parameter information from a Tool's inputSchema.
 * @param tool The Tool object.
 * @returns An array of ParameterInfo extracted from the tool's schema.
 */
export const getParametersFromTool = (tool: Tool): ParameterInfo[] => {
  const parameters: ParameterInfo[] = [];
  const schema = tool.inputSchema;

  console.log(
    `Parsing Tool "${tool.name ?? "Unnamed Tool"}" inputSchema:`,
    schema
  );

  // Validate the structure of the inputSchema
  if (
    !schema ||
    typeof schema !== "object" ||
    typeof schema.properties !== "object" ||
    schema.properties === null // Explicitly check for null
  ) {
    console.warn(
      `Tool "${
        tool.name ?? "Unnamed Tool"
      }" has invalid or missing inputSchema.properties.`
    );
    return parameters; // Return empty if schema/properties are invalid/missing
  }

  try {
    const properties = schema.properties as Record<string, any>; // Type assertion after check
    const requiredSet = new Set(
      Array.isArray(schema.required) ? schema.required : []
    );

    for (const name in properties) {
      // Use hasOwnProperty to ensure it's not from the prototype chain
      if (Object.prototype.hasOwnProperty.call(properties, name)) {
        const prop = properties[name];

        // Ensure property is a valid object before accessing its members
        if (prop && typeof prop === "object") {
          parameters.push({
            name: name,
            type: prop.type ?? "string", // Default type to 'string' if undefined
            description: prop.description ?? "", // Default description to empty string
            required: requiredSet.has(name),
            minLength:
              typeof prop.minLength === "number" ? prop.minLength : undefined, // Handle minLength specifically
          });
        } else {
          console.warn(
            `Property "${name}" in Tool "${
              tool.name ?? "Unnamed Tool"
            }" schema is not a valid object.`
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `Error processing properties for Tool "${tool.name ?? "Unnamed Tool"}":`,
      error
    );
    // Depending on requirements, you might want to return partial parameters or re-throw
  }

  return parameters;
};
