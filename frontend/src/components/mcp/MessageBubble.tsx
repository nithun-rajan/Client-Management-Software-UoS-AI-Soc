/**
 * Message Bubble Component
 * 
 * Displays individual messages in the chat interface.
 * Different styles for user messages vs AI responses.
 */

import { Bot, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/mcp';
import { ToolCallCard } from './ToolCallCard';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const hasError = !!message.error;

  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-blue-600'
            : isSystem
              ? 'bg-gray-600'
              : 'bg-gradient-to-br from-purple-500 to-blue-500'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
        {/* Main message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 shadow-sm',
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                : hasError
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          )}
        >
          {/* Error icon */}
          {hasError && (
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Error</span>
            </div>
          )}

          {/* Message text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex gap-1 mt-2">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
            </div>
          )}
        </div>

        {/* Tool calls display */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 w-full">
            {message.toolCalls.map((toolCall) => {
              const result = message.toolResults?.find(
                (r) => r.toolCallId === toolCall.id
              );
              return (
                <ToolCallCard
                  key={toolCall.id}
                  toolCall={toolCall}
                  result={result}
                />
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

