const websiteRecordExample = {
  id: "c22d3fde-7ad1-477b-b3f1-9983f4a25575",
  url: "https://example.com",
  boundaryRegexp: "^https://example.com/$",
  periodicity: "HOUR",
  label: "Example",
  active: true,
  tags: ["test"],
  lastCrawledAt: "2026-06-18T14:40:23.438Z",
  lastStatus: "SUCCEEDED",
  createdAt: "2026-06-18T14:40:22.100Z",
  updatedAt: "2026-06-18T14:40:23.438Z",
};

const executionExample = {
  id: "509084ff-260c-41b9-9a4b-8649837e3de4",
  websiteRecordId: "c22d3fde-7ad1-477b-b3f1-9983f4a25575",
  websiteRecordLabel: "Example",
  status: "SUCCEEDED",
  startedAt: "2026-06-18T14:40:22.884Z",
  endedAt: "2026-06-18T14:40:23.438Z",
  pagesCrawled: 1,
  createdAt: "2026-06-18T14:40:22.884Z",
};

const websiteIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Website record identifier.",
  schema: { type: "string", format: "uuid" },
  example: "c22d3fde-7ad1-477b-b3f1-9983f4a25575",
};

const errorResponse = {
  description: "Request failed.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
};

const websiteRecordResponse = {
  description: "Website record.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/WebsiteRecord" },
      examples: {
        example: { value: websiteRecordExample },
      },
    },
  },
};

