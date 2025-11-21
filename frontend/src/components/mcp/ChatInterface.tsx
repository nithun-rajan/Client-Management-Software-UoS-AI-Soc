/**
 * Chat Interface Component
 * 
 * The main chat area that displays all messages.
 * Auto-scrolls to the latest message.
 */

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/types/mcp';
import { Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatInterface({ messages, isLoading = false }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div ref={scrollRef} className="space-y-6">
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6 mb-6">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI Assistant Ready
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
              I can help you search properties, analyze KPIs, manage tenants, and more.
            </p>
            
            {/* Suggested prompts */}
            <div className="space-y-2 w-full max-w-md">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Try asking:
              </p>
              {[
                '🏠 Show me available properties in Southampton',
                '📊 What are my key metrics this month?',
                '👥 Find tenants looking for 2-bedroom flats',
                '💰 How many properties are currently let?',
              ].map((prompt, index) => (
                <div
                  key={index}
                  className="text-left text-sm p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Thinking...
              </span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

