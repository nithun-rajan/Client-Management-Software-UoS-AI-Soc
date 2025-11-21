"""
MCP Host - Connects OpenAI LLM to MCP Server Tools

This is the "MCP Client" layer that:
1. Receives natural language from users
2. Uses OpenAI to decide which tools to call
3. Invokes tools on the MCP Server (FastMCP tools)
4. Returns formatted responses

Architecture:
  Frontend → HTTP → MCP Host (this file) → MCP Server (FastMCP tools) → FastAPI backend
"""

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.sse import sse_client
from openai import AsyncOpenAI
import os
import json
from typing import List, Dict, Any, Optional
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "")
)

# ============================================================================
# SYSTEM PROMPT FOR CRM ASSISTANT
# ============================================================================

SYSTEM_PROMPT = """You are an intelligent AI assistant built into a Client Management Software (CRM) for UK estate agents.

**Your Role:**
Help estate agents manage their business efficiently by providing instant access to data and insights.

**Your Personality:**
- Professional but friendly (like a helpful colleague)
- Concise - estate agents are busy
- Data-driven - back up suggestions with numbers
- Use UK English (lettings not rentals, flat not apartment)

**Formatting Guidelines:**
- Use £ symbol for money (e.g., £1,200 not 1200)
- Format addresses clearly
- Use emojis sparingly but effectively (🏠 💰 📊)
- Limit lists to top 5-10 unless asked for more
- Highlight key insights in bold

**When You Don't Know:**
- Always use available tools to fetch real data
- Never make up information
- If no results, say so honestly and suggest alternatives

Remember: You make estate agents' lives easier through natural conversation!"""

# ============================================================================
# CONVERSATION MANAGEMENT
# ============================================================================

class Conversation:
    """Manages conversation history for context"""
    
    def __init__(self, conversation_id: str):
        self.id = conversation_id
        self.messages: List[Dict[str, Any]] = []
        self.system_prompt = SYSTEM_PROMPT
    
    def add_message(self, role: str, content: str):
        """Add a message to history"""
        self.messages.append({
            "role": role,
            "content": content
        })
    
    def add_tool_result(self, tool_call_id: str, tool_name: str, result: str):
        """Add tool result to history"""
        self.messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": tool_name,
            "content": result
        })
    
    def get_messages_for_api(self) -> List[Dict[str, Any]]:
        """Get messages formatted for OpenAI"""
        return [
            {"role": "system", "content": self.system_prompt},
            *self.messages
        ]
    
    def clear(self):
        """Clear conversation history"""
        self.messages = []

# Store conversations
conversations: Dict[str, Conversation] = {}

def get_conversation(conversation_id: str) -> Conversation:
    """Get or create a conversation"""
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation(conversation_id)
    return conversations[conversation_id]

# ============================================================================
# MCP CLIENT CONNECTION
# ============================================================================

