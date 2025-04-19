import { ResourceConfig } from "../models/resource-config.js";

const configResource: ResourceConfig = {
  name: "config",
  template: "config://app",
  handler: async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "App configuration here"
    }]
  })
};

export default configResource;