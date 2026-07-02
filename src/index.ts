#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { checkAiContent } from "./tools/check-ai-content.js";

const server = new Server(
  {
    name: "naturalmelo-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "check_ai_content",
      description:
        "Analyze text for AI-generated template patterns. " +
        "Runs a built-in rule scanner (no API key needed). " +
        "Optionally, set OPENAI_API_KEY for an LLM-powered second pass that merges with rule results.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to analyze (minimum 20 characters).",
          },
          mode: {
            type: "string",
            enum: ["general", "academic"],
            description:
              "Analysis mode: 'general' for blog/marketing copy, 'academic' for scholarly writing.",
          },
        },
        required: ["text"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "check_ai_content") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const output = await checkAiContent(request.params.arguments ?? {});
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(output, null, 2),
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
