/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ParameterInfo } from "../model/parameter-info";

/**
 * Extracts parameter information from a Resource's arguments array.
 * @param resource The Resource object.
 * @returns An array of ParameterInfo extracted from the resource's arguments.
 */
export const getParametersFromResource = (resource: Resource): ParameterInfo[] => {
  const parameters: ParameterInfo[] = [];
  const args = resource.arguments;

  console.log(
    `Parsing Resource "${resource.name ?? "Unnamed Resource"}" arguments:`,
    args
  );

  if (!Array.isArray(args)) {
    console.warn(
      `Resource "${
        resource.name ?? "Unnamed Resource"
      }" has invalid or missing arguments array.`
    );
    return parameters;
  }

  try {
    args.forEach((arg: unknown) => {

      if (
        arg &&
        typeof arg === "object" &&
        "name" in arg &&
        typeof arg.name === "string" &&
        arg.name 
      ) {
        const validArg = arg as any;
        parameters.push({
          name: validArg.name,
          type: validArg.type ?? "string",
          description: validArg.description ?? "",
          required: Boolean(validArg.required),
          minLength:
            typeof validArg.minLength === "number"
              ? validArg.minLength
              : undefined,
        });
      } else {
        console.warn(
          `Invalid argument structure found in Resource "${
            resource.name ?? "Unnamed Resource"
          }":`,
          arg
        );
      }
    });
  } catch (error) {
    console.error(
      `Error processing arguments for Resource "${
        resource.name ?? "Unnamed Resource"
      }":`,
      error
    );
  }

  return parameters;
};