class MCPClient:
    """
    Manages connection to MCP Server and tool invocation using proper MCP protocol
    """
    
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.available_tools: List[Dict[str, Any]] = []
        self.tool_functions: Dict[str, Any] = {}
        self.tool_modules: Dict[str, Any] = {}
        self.read_stream = None
        self.write_stream = None
        self._connected = False
        self._stdio_context = None
        self._session_context = None
    
    async def connect(self):
        """Connect to MCP tools directly (Python-to-Python)"""
        if self._connected:
            return
            
        print("📡 Connecting to MCP tools...")
        
        # Import tool modules directly (Python-to-Python, no stdio needed)
        from tools import property_tools, kpi_tools, landlord_tools, applicant_tools
        
        # Store references to FastMCP instances
        self.tool_modules = {
            'property': property_tools.mcp,
            'kpi': kpi_tools.mcp,
            'landlord': landlord_tools.mcp,
            'applicant': applicant_tools.mcp
        }
        
        # Discover tools
        await self._discover_tools()
        
        self._connected = True
        print(f"✅ Connected! Found {len(self.available_tools)} tools")
    
    async def disconnect(self):
        """Cleanup and disconnect from MCP Server"""
        if not self._connected:
            return
        
        print("🔌 Disconnecting from MCP Server...")
        
        # Clean up session
        if self._session_context:
            try:
                await self._session_context.__aexit__(None, None, None)
            except:
                pass
        
        # Clean up stdio
        if self._stdio_context:
            try:
                await self._stdio_context.__aexit__(None, None, None)
            except:
                pass
        
        self._connected = False
        print("✅ Disconnected")
    
    async def _discover_tools(self):
        """Discover all available tools from FastMCP instances"""
        self.available_tools = []
        self.tool_functions = {}
        
        for module_name, mcp_instance in self.tool_modules.items():
            try:
                # Get tools using FastMCP's get_tools() method (it's async!)
                tools_dict = await mcp_instance.get_tools()
                
                for tool_name, tool_data in tools_dict.items():
                    # tool_data is a FunctionTool object with .fn, .description, .parameters
                    tool_func = tool_data.fn
                    description = tool_data.description or tool_name
                    
                    # Get first line of description
                    if description:
                        description = description.strip().split('\n')[0]
                    
                    # Use FastMCP's parameters (already in JSON Schema format!)
                    parameters = tool_data.parameters.get('properties', {})
                    required = tool_data.parameters.get('required', [])
                    
                    # Store tool info
                    self.available_tools.append({
                        "name": tool_name,
                        "description": description,
                        "parameters": parameters,
                        "required": required,
                        "module": module_name
                    })
                    
                    # Store function reference
                    self.tool_functions[tool_name] = tool_func
                
                print(f"✅ Loaded {len(tools_dict)} tools from {module_name}: {list(tools_dict.keys())}")
                
            except Exception as e:
                import traceback
                print(f"⚠️ Error loading tools from {module_name}: {e}")
                print(traceback.format_exc())
        
        print(f"✅ Total tools loaded: {len(self.available_tools)}")
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call a tool directly using function reference
        """
        print(f"🔧 Calling tool: {tool_name} with {arguments}")
        
        # Get the tool function
        if tool_name not in self.tool_functions:
            raise Exception(f"Tool '{tool_name}' not found")
        
        tool_func = self.tool_functions[tool_name]
        
        # Call the function
        try:
            result = await tool_func(**arguments)
            return result
        except Exception as e:
            raise Exception(f"Tool execution failed: {str(e)}")
    
    def format_tools_for_openai(self) -> List[Dict[str, Any]]:
        """Format tools for OpenAI function calling"""
        formatted = []
        
        for tool in self.available_tools:
            formatted.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": {
                        "type": "object",
                        "properties": tool["parameters"],
                        "required": tool["required"]
                    }
                }
            })
        
        return formatted

# Global MCP client instance
mcp_client = MCPClient()

# ============================================================================
# MAIN CHAT FUNCTION
# ============================================================================

async def chat(
    message: str,
    conversation_id: str = "default",
    model: str = "gpt-4o-mini"
) -> Dict[str, Any]:
    """
    Main chat function that:
    1. Receives user message
    2. Sends to OpenAI with available tools
    3. If OpenAI wants to call tools, invoke them via MCP
    4. Return formatted response
    """
    
    # Ensure MCP client is connected
    if not mcp_client.available_tools:
        await mcp_client.connect()
    
    # Get conversation
    conversation = get_conversation(conversation_id)
    
    # Add user message
    conversation.add_message("user", message)
    
    # Get tools in OpenAI format
    tools = mcp_client.format_tools_for_openai()
    
    try:
        # Call OpenAI
        response = await openai_client.chat.completions.create(
            model=model,
            messages=conversation.get_messages_for_api(),
            tools=tools,
            tool_choice="auto",
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason
        
        # Check if AI wants to call tools
        if finish_reason == "tool_calls" and assistant_message.tool_calls:
            # IMPORTANT: Add assistant message with tool_calls FIRST
            # OpenAI requires this before any tool result messages
            conversation.messages.append({
                "role": "assistant",
                "content": assistant_message.content or None,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]
            })
            
            tool_calls_info = []
            tool_results_info = []
            
            # Execute each tool call
            for tool_call in assistant_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                print(f"🤖 OpenAI wants to call: {tool_name}({tool_args})")
                
                try:
                    # Call tool via MCP
                    result = await mcp_client.call_tool(tool_name, tool_args)
                    
                    # Convert result to string for OpenAI
                    result_str = json.dumps(result) if not isinstance(result, str) else result
                    
                    tool_calls_info.append({
                        "id": tool_call.id,
                        "name": tool_name,
                        "arguments": tool_args,
                        "status": "success"
                    })
                    
                    tool_results_info.append({
                        "toolCallId": tool_call.id,
                        "toolName": tool_name,
                        "result": result
                    })
                    
                    # Add tool result to conversation (AFTER assistant message)
                    conversation.add_tool_result(tool_call.id, tool_name, result_str)
                    
                except Exception as e:
                    error_msg = f"Error: {str(e)}"
                    print(f"❌ Tool call failed: {error_msg}")
                    
                    tool_calls_info.append({
                        "id": tool_call.id,
                        "name": tool_name,
                        "arguments": tool_args,
                        "status": "error"
                    })
                    
                    tool_results_info.append({
                        "toolCallId": tool_call.id,
                        "toolName": tool_name,
                        "error": str(e)
                    })
                    
                    conversation.add_tool_result(tool_call.id, tool_name, error_msg)
            
            # Get final response from OpenAI with tool results
            
            final_response = await openai_client.chat.completions.create(
                model=model,
                messages=conversation.get_messages_for_api(),
                temperature=0.7
            )
            
            final_message = final_response.choices[0].message
            conversation.add_message("assistant", final_message.content)
            
            return {
                "content": final_message.content,
                "toolCalls": tool_calls_info,
                "toolResults": tool_results_info,
                "model": model,
                "tokensUsed": response.usage.total_tokens + final_response.usage.total_tokens
            }
        
        else:
            # No tool calls, just return response
            conversation.add_message("assistant", assistant_message.content)
            
            return {
                "content": assistant_message.content,
                "model": model,
                "tokensUsed": response.usage.total_tokens
            }
    
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise Exception(f"Failed to process message: {str(e)}")

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

async def list_available_tools() -> List[Dict[str, Any]]:
    """Get list of available tools"""
    if not mcp_client.available_tools:
        await mcp_client.connect()
    return mcp_client.available_tools

def clear_conversation(conversation_id: str):
    """Clear a conversation's history"""
    if conversation_id in conversations:
        conversations[conversation_id].clear()

# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    async def test():
        print("🧪 Testing MCP Host...")
        
        result = await chat(
            message="Show me available properties in Southampton",
            conversation_id="test_123"
        )
        
        print(json.dumps(result, indent=2))
    
    asyncio.run(test())

