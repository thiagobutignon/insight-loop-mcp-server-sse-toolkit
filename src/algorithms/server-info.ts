import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import os from "os";
import { AlgorithmConfig } from '../models/algorithm-config.js';


/**
 * Server Info Algorithm
 * 
 * Returns information about the server environment
 * This is an example of an algorithm that takes no parameters
 */
const serverInfoAlgorithm: AlgorithmConfig = {
  name: "serverInfo",
  description: "Returns information about the server environment",
  // No paramsSchema defined since this algorithm doesn't take parameters
  handler: async (extra: RequestHandlerExtra) => {
    console.log("Executing serverInfo algorithm");
    
    try {
      // Collect server information
      const serverInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        architecture: os.arch(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
        freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
        uptime: Math.round(os.uptime() / 3600) + ' hours',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };
      
      return {
        success: true,
        info: serverInfo
      };
    } catch (error: any) {
      console.error(`Error in serverInfo algorithm: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default serverInfoAlgorithm;