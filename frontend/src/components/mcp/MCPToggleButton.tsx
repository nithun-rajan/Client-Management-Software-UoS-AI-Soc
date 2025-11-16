/**
 * MCP Toggle Button Component
 * 
 * This is the floating action button (FAB) that appears in the bottom-right corner.
 * When clicked, it opens the AI assistant sidebar.
 * 
 * Think of it like the help button in modern apps - always accessible!
 */

import { MessageSquare, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCPToggleButtonProps {
  isOpen: boolean;                 // Is the sidebar currently open?
  onClick: () => void;              // What to do when clicked
  hasUnread?: boolean;              // Show a badge for unread messages
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export function MCPToggleButton({
  isOpen,
  onClick,
  hasUnread = false,
  connectionStatus = 'disconnected',
}: MCPToggleButtonProps) {
  
  // Determine button color based on connection status
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700';
      case 'connecting':
        return 'bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600';
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Toggle Button */}
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95',
          'ring-4 ring-white/20 hover:ring-white/30',
          getStatusColor(),
          isOpen && 'scale-95'
        )}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {/* Icon with animation */}
        <div className="relative">
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
              
              {/* Unread badge */}
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-ping" />
              )}
            </>
          )}
        </div>
      </Button>

      {/* Tooltip - shows on hover */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            AI Assistant
            <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      <div className="absolute -top-1 -left-1">
        <span
          className={cn(
            'h-3 w-3 rounded-full border-2 border-white shadow-md',
            connectionStatus === 'connected' && 'bg-green-500',
            connectionStatus === 'connecting' && 'bg-yellow-500 animate-pulse',
            connectionStatus === 'error' && 'bg-red-500',
            connectionStatus === 'disconnected' && 'bg-gray-400'
          )}
          title={`Status: ${connectionStatus}`}
        />
      </div>
    </div>
  );
}

