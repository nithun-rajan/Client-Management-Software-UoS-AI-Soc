/**
 * MCP Client Service
 * 
 * This service handles all communication with the MCP (Model Context Protocol) server.
 * It provides methods to send messages, receive responses, and manage conversations.
 * 
 * Think of this as the "bridge" between your React UI and the AI backend.
 */

import type {
  MCPConfig,
  MCPResponse,
  Message,
  Tool,
  SendMessageOptions,
  StreamChunk,
  ConnectionStatus,
} from '../types/mcp';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: MCPConfig = {
  serverUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8001',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  enableStreaming: false, // Start with simple request/response, add streaming later
};

// ============================================================================
// MCP CLIENT CLASS
// ============================================================================

class MCPClient {
  private config: MCPConfig;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private abortController?: AbortController;

  constructor(config: Partial<MCPConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  /**
   * Check if the MCP server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });
      
      this.connectionStatus = response.ok ? 'connected' : 'error';
      return response.ok;
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('[MCP Client] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // ==========================================================================
  // TOOL DISCOVERY
  // ==========================================================================

  /**
   * Get list of available tools from the MCP server
   * This tells us what the AI can do (search properties, get KPIs, etc.)
   */
  async listTools(): Promise<Tool[]> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/tools`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('[MCP Client] Failed to list tools:', error);
      
      // Return mock tools for development if server isn't ready
      return this.getMockTools();
    }
  }

  // ==========================================================================
  // MESSAGE SENDING
  // ==========================================================================

  /**
   * Send a message to the MCP server and get a response
   * This is the main method you'll use from your React components
   */
  async sendMessage(
    message: string,
    options: SendMessageOptions = {}
  ): Promise<MCPResponse> {
    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.config.serverUrl}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        signal: this.abortController.signal,
        body: JSON.stringify({
          message,
          conversationId: options.conversationId,
          systemPrompt: options.systemPrompt,
          tools: options.tools,
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`);
      }

      const data: MCPResponse = await response.json();
      return data;
    } catch (error: any) {
      // If request was aborted, don't treat as error
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      console.error('[MCP Client] Failed to send message:', error);
      
      // Return mock response for development
      return this.getMockResponse(message);
    }
  }

  /**
   * Send a message with streaming response (for that "typing" effect)
   * This is more advanced - we'll implement this after basic chat works
   */
  async *streamMessage(
    message: string,
    options: SendMessageOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.config.enableStreaming) {
      throw new Error('Streaming is not enabled');
    }

    // TODO: Implement Server-Sent Events (SSE) streaming
    // For now, just throw an error
    throw new Error('Streaming not yet implemented');
  }

  /**
   * Cancel any ongoing request
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Get HTTP headers for requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication if configured
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Add auth token from localStorage (your existing auth system)
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // ==========================================================================
  // MOCK DATA (for development without backend)
  // ==========================================================================

  /**
   * Return mock tools for development
   * This lets you test the UI before the backend is ready
   */
  private getMockTools(): Tool[] {
    return [
      {
        name: 'search_properties',
        description: 'Search for properties with filters like location, price range, bedrooms',
        category: 'Properties',
        icon: '🏠',
        parameters: [
          { name: 'location', type: 'string', description: 'City or area', required: false },
          { name: 'min_price', type: 'number', description: 'Minimum price', required: false },
          { name: 'max_price', type: 'number', description: 'Maximum price', required: false },
          { name: 'bedrooms', type: 'number', description: 'Number of bedrooms', required: false },
        ],
      },
      {
        name: 'get_kpis',
        description: 'Get key performance indicators and analytics',
        category: 'Analytics',
        icon: '📊',
        parameters: [
          { name: 'period', type: 'string', description: 'Time period (week, month, year)', required: false },
        ],
      },
      {
        name: 'find_tenants',
        description: 'Search for tenants or applicants',
        category: 'Tenants',
        icon: '👥',
        parameters: [
          { name: 'name', type: 'string', description: 'Tenant name', required: false },
          { name: 'status', type: 'string', description: 'Status (active, pending, etc)', required: false },
        ],
      },
      {
        name: 'get_landlords',
        description: 'Get landlord information',
        category: 'Landlords',
        icon: '🏢',
        parameters: [
          { name: 'name', type: 'string', description: 'Landlord name', required: false },
        ],
      },
    ];
  }

  /**
   * Generate a mock response based on the message
   * This is just for development - remove once backend is ready
   */
  private getMockResponse(message: string): MCPResponse {
    const messageId = `msg_${Date.now()}`;
    const lowerMessage = message.toLowerCase();

    // Simulate different responses based on keywords
    let content = "I'm a mock AI assistant. The MCP server isn't running yet, but I'm here to show you how the UI will work!";
    let toolCalls = undefined;
    let toolResults = undefined;

    if (lowerMessage.includes('property') || lowerMessage.includes('properties')) {
      content = "I found 8 properties matching your criteria. Here they are:";
      toolCalls = [{
        id: 'call_1',
        name: 'search_properties',
        arguments: { location: 'Southampton', max_price: 1500 },
        status: 'success' as const,
      }];
      toolResults = [{
        toolCallId: 'call_1',
        toolName: 'search_properties',
        result: {
          count: 8,
          properties: [
            { id: 1, address: '123 High Street, Southampton', rent: 1200, bedrooms: 2 },
            { id: 2, address: '456 London Road, Southampton', rent: 1400, bedrooms: 3 },
          ],
        },
        executionTime: 234,
      }];
    } else if (lowerMessage.includes('kpi') || lowerMessage.includes('analytics') || lowerMessage.includes('metrics')) {
      content = "Here are your key metrics for this month:";
      toolCalls = [{
        id: 'call_2',
        name: 'get_kpis',
        arguments: { period: 'month' },
        status: 'success' as const,
      }];
      toolResults = [{
        toolCallId: 'call_2',
        toolName: 'get_kpis',
        result: {
          total_properties: 45,
          occupied_properties: 38,
          vacancy_rate: 15.6,
          average_rent: 1250,
        },
        executionTime: 156,
      }];
    }

    return {
      messageId,
      content,
      toolCalls,
      toolResults,
      conversationId: 'mock_conversation',
      metadata: {
        model: 'gpt-4o-mini (mock)',
        tokensUsed: 150,
        responseTime: 500,
      },
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Export a single instance that can be used throughout the app
 * This ensures we maintain one connection to the MCP server
 */
export const mcpClient = new MCPClient();

// Also export the class in case you want multiple instances
export { MCPClient };

