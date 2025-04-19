/* eslint-disable @typescript-eslint/no-explicit-any */
import { Algorithm } from "../model/algorithm";
import { ParameterInfo } from "../model/parameter-info";

/**
 * Extracts parameter information from a Algorithm's arguments array.
 * @param algorithm The Algorithm object.
 * @returns An array of ParameterInfo extracted from the algorithm's arguments.
 */
export const getParametersFromAlgorithm = (algorithm: Algorithm): ParameterInfo[] => {
  const parameters: ParameterInfo[] = [];
  const args = algorithm.paramsSchema;

  console.log(
    `Parsing Algorithm "${algorithm.name ?? "Unnamed Algorithm"}" arguments:`,
    args
  );

  if (!Array.isArray(args)) {
    console.warn(
      `Algorithm "${
        algorithm.name ?? "Unnamed Algorithm"
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
          `Invalid argument structure found in Algorithm "${
            algorithm.name ?? "Unnamed Algorithm"
          }":`,
          arg
        );
      }
    });
  } catch (error) {
    console.error(
      `Error processing arguments for Algorithm "${
        algorithm.name ?? "Unnamed Algorithm"
      }":`,
      error
    );
  }

  return parameters;
};
