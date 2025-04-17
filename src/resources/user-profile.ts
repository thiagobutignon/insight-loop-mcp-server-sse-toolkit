import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceConfig } from "../models/resource-config.js";

const userProfileResource: ResourceConfig = {
  name: "user-profile",
  template: new ResourceTemplate("users://{userId}/profile", { 
    list: async () => {
      return {
        resources: [
          { name: "user-profile", uri: "users://default/profile" },
          // Add more predefined profiles as needed
        ]
      };
    }
  }),
  handler: async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `Profile data for user ${userId}`
    }]
  })
};

export default userProfileResource;
