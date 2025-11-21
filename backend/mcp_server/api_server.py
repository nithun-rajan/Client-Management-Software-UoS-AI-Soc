"""
HTTP API Server for MCP Host

This exposes the MCP Host (OpenAI + MCP tools) via HTTP REST API
so the frontend can communicate with it.

Endpoints:
- POST /api/chat - Send a message and get AI response
- GET /api/tools - List available tools
- GET /api/health - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn

from mcp_host import chat, list_available_tools, clear_conversation

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="CRM MCP API",
    description="AI Assistant API for Client Management Software",
    version="1.0.0"
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    conversationId: Optional[str] = "default"
    systemPrompt: Optional[str] = None
    tools: Optional[List[str]] = None  # Limit to specific tools (future)

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    messageId: str
    content: str
    toolCalls: Optional[List[Dict[str, Any]]] = None
    toolResults: Optional[List[Dict[str, Any]]] = None
    conversationId: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ToolInfo(BaseModel):
    """Information about a tool"""
    name: str
    description: str
    parameters: Dict[str, Any]
    category: Optional[str] = None

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CRM MCP API",
        "version": "1.0.0"
    }

@app.get("/api/tools")
async def get_tools() -> Dict[str, Any]:
    """
    List all available tools that the AI can use
    """
    try:
        tools = await list_available_tools()
        
        # Group tools by category
        categorized = {
            "property": [],
            "kpi": [],
            "landlord": [],
            "applicant": []
        }
        
        for tool in tools:
            category = tool.get("module", "other")
            categorized.get(category, []).append({
                "name": tool["name"],
                "description": tool["description"],
                "parameters": list(tool["parameters"].keys())
            })
        
        return {
            "tools": tools,
            "categories": categorized,
            "total": len(tools)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tools: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Main chat endpoint - send a message and get AI response
    
    The AI will:
    1. Understand your natural language message
    2. Decide which tools to call (if any)
    3. Execute those tools
    4. Format a nice response
    """
    try:
        # Call MCP Host
        result = await chat(
            message=request.message,
            conversation_id=request.conversationId
        )
        
        # Format response
        return ChatResponse(
            messageId=f"msg_{request.conversationId}_{len(result.get('content', ''))}",
            content=result["content"],
            toolCalls=result.get("toolCalls"),
            toolResults=result.get("toolResults"),
            conversationId=request.conversationId,
            metadata={
                "model": result.get("model"),
                "tokensUsed": result.get("tokensUsed"),
                "responseTime": 0  # TODO: Add timing
            }
        )
    
    except Exception as e:
        # Return error in response
        return ChatResponse(
            messageId=f"error_{request.conversationId}",
            content=f"Sorry, I encountered an error: {str(e)}",
            conversationId=request.conversationId,
            error=str(e)
        )

@app.delete("/api/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Clear a conversation's history"""
    clear_conversation(conversation_id)
    return {"success": True, "message": f"Conversation {conversation_id} cleared"}

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "CRM MCP API",
        "version": "1.0.0",
        "description": "AI Assistant for Client Management Software",
        "endpoints": {
            "chat": "POST /api/chat",
            "tools": "GET /api/tools",
            "health": "GET /api/health"
        },
        "docs": "/docs"
    }

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import os
    
    port = int(os.getenv("MCP_SERVER_PORT", "8001"))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║       🤖 CRM AI Assistant API Server                     ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Status: Starting...                                     ║
    ║  Port: {port}                                            ║
    ║  Docs: http://localhost:{port}/docs                      ║
    ║                                                          ║
    ║  Endpoints:                                              ║
    ║   • POST /api/chat - Send messages to AI                 ║
    ║   • GET  /api/tools - List available tools               ║
    ║   • GET  /api/health - Health check                      ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

