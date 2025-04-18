import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";
import { AlgorithmConfig } from "../models/algorithm-config.js";


/**
 * Data Processor Algorithm
 * 
 * Processes an array of data based on the specified operation
 * - filter: filters items based on a predicate
 * - map: transforms items using a mapping function
 * - reduce: reduces the array to a single value
 */
const dataProcessorAlgorithm: AlgorithmConfig = {
  name: "dataProcessor",
  description: "Processes an array of data using the specified operation",
  paramsSchema: {
    operation: z.enum(["filter", "map", "reduce"]).describe("The operation to perform"),
    data: z.array(z.any()).describe("The array of data to process"),
    params: z.object({
      predicate: z.string().optional().describe("Filter predicate function (as string)"),
      mapper: z.string().optional().describe("Mapping function (as string)"),
      reducer: z.string().optional().describe("Reducer function (as string)"),
      initialValue: z.any().optional().describe("Initial value for reduce operation")
    }).describe("Parameters for the operation")
  },
  handler: async (args: {
    operation: "filter" | "map" | "reduce";
    data: any[];
    params: {
      predicate?: string;
      mapper?: string;
      reducer?: string;
      initialValue?: any;
    };
  }, extra: RequestHandlerExtra) => {
    console.log(`Executing dataProcessor algorithm with operation: ${args.operation}`);
    
    try {
      const { operation, data, params } = args;
      
      if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
      }
      
      switch (operation) {
        case "filter": {
          if (!params.predicate) {
            throw new Error("Predicate function is required for filter operation");
          }
          // Create function from string (with security considerations in production)
          const predicateFn = new Function('item', 'index', 'array', `return ${params.predicate}`);
          return data.filter((item, index, array) => predicateFn(item, index, array));
        }
        
        case "map": {
          if (!params.mapper) {
            throw new Error("Mapper function is required for map operation");
          }
          // Create function from string (with security considerations in production)
          const mapperFn = new Function('item', 'index', 'array', `return ${params.mapper}`);
          return data.map((item, index, array) => mapperFn(item, index, array));
        }
        
        case "reduce": {
          if (!params.reducer) {
            throw new Error("Reducer function is required for reduce operation");
          }
          // Create function from string (with security considerations in production)
          const reducerFn = new Function(
            'accumulator', 
            'currentValue', 
            'index', 
            'array', 
            `return ${params.reducer}`
          );
          
          return data.reduce(
            (acc, curr, idx, arr) => reducerFn(acc, curr, idx, arr),
            params.initialValue
          );
        }
        
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error: any) {
      console.error(`Error in dataProcessor algorithm: ${error.message}`);
      throw error;
    }
  }
};

export default dataProcessorAlgorithm;