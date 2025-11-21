/**
 * Tool Call Card Component
 * 
 * Displays when the AI calls a tool (function) to fetch data or perform actions.
 * Shows the tool name, parameters, and results in an expandable card.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCall, ToolResult } from '@/types/mcp';

interface ToolCallCardProps {
  toolCall: ToolCall;
  result?: ToolResult;
}

export function ToolCallCard({ toolCall, result }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine status
  const status = toolCall.status || 'pending';
  const hasResult = !!result;
  const hasError = !!result?.error;

  // Get icon and color based on status
  const getStatusDisplay = () => {
    if (hasError) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        color: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
        textColor: 'text-red-700 dark:text-red-300',
      };
    }

    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          color: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
          textColor: 'text-green-700 dark:text-green-300',
        };
      case 'running':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
          textColor: 'text-blue-700 dark:text-blue-300',
        };
      default:
        return {
          icon: <Wrench className="h-4 w-4 text-gray-500" />,
          color: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
          textColor: 'text-gray-700 dark:text-gray-300',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Format tool name for display (e.g., "search_properties" -> "Search Properties")
  const formatToolName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 overflow-hidden transition-all duration-200',
        statusDisplay.color
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/5'
        )}
      >
        {/* Expand/Collapse Icon */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
        )}

        {/* Status Icon */}
        {statusDisplay.icon}

        {/* Tool Name */}
        <span className={cn('text-sm font-medium', statusDisplay.textColor)}>
          {formatToolName(toolCall.name)}
        </span>

        {/* Execution Time (if available) */}
        {result?.executionTime && (
          <span className="ml-auto text-xs text-gray-500">
            {result.executionTime}ms
          </span>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-current/10 space-y-2">
          {/* Arguments/Parameters */}
          {Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Parameters:
              </h4>
              <pre className="text-xs bg-black/5 dark:bg-white/5 rounded p-2 overflow-x-auto">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {hasResult && !hasError && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Result:
              </h4>
              <pre className="text-xs bg-black/5 dark:bg-white/5 rounded p-2 overflow-x-auto max-h-40 overflow-y-auto">
                {typeof result.result === 'string'
                  ? result.result
                  : JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {hasError && (
            <div>
              <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                Error:
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 rounded p-2">
                {result.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

