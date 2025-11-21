/**
 * useMCPChat Hook
 * 
 * This custom React hook manages the state for the MCP chat interface.
 * It handles sending messages, receiving responses, and managing conversation history.
 * 
 * Usage in a component:
 * ```tsx
 * const { messages, sendMessage, isLoading, clearHistory } = useMCPChat();
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { mcpClient } from '../lib/mcpClient';
import type {
  Message,
  ConversationState,
  Tool,
  SendMessageOptions,
} from '../types/mcp';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseMCPChatReturn {
  // State
  messages: Message[];                    // All messages in the conversation
  isLoading: boolean;                     // True while waiting for AI response
  error: string | null;                   // Latest error message
  connectionStatus: ConversationState['connectionStatus'];
  availableTools: Tool[];                 // Tools the AI can use
  conversationId: string;                 // Current conversation ID

  // Actions
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  clearHistory: () => void;               // Clear all messages
  retryLastMessage: () => Promise<void>;  // Retry if a message failed
  cancelMessage: () => void;              // Cancel ongoing request
  
  // Utilities
  exportConversation: () => string;       // Export as JSON for debugging
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useMCPChat(): UseMCPChatReturn {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConversationState['connectionStatus']>('disconnected');
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [conversationId] = useState<string>(() => `conv_${Date.now()}`);
  
  // Keep track of the last user message for retry functionality
  const lastUserMessageRef = useRef<string>('');

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  /**
   * On mount, check connection and load available tools
   */
  useEffect(() => {
    const initialize = async () => {
      setConnectionStatus('connecting');
      
      // Check if server is available
      const isHealthy = await mcpClient.checkHealth();
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
      
      // Load available tools
      try {
        const tools = await mcpClient.listTools();
        setAvailableTools(tools);
      } catch (err) {
        console.error('[useMCPChat] Failed to load tools:', err);
      }
    };

    initialize();

    // Add welcome message
    addSystemMessage(
      "👋 Hi! I'm your AI assistant for the CRM. I can help you find properties, check analytics, manage tenants, and more. What would you like to know?"
    );
  }, []);

  // --------------------------------------------------------------------------
  // MESSAGE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Add a message to the conversation
   */
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Update a specific message (useful for streaming or status updates)
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
    );
  }, []);

  /**
   * Add a system message (like welcome message or errors)
   */
  const addSystemMessage = useCallback((content: string) => {
    const message: Message = {
      id: `sys_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    addMessage(message);
  }, [addMessage]);

  // --------------------------------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------------------------------

  /**
   * Send a user message to the AI and handle the response
   */
  const sendMessage = useCallback(async (
    content: string,
    options: SendMessageOptions = {}
  ) => {
    if (!content.trim()) return;
    if (isLoading) return; // Don't send if already loading

    // Store for retry
    lastUserMessageRef.current = content;

    // Clear any previous errors
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    addMessage(userMessage);

    try {
      // Send to MCP server
      const response = await mcpClient.sendMessage(content, {
        ...options,
        conversationId,
      });

      // Add assistant's response
      const assistantMessage: Message = {
        id: response.messageId,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
      };
      addMessage(assistantMessage);

    } catch (err: any) {
      console.error('[useMCPChat] Failed to send message:', err);
      
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        error: errorMessage,
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId, addMessage]);

  // --------------------------------------------------------------------------
  // RETRY FAILED MESSAGE
  // --------------------------------------------------------------------------

  /**
   * Retry the last message if it failed
   */
  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return;
    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  // --------------------------------------------------------------------------
  // CANCEL ONGOING REQUEST
  // --------------------------------------------------------------------------

  /**
   * Cancel any ongoing message request
   */
  const cancelMessage = useCallback(() => {
    mcpClient.cancelRequest();
    setIsLoading(false);
  }, []);

  // --------------------------------------------------------------------------
  // CLEAR HISTORY
  // --------------------------------------------------------------------------

  /**
   * Clear all messages and start fresh
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    lastUserMessageRef.current = '';
    
    // Add welcome message again
    addSystemMessage(
      "Chat cleared! What would you like to know?"
    );
  }, [addSystemMessage]);

  // --------------------------------------------------------------------------
  // EXPORT CONVERSATION
  // --------------------------------------------------------------------------

  /**
   * Export conversation as JSON (useful for debugging or saving)
   */
  const exportConversation = useCallback(() => {
    const data = {
      conversationId,
      messages,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [conversationId, messages]);

  // --------------------------------------------------------------------------
  // RETURN
  // --------------------------------------------------------------------------

  return {
    // State
    messages,
    isLoading,
    error,
    connectionStatus,
    availableTools,
    conversationId,

    // Actions
    sendMessage,
    clearHistory,
    retryLastMessage,
    cancelMessage,

    // Utilities
    exportConversation,
  };
}

