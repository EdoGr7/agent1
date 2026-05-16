export interface McpToolCallResult {
  content?: Array<{
    type: string;
    text?: string;
    data?: unknown;
    mimeType?: string;
    resource?: { uri: string; mimeType?: string; text?: string; blob?: string };
  }>;
  structuredContent?: unknown;
  isError?: boolean;
  meta?: Record<string, unknown>;
}

export interface McpClient {
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult>;
  listTools(): Promise<{ name: string; description?: string }[]>;
}

export class StaticMockMcpClient implements McpClient {
  private readonly handlers: Map<
    string,
    (args: Record<string, unknown>) => Promise<McpToolCallResult>
  > = new Map();
  private readonly tools: { name: string; description?: string }[] = [];

  on(
    name: string,
    handler: (args: Record<string, unknown>) => Promise<McpToolCallResult>,
    description?: string,
  ): this {
    this.handlers.set(name, handler);
    this.tools.push({ name, description });
    return this;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return {
        isError: true,
        content: [{ type: "text", text: `Mock has no handler for tool "${name}".` }],
      };
    }
    return handler(args);
  }

  async listTools(): Promise<{ name: string; description?: string }[]> {
    return this.tools;
  }
}
