/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { ZodRawShape } from "zod";

/**
 * Algorithm handler types to accommodate both with and without parameters
 */
export type AlgorithmHandlerWithParams = (args: any, extra: RequestHandlerExtra) => any | Promise<any>;
export type AlgorithmHandlerNoParams = (extra: RequestHandlerExtra) => any | Promise<any>;
export type AlgorithmHandler = AlgorithmHandlerWithParams | AlgorithmHandlerNoParams;

/**
 * Configuration for defining an algorithm
 */
export interface Algorithm {
  name: string;
  description?: string;
  paramsSchema?: ZodRawShape;
  handler: AlgorithmHandler;
}