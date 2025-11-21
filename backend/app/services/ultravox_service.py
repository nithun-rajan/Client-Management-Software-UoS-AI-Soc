"""
Ultravox Service for AI-Powered Voice Calls

Handles integration with Ultravox API for AI voice agent calls via Twilio.
"""

import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.config import settings
from app.models.applicant import Applicant
from app.schemas.ai_call import ExtractedApplicantData


class UltravoxService:
    """
    Service for Ultravox AI voice call integration.
    
    Features:
    - Create AI-powered phone calls via Twilio
    - Fetch call status and transcripts
    - Extract structured data from conversations
    """
    
    # Prototype: Always call this number for testing
    PROTOTYPE_PHONE_NUMBER = "+447584628012"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ULTRAVOX_API_KEY
        if not self.api_key:
            raise ValueError("ULTRAVOX_API_KEY not configured")
        
        self.base_url = "https://api.ultravox.ai"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
    
    
    
    async def create_call(
        self, 
        applicant: Applicant, 
        user_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new AI voice call via Ultravox Agent + Twilio.
        
        Uses pre-configured Ultravox Agent instead of raw system prompt.
        
        Args:
            applicant: The applicant to call
            user_context: Optional additional context/instructions for the AI
            
        Returns:
            {
                "callId": "abc123",
                "status": "pending",
                "created": "2024-01-01T12:00:00Z"
            }
        """
        
        # Get agent ID from settings
        agent_id = settings.ULTRAVOX_AGENT_ID
        if not agent_id:
            raise ValueError("ULTRAVOX_AGENT_ID not configured")
        
        # Build template context for the agent
        # The agent already has the system prompt configured in Ultravox
        template_context = {
            "customerName": f"{applicant.first_name} {applicant.last_name}",
            "customerEmail": applicant.email,
            "customerPhone": applicant.phone,
        }
        
        # Add any additional context from the user
        if user_context:
            template_context["agentInstructions"] = user_context
        
        # Add any known applicant preferences
        if applicant.desired_bedrooms:
            template_context["desiredBedrooms"] = applicant.desired_bedrooms
        if applicant.rent_budget_min and applicant.rent_budget_max:
            template_context["budgetRange"] = f"£{applicant.rent_budget_min}-£{applicant.rent_budget_max}"
        if applicant.preferred_locations:
            template_context["preferredLocations"] = applicant.preferred_locations
        
        # Build the request payload for agent-based calls
        # This creates the Ultravox call and returns a joinUrl for Twilio to stream to
        payload = {
            # Override agent settings for this call
            "maxDuration": "600s",  # 10 minute maximum
            "recordingEnabled": True,  # Always record for compliance and quality
            "medium": {"twilio": {}},  # Tell Ultravox to expect Twilio streaming
            "firstSpeakerSettings": {"user": {}}  # For outgoing calls, user answers first
        }
        
        # Note: This agent doesn't use templateContext - it has a static prompt
        
        # Step 1: Create Ultravox call and get joinUrl
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/agents/{agent_id}/calls",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                ultravox_call = response.json()
                
                # Get the joinUrl for Twilio to stream to
                join_url = ultravox_call.get("joinUrl")
                if not join_url:
                    raise Exception("No joinUrl received from Ultravox")
                
                # Step 2: Use Twilio SDK to make the actual phone call
                from twilio.rest import Client as TwilioClient
                
                twilio_client = TwilioClient(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
                
                # TwiML that connects Twilio call to Ultravox via WebSocket streaming
                twiml = f'<Response><Connect><Stream url="{join_url}"/></Connect></Response>'
                
                # Make the phone call
                twilio_call = twilio_client.calls.create(
                    twiml=twiml,
                    to=self.PROTOTYPE_PHONE_NUMBER,  # Call this number
                    from_=settings.TWILIO_PHONE_NUMBER  # From your Twilio number
                )
                
                # Add Twilio call SID to the response
                ultravox_call["twilioCallSid"] = twilio_call.sid
                ultravox_call["calledNumber"] = self.PROTOTYPE_PHONE_NUMBER
                
                return ultravox_call
                
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                raise Exception(f"Ultravox API error: {e.response.status_code} - {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to create call: {str(e)}")
    
    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """
        Get the current status of a call.
        
        Args:
            call_id: Ultravox call ID
            
        Returns:
            {
                "callId": "abc123",
                "status": "completed",
                "ended": "2024-01-01T12:05:00Z",
                "durationSeconds": 300
            }
        """
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/calls/{call_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                raise Exception(f"Failed to get call status: {e.response.status_code} - {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to get call status: {str(e)}")
    
    async def get_call_stages(self, call_id: str) -> list[Dict[str, Any]]:
        """
        Get all stages for a call.
        
        Args:
            call_id: Ultravox call ID
            
        Returns:
            List of call stages
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/calls/{call_id}/stages",
                    headers=self.headers
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                raise Exception(f"Failed to get call stages: {e.response.status_code} - {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to get call stages: {str(e)}")
    
    async def get_call_messages(self, call_id: str) -> list[Dict[str, Any]]:
        """
        Get the full conversation transcript (messages) from a call.
        
        This fetches messages from all stages of the call.
        
        Args:
            call_id: Ultravox call ID
            
        Returns:
            List of messages with role (agent/user) and text content
        """
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # First, get all stages for this call
                stages = await self.get_call_stages(call_id)
                
                if not stages:
                    return []
                
                # Collect messages from all stages
                all_messages = []
                for stage in stages:
                    stage_id = stage.get("callStageId")
                    if not stage_id:
                        continue
                    
                    try:
                        response = await client.get(
                            f"{self.base_url}/api/calls/{call_id}/stages/{stage_id}/messages",
                            headers=self.headers
                        )
                        response.raise_for_status()
                        data = response.json()
                        messages = data.get("results", [])
                        all_messages.extend(messages)
                    except:
                        # Skip stages with no messages
                        continue
                
                return all_messages
                
            except Exception as e:
                raise Exception(f"Failed to get call messages: {str(e)}")
    
    async def get_call_recording(self, call_id: str) -> Optional[str]:
        """
        Get the recording URL for a completed call.
        
        The Ultravox /recording endpoint returns the actual recording file URL.
        
        Args:
            call_id: Ultravox call ID
            
        Returns:
            URL string or None if not available
        """
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/calls/{call_id}/recording",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    # The endpoint returns the recording file directly or a JSON with URL
                    # Return the final URL after any redirects
                    return str(response.url)
                else:
                    # Recording not available yet (404)
                    return None
                    
            except httpx.HTTPStatusError as e:
                # Recording might not be available yet (404 = not ready)
                if e.response.status_code == 404:
                    return None
                return None
            except Exception as e:
                # Any other error, just return None
                return None
    
    def format_transcript(self, messages: list[Dict[str, Any]]) -> str:
        """
        Format messages into a readable transcript.
        
        Args:
            messages: List of message objects from Ultravox
            
        Returns:
            Formatted transcript string
        """
        
        transcript_lines = []
        for msg in messages:
            role = msg.get("role", "unknown")
            text = msg.get("text", "")
            
            # Map roles to readable labels
            if role == "agent":
                speaker = "Agent"
            elif role == "user":
                speaker = "Applicant"
            else:
                speaker = role.capitalize()
            
            transcript_lines.append(f"{speaker}: {text}")
        
        return "\n\n".join(transcript_lines)
    
    async def extract_applicant_data(self, transcript: str) -> Dict[str, Any]:
        """
        Use OpenAI to extract structured data from the call transcript.
        
        Args:
            transcript: Full conversation transcript
            
        Returns:
            Dictionary with parsed applicant information
        """
        
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        extraction_prompt = f"""Analyze the following phone conversation transcript between a lettings agent and an applicant. Extract all relevant information into a structured format.

TRANSCRIPT:
{transcript}

Extract the following information (use null for any information not mentioned):
- full_name: Full name of the applicant
- confirmed_phone: Phone number (if confirmed)
- employment_status: Employment status (full_time, part_time, self_employed, unemployed, student, retired)
- monthly_income: Monthly household income as a number
- number_of_adults: Number of adults
- number_of_children: Number of children
- has_pets: Boolean - do they have pets?
- pet_type: Type of pet (dog, cat, other)
- pet_count: Number of pets
- pet_details: Any additional pet details
- budget_min: Minimum monthly rent budget as a number
- budget_max: Maximum monthly rent budget as a number
- preferred_locations: Array of preferred location names
- desired_bedrooms: Number of bedrooms needed (as string: "1", "2", "3+")
- desired_property_type: Type of property (flat, house, studio, etc.)
- move_in_date: Move in date (ISO format or description like "ASAP")
- parking_required: Boolean - do they need parking?
- outdoor_space_required: Boolean - do they need garden/balcony?
- accessibility_requirements: Any accessibility needs
- special_requirements: Any other special requirements
- additional_notes: Any other relevant information from the call

Respond ONLY with a valid JSON object. Do not include any explanation or markdown formatting."""

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are a data extraction assistant. Extract information from transcripts and return valid JSON only."},
                            {"role": "user", "content": extraction_prompt}
                        ],
                        "temperature": 0.1,  # Low temperature for consistent extraction
                        "response_format": {"type": "json_object"}
                    }
                )
                response.raise_for_status()
                
                result = response.json()
                extracted_text = result["choices"][0]["message"]["content"]
                extracted_json = json.loads(extracted_text)
                
                # Validate with Pydantic schema but return as dict
                validated = ExtractedApplicantData(**extracted_json)
                return validated.model_dump(exclude_none=True)
                
            except Exception as e:
                # If extraction fails, return empty data
                print(f"Failed to extract data: {str(e)}")
                return {}
    
    async def generate_call_summary(self, transcript: str) -> str:
        """
        Generate a concise summary of the call using OpenAI.
        
        Args:
            transcript: Full conversation transcript
            
        Returns:
            Summary string
        """
        
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        summary_prompt = f"""Summarize the following phone conversation between a lettings agent and a prospective tenant. Focus on the key information gathered and the applicant's requirements.

TRANSCRIPT:
{transcript}

Provide a concise 2-3 paragraph summary covering:
1. What the applicant is looking for (bedrooms, budget, location, timeline)
2. Their situation (employment, household composition, pets)
3. Any special requirements or notable points from the conversation

Keep it professional and factual."""

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are a professional assistant that creates concise summaries of client calls."},
                            {"role": "user", "content": summary_prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 300
                    }
                )
                response.raise_for_status()
                
                result = response.json()
                summary = result["choices"][0]["message"]["content"]
                return summary.strip()
                
            except Exception as e:
                print(f"Failed to generate summary: {str(e)}")
                return "Summary generation failed."

