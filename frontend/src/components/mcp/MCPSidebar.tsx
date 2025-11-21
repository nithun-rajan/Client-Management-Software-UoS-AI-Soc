/**
 * MCP Sidebar Component
 * 
 * The main AI assistant sidebar that slides in from the right.
 * Contains the chat interface, header, and controls.
 */

import { X, Trash2, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatInterface } from './ChatInterface';
import { ChatInput } from './ChatInput';
import { useMCPChat } from '@/hooks/useMCPChat';

interface MCPSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MCPSidebar({ isOpen, onClose }: MCPSidebarProps) {
  const {
    messages,
    isLoading,
    error,
    connectionStatus,
    sendMessage,
    clearHistory,
    exportConversation,
  } = useMCPChat();

  // Handle export conversation
  const handleExport = () => {
    const json = exportConversation();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'Connected', color: 'text-green-500' };
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-500' };
      case 'error':
        return { text: 'Connection Error', color: 'text-red-500' };
      default:
        return { text: 'Offline', color: 'text-gray-500' };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <>
      {/* Overlay backdrop (on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[450px] lg:w-[500px]',
          'bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800',
          'shadow-2xl z-50',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Title and Status */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h2>
              <p className={cn('text-xs', statusDisplay.color)}>
                {statusDisplay.text}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1">
            {/* Export Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              title="Export conversation"
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Clear History */}
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              title="Clear conversation"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Settings (future feature) */}
            <Button
              variant="ghost"
              size="icon"
              title="Settings"
              className="h-8 w-8"
              disabled
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error banner (if connection failed) */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Chat Interface */}
        <ChatInterface messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={connectionStatus === 'error'}
        />
      </aside>
    </>
  );
}

