import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceConfig } from "../models/resource-config.js";


// Example of a more complex resource with multiple template parameters
const dataSourceResource: ResourceConfig = {
  name: "data-source",
  template: new ResourceTemplate("data://{sourceType}/{sourceId}", { 
    list: async () => {
      // In a real implementation, you might query a database here
      // to get all available data sources
      return {
        resources: [
          { name: "data-source-database", uri: "data://database/customers" },
          { name: "data-source-api", uri: "data://api/sales" },
          { name: "data-source-file", uri: "data://file/reports" }
        ]
      };
    }
  }),
  handler: async (uri, { sourceType, sourceId }) => {
    // In a real implementation, you would fetch data based on sourceType and sourceId
    let data;
    
    switch (sourceType) {
      case 'database':
        // Query database
        data = `Database data for ${sourceId}`;
        break;
      case 'api':
        // Make API call
        data = `API data for ${sourceId}`;
        break;
      case 'file':
        // Read from file
        data = `File data for ${sourceId}`;
        break;
      default:
        data = `Unknown source type: ${sourceType}`;
    }
    
    return {
      contents: [{
        uri: uri.href,
        text: data
      }]
    };
  }
};

export default dataSourceResource;