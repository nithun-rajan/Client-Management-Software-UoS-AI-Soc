/**
 * MCP (Model Context Protocol) Type Definitions
 * 
 * These types define the structure of messages, tool calls, and responses
 * that flow between the frontend and the MCP server.
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Represents who sent the message
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * A single message in the conversation
 */
export interface Message {
  id: string;                    // Unique identifier for this message
  role: MessageRole;             // Who sent it (user, AI, system, or tool)
  content: string;               // The actual text content
  timestamp: Date;               // When it was sent
  toolCalls?: ToolCall[];        // If AI made function calls, they're here
  toolResults?: ToolResult[];    // Results from those tool calls
  isStreaming?: boolean;         // True while message is being typed out
  error?: string;                // If something went wrong
}

// ============================================================================
// TOOL CALLING TYPES
// ============================================================================

/**
 * Represents a tool (function) that the AI can call
 * For example: "search_properties", "get_kpis", etc.
 */
export interface Tool {
  name: string;                  // Function name (e.g., "search_properties")
  description: string;           // What this tool does
  parameters: ToolParameter[];   // What inputs it needs
  category?: string;             // Group tools by category (properties, landlords, etc.)
  icon?: string;                 // Icon to show in UI
}

/**
 * A parameter that a tool accepts
 */
export interface ToolParameter {
  name: string;                  // Parameter name (e.g., "location")
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;           // What this parameter is for
  required: boolean;             // Whether it's mandatory
  enum?: string[];               // If it's a select from list
}

/**
 * When the AI decides to call a tool, this is what it sends
 */
export interface ToolCall {
  id: string;                    // Unique ID for this tool call
  name: string;                  // Which tool to call
  arguments: Record<string, any>; // Parameters to pass to the tool
  status?: 'pending' | 'running' | 'success' | 'error';
}

/**
 * The result from executing a tool
 */
export interface ToolResult {
  toolCallId: string;            // Links back to the ToolCall
  toolName: string;              // Which tool was called
  result: any;                   // The actual data returned
  error?: string;                // If the tool failed
  executionTime?: number;        // How long it took (in ms)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from the MCP server when we send a message
 */
export interface MCPResponse {
  messageId: string;             // ID of the assistant's response
  content: string;               // The AI's reply text
  toolCalls?: ToolCall[];        // If AI wants to call tools
  toolResults?: ToolResult[];    // Results from those tools
  conversationId?: string;       // Track conversation across messages
  error?: string;                // If something went wrong
  metadata?: {
    model?: string;              // Which AI model was used
    tokensUsed?: number;         // Cost tracking
    responseTime?: number;       // Performance monitoring
  };
}

/**
 * Streaming chunk when using Server-Sent Events (SSE)
 */
export interface StreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;              // Partial text content
  toolCall?: ToolCall;           // Tool being called
  toolResult?: ToolResult;       // Result from tool
  done?: boolean;                // Stream finished
  error?: string;                // If error occurred
}

// ============================================================================
// CONNECTION & STATE TYPES
// ============================================================================

/**
 * Status of the connection to MCP server
 */
export type ConnectionStatus = 
  | 'disconnected'   // Not connected
  | 'connecting'     // Attempting to connect
  | 'connected'      // Successfully connected
  | 'error';         // Connection failed

/**
 * Configuration for the MCP client
 */
export interface MCPConfig {
  serverUrl: string;             // MCP server endpoint (e.g., http://localhost:8001)
  apiKey?: string;               // Optional authentication
  timeout?: number;              // Request timeout in ms
  maxRetries?: number;           // How many times to retry failed requests
  enableStreaming?: boolean;     // Use SSE for streaming responses
}

/**
 * The full conversation state
 */
export interface ConversationState {
  id: string;                    // Conversation ID
  messages: Message[];           // All messages in order
  isLoading: boolean;            // Waiting for AI response
  connectionStatus: ConnectionStatus;
  error?: string;                // Latest error if any
  availableTools?: Tool[];       // Tools the AI can use
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Options when sending a message
 */
export interface SendMessageOptions {
  conversationId?: string;       // Continue existing conversation
  systemPrompt?: string;         // Custom instructions for the AI
  tools?: string[];              // Limit which tools can be used
  stream?: boolean;              // Stream response or wait for full reply
}

/**
 * Suggested prompts to show the user
 */
export interface SuggestedPrompt {
  text: string;                  // The prompt text
  category: string;              // What type of query (properties, analytics, etc.)
  icon?: string;                 // Icon to display
}

