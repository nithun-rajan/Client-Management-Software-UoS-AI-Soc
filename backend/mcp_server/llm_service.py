"""
LLM Service for MCP Server

This service handles all interactions with OpenAI (or other LLM providers).
It's responsible for:
1. Sending user messages to the AI
2. Managing function/tool calling
3. Formatting responses
4. Handling conversation context

Think of this as the "translator" between your users and the AI.
"""

import os
import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from openai import AsyncOpenAI
import asyncio

# ============================================================================
# CONFIGURATION
# ============================================================================

# Initialize OpenAI client
# The API key should be in your environment variables
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "")
)

# Default model to use
DEFAULT_MODEL = "gpt-4o-mini"  # Fast and cost-effective for CRM tasks

# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """You are an intelligent AI assistant built into a Client Management Software (CRM) for estate agents. 

**Your Role:**
You help estate agents manage their business by providing quick access to data, insights, and recommendations. You're professional, efficient, and friendly.

**What You Can Do:**
- Search and filter properties (lettings and sales)
- Find landlords, tenants, applicants, vendors, and buyers
- Analyze KPIs and business metrics
- Answer questions about the CRM data
- Provide recommendations based on market data
- Help with property valuations

**Your Personality:**
- Professional but approachable (like a helpful colleague)
- Concise - estate agents are busy people
- Data-driven - always back up suggestions with numbers
- Proactive - suggest next steps when relevant

**How You Work:**
1. When users ask questions, you call the appropriate tools/functions to fetch real data
2. You analyze the results and present them clearly
3. You format numbers nicely (e.g., £1,200 not 1200)
4. You highlight important insights
5. You ask clarifying questions if needed

**Important Guidelines:**
- Always use the available tools to fetch real data - never make up information
- If data is missing or a query returns no results, say so honestly
- Format property addresses clearly
- Use UK English (lettings, not rentals; flat, not apartment)
- When showing multiple items, limit to top 5-10 unless asked for more
- For monetary values, always use £ symbol
- For dates, use UK format (DD/MM/YYYY)

**Example Interactions:**

User: "Show me available properties in Southampton"
You: *Call search_properties tool*
"I found 12 properties available for letting in Southampton. Here are the top 5:

🏠 123 High Street - 2 bed flat - £1,200/month
🏠 45 London Road - 3 bed house - £1,650/month
..."

User: "What's my occupancy rate?"
You: *Call get_kpis tool*
"Your current occupancy rate is 84.6% (38 out of 45 properties occupied). This is slightly below the industry average of 92%. 

💡 Suggestion: You have 7 vacant properties that might benefit from a rent review or marketing push."

Remember: You're here to make estate agents' lives easier by giving them instant access to their CRM data through natural conversation!"""

# ============================================================================
# CONVERSATION MANAGEMENT
# ============================================================================

class Conversation:
    """
    Manages a single conversation thread with context.
    This keeps track of the message history so the AI remembers what was said.
    """
    
    def __init__(self, conversation_id: str):
        self.id = conversation_id
        self.messages: List[Dict[str, Any]] = []
        self.system_prompt = SYSTEM_PROMPT
    
    def add_message(self, role: str, content: str):
        """Add a message to the conversation history"""
        self.messages.append({
            "role": role,
            "content": content
        })
    
    def add_tool_call(self, tool_call_id: str, tool_name: str, tool_result: Any):
        """Add a tool call and its result to the conversation"""
        # OpenAI expects tool results in a specific format
        self.messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": tool_name,
            "content": json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
        })
    
    def get_messages_for_api(self) -> List[Dict[str, Any]]:
        """Get messages formatted for OpenAI API"""
        return [
            {"role": "system", "content": self.system_prompt},
            *self.messages
        ]
    
    def clear(self):
        """Clear conversation history (but keep system prompt)"""
        self.messages = []

# Store active conversations (in production, use Redis or similar)
conversations: Dict[str, Conversation] = {}

def get_conversation(conversation_id: str) -> Conversation:
    """Get or create a conversation"""
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation(conversation_id)
    return conversations[conversation_id]

# ============================================================================
# TOOL FORMATTING
# ============================================================================

def format_tools_for_openai(tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert our tool definitions to OpenAI's function calling format.
    
    OpenAI expects a specific JSON schema format for tools.
    This function translates our tool definitions into that format.
    """
    formatted_tools = []
    
    for tool in tools:
        # Build parameter schema
        properties = {}
        required = []
        
        for param in tool.get("parameters", []):
            properties[param["name"]] = {
                "type": param["type"],
                "description": param["description"]
            }
            
            # Add enum if present (for dropdown-style parameters)
            if "enum" in param:
                properties[param["name"]]["enum"] = param["enum"]
            
            # Track required parameters
            if param.get("required", False):
                required.append(param["name"])
        
        # Format in OpenAI's expected structure
        formatted_tools.append({
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        })
    
    return formatted_tools

# ============================================================================
# MAIN LLM FUNCTIONS
# ============================================================================