const executionListResponse = {
  description: "Execution records.",
  content: {
    "application/json": {
      schema: {
        type: "array",
        items: { $ref: "#/components/schemas/Execution" },
      },
      examples: {
        example: { value: [executionExample] },
      },
    },
  },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "WebCrawler API",
    version: "0.1.0",
    description:
      "REST API for managing website records and crawl executions. Crawled graph data is exposed separately through GraphQL.",
  },
  tags: [
    { name: "Health", description: "Service status endpoints." },
    { name: "Website Records", description: "CRUD for crawl configuration records." },
    { name: "Executions", description: "Crawl execution listing and manual starts." },
    { name: "Crawler", description: "Temporary direct crawl endpoint used during development." },
  ],
  components: {
    schemas: {
      Periodicity: {
        type: "string",
        enum: ["MINUTE", "HOUR", "DAY"],
        description: "How often an active website record should be crawled.",
      },
      ExecutionStatus: {
        type: "string",
        enum: ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"],
      },
      WebsiteRecord: {
        type: "object",
        required: [
          "id",
          "url",
          "boundaryRegexp",
          "periodicity",
          "label",
          "active",
          "tags",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          url: {
            type: "string",
            format: "uri",
            description: "Start URL for crawling.",
          },
          boundaryRegexp: {
            type: "string",
            description:
              "Resolved absolute URLs must match this JavaScript regular expression to be followed.",
          },
          periodicity: { $ref: "#/components/schemas/Periodicity" },
          label: { type: "string" },
          active: {
            type: "boolean",
            description: "Inactive records are not selected by periodic scheduling.",
          },
          tags: { type: "array", items: { type: "string" } },
          lastCrawledAt: { type: "string", format: "date-time", nullable: true },
          lastStatus: {
            allOf: [{ $ref: "#/components/schemas/ExecutionStatus" }],
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        example: websiteRecordExample,
      },
      WebsiteRecordCreateInput: {
        type: "object",
        required: ["url", "boundaryRegexp", "periodicity", "label"],
        properties: {
          url: { type: "string", format: "uri", example: "https://example.com" },
          boundaryRegexp: {
            type: "string",
            example: "^https://example.com/$",
          },
          periodicity: { $ref: "#/components/schemas/Periodicity" },
          label: { type: "string", example: "Example" },
          active: { type: "boolean", default: true },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["test"],
          },
        },
      },
      WebsiteRecordUpdateInput: {
        type: "object",
        description: "Partial update. Send only fields that should change.",
        properties: {
          url: { type: "string", format: "uri" },
          boundaryRegexp: { type: "string" },
          periodicity: { $ref: "#/components/schemas/Periodicity" },
          label: { type: "string" },
          active: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
        },
        example: {
          label: "Example updated",
          tags: ["demo", "small"],
        },
      },
      Execution: {
        type: "object",
        required: [
          "id",
          "websiteRecordId",
          "websiteRecordLabel",
          "status",
          "pagesCrawled",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          websiteRecordId: { type: "string", format: "uuid" },
          websiteRecordLabel: { type: "string" },
          status: { $ref: "#/components/schemas/ExecutionStatus" },
          startedAt: { type: "string", format: "date-time", nullable: true },
          endedAt: { type: "string", format: "date-time", nullable: true },
          pagesCrawled: {
            type: "integer",
            minimum: 0,
            description: "Number of pages saved for this execution after completion.",
          },
          createdAt: { type: "string", format: "date-time" },
        },
        example: executionExample,
      },
      StartExecutionResponse: {
        type: "object",
        required: ["message", "websiteRecordId", "executionId"],
        properties: {
          message: { type: "string", example: "Execution started" },
          websiteRecordId: { type: "string", format: "uuid" },
          executionId: { type: "string", format: "uuid" },
        },
      },
      DirectCrawlInput: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri", example: "https://example.com" },
          regex: {
            type: "string",
            description: "Boundary regular expression. Defaults to an empty regex.",
            example: "^https://example.com/$",
          },
          label: {
            type: "string",
            description: "Optional label used when the endpoint creates a temporary website record.",
            example: "Example",
          },
          websiteRecordId: {
            type: "string",
            format: "uuid",
            description: "Existing website record ID, if already known.",
          },
          executionId: {
            type: "string",
            format: "uuid",
            description: "Existing execution ID, if already known.",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Website record not found" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["periodicity must be one of MINUTE, HOUR, DAY"],
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Backend health check",
        responses: {
          "200": {
            description: "Service is healthy.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "backend" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/websites": {
      get: {
        tags: ["Website Records"],
        summary: "List website records",
        description:
          "Returns all website records. Pagination/filtering/sorting are still planned and not implemented yet.",
        responses: {
          "200": {
            description: "Website records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WebsiteRecord" },
                },
                examples: {
                  example: { value: [websiteRecordExample] },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Website Records"],
        summary: "Create website record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebsiteRecordCreateInput" },
              examples: {
                example: {
                  value: {
                    url: "https://example.com",
                    boundaryRegexp: "^https://example.com/$",
                    periodicity: "HOUR",
                    label: "Example",
                    active: true,
                    tags: ["test"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": websiteRecordResponse,
          "400": errorResponse,
        },
      },
    },
    "/api/websites/{id}": {
      get: {
        tags: ["Website Records"],
        summary: "Get website record",
        parameters: [websiteIdParameter],
        responses: {
          "200": websiteRecordResponse,
          "404": errorResponse,
        },
      },
      patch: {
        tags: ["Website Records"],
        summary: "Update website record",
        parameters: [websiteIdParameter],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebsiteRecordUpdateInput" },
              examples: {
                relabel: {
                  value: {
                    label: "Example updated",
                    tags: ["demo", "small"],
                  },
                },
                deactivate: {
                  value: {
                    active: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": websiteRecordResponse,
          "400": errorResponse,
          "404": errorResponse,
        },
      },
      delete: {
        tags: ["Website Records"],
        summary: "Delete website record",
        description:
          "Deletes the website record and related executions/crawled data through database cascades.",
        parameters: [websiteIdParameter],
        responses: {
          "204": { description: "Website record deleted." },
          "404": errorResponse,
        },
      },
    },
    "/api/websites/{id}/executions": {
      get: {
        tags: ["Executions"],
        summary: "List executions for one website record",
        parameters: [websiteIdParameter],
        responses: {
          "200": executionListResponse,
          "404": errorResponse,
        },
      },
      post: {
        tags: ["Executions"],
        summary: "Start execution for website record",
        description:
          "Creates a RUNNING execution and enqueues the website record start URL for crawling.",
        parameters: [websiteIdParameter],
        responses: {
          "202": {
            description: "Execution started.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StartExecutionResponse" },
                examples: {
                  example: {
                    value: {
                      message: "Execution started",
                      websiteRecordId: "c22d3fde-7ad1-477b-b3f1-9983f4a25575",
                      executionId: "509084ff-260c-41b9-9a4b-8649837e3de4",
                    },
                  },
                },
              },
            },
          },
          "404": errorResponse,
        },
      },
    },
    "/api/executions": {
      get: {
        tags: ["Executions"],
        summary: "List executions",
        description:
          "Returns all executions, or only executions for one website record when websiteRecordId is provided.",
        parameters: [
          {
            name: "websiteRecordId",
            in: "query",
            required: false,
            description: "Optional website record filter.",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": executionListResponse,
        },
      },
    },
    "/crawl": {
      post: {
        tags: ["Crawler"],
        summary: "Enqueue direct crawl request",
        description:
          "Development helper. Prefer POST /api/websites/{id}/executions for assignment-facing flows.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DirectCrawlInput" },
              examples: {
                example: {
                  value: {
                    url: "https://example.com",
                    regex: "^https://example.com/$",
                    label: "Example",
                  },
                },
              },
            },
          },
        },
        responses: {
          "202": {
            description: "URL enqueued for crawling.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StartExecutionResponse" },
              },
            },
          },
          "400": errorResponse,
          "500": errorResponse,
        },
      },
    },
  },
};
