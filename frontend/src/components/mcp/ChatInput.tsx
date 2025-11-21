/**
 * Chat Input Component
 * 
 * The text input area at the bottom of the chat where users type their messages.
 * Supports multiline input (Shift+Enter for new line, Enter to send).
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask me anything about your CRM...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle sending message
  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || disabled) return;

    onSend(trimmedInput);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea as user types
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex gap-2 items-end">
        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none',
            'focus-visible:ring-1 focus-visible:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          rows={1}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          size="icon"
          className={cn(
            'h-11 w-11 shrink-0 rounded-lg',
            'bg-blue-600 hover:bg-blue-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Hint text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">Enter</kbd> to send, 
        <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 ml-1">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