async def chat_completion(
    message: str,
    conversation_id: str,
    available_tools: List[Dict[str, Any]],
    tool_executor: callable,
    model: str = DEFAULT_MODEL,
    stream: bool = False
) -> Dict[str, Any]:
    """
    Main function to send a message to the LLM and handle the response.
    
    Parameters:
    - message: The user's message
    - conversation_id: ID to track conversation context
    - available_tools: List of tools the AI can use
    - tool_executor: Function to call when AI wants to use a tool
    - model: Which OpenAI model to use
    - stream: Whether to stream the response (for typing effect)
    
    Returns:
    - Dict with the AI's response, tool calls, and metadata
    """
    
    # Get conversation context
    conversation = get_conversation(conversation_id)
    
    # Add user message to history
    conversation.add_message("user", message)
    
    # Format tools for OpenAI
    formatted_tools = format_tools_for_openai(available_tools)
    
    # Prepare API call
    api_params = {
        "model": model,
        "messages": conversation.get_messages_for_api(),
        "tools": formatted_tools,
        "tool_choice": "auto",  # Let AI decide when to use tools
        "temperature": 0.7,  # Balance between creative and deterministic
    }
    
    try:
        # Call OpenAI
        response = await client.chat.completions.create(**api_params)
        
        assistant_message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason
        
        # Check if AI wants to call tools
        if finish_reason == "tool_calls" and assistant_message.tool_calls:
            # AI wants to use tools!
            tool_calls = []
            tool_results = []
            
            # Execute each tool call
            for tool_call in assistant_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                print(f"🔧 AI calling tool: {tool_name} with args: {tool_args}")
                
                # Execute the tool
                try:
                    result = await tool_executor(tool_name, tool_args)
                    
                    tool_calls.append({
                        "id": tool_call.id,
                        "name": tool_name,
                        "arguments": tool_args,
                        "status": "success"
                    })
                    
                    tool_results.append({
                        "toolCallId": tool_call.id,
                        "toolName": tool_name,
                        "result": result
                    })
                    
                    # Add to conversation history
                    conversation.add_tool_call(tool_call.id, tool_name, result)
                    
                except Exception as e:
                    print(f"❌ Tool execution error: {str(e)}")
                    tool_calls.append({
                        "id": tool_call.id,
                        "name": tool_name,
                        "arguments": tool_args,
                        "status": "error"
                    })
                    
                    tool_results.append({
                        "toolCallId": tool_call.id,
                        "toolName": tool_name,
                        "error": str(e)
                    })
                    
                    conversation.add_tool_call(
                        tool_call.id, 
                        tool_name, 
                        f"Error: {str(e)}"
                    )
            
            # Now get AI's final response after seeing tool results
            conversation.add_message("assistant", assistant_message.content or "")
            
            # Make another API call with tool results
            final_response = await client.chat.completions.create(
                model=model,
                messages=conversation.get_messages_for_api(),
                temperature=0.7
            )
            
            final_message = final_response.choices[0].message
            conversation.add_message("assistant", final_message.content)
            
            return {
                "content": final_message.content,
                "toolCalls": tool_calls,
                "toolResults": tool_results,
                "model": model,
                "tokensUsed": response.usage.total_tokens + final_response.usage.total_tokens
            }
        
        else:
            # No tool calls, just a regular response
            conversation.add_message("assistant", assistant_message.content)
            
            return {
                "content": assistant_message.content,
                "model": model,
                "tokensUsed": response.usage.total_tokens
            }
    
    except Exception as e:
        print(f"❌ LLM Error: {str(e)}")
        raise Exception(f"Failed to get LLM response: {str(e)}")



# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def estimate_tokens(text: str) -> int:
    """
    Rough estimate of tokens (for cost tracking).
    Rule of thumb: ~4 characters = 1 token for English
    """
    return len(text) // 4

def clear_conversation(conversation_id: str):
    """Clear a conversation's history"""
    if conversation_id in conversations:
        conversations[conversation_id].clear()

def delete_conversation(conversation_id: str):
    """Delete a conversation entirely"""
    if conversation_id in conversations:
        del conversations[conversation_id]

# ============================================================================
# EXAMPLE USAGE (for testing)
# ============================================================================

if __name__ == "__main__":
    # Example of how this service would be used
    
    async def mock_tool_executor(tool_name: str, arguments: Dict) -> Any:
        """Mock tool executor for testing"""
        return {"message": f"Tool {tool_name} executed successfully"}
    
    async def test():
        mock_tools = [
            {
                "name": "search_properties",
                "description": "Search for properties",
                "parameters": [
                    {"name": "location", "type": "string", "description": "Location", "required": False}
                ]
            }
        ]
        
        result = await chat_completion(
            message="Show me properties in Southampton",
            conversation_id="test_123",
            available_tools=mock_tools,
            tool_executor=mock_tool_executor
        )
        
        print(json.dumps(result, indent=2))
    
    # Run test
    # asyncio.run(test())

