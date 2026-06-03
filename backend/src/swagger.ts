export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "WebCrawler API",
    version: "0.1.0"
  },
  paths: {
    "/health": {
      get: {
        summary: "Backend health check",
        responses: {
          "200": {
            description: "Service is healthy"
          }
        }
      }
    },
    "/api/websites": {
      get: {
        summary: "List website records",
        responses: {
          "200": {
            description: "Website records"
          }
        }
      },
      post: {
        summary: "Create website record",
        responses: {
          "501": {
            description: "Skeleton endpoint"
          }
        }
      }
    },
    "/api/executions": {
      get: {
        summary: "List executions",
        responses: {
          "200": {
            description: "Executions"
          }
        }
      }
    }
  }
};
