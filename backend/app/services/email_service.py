import httpx
import jinja2
from typing import Dict, Any
from app.core.config import settings

# Set up Jinja2 to find templates in the 'app/templates' folder
# (We will create this folder next)
template_loader = jinja2.FileSystemLoader(searchpath="app/templates")
template_env = jinja2.Environment(loader=template_loader)

async def send_templated_email(
    to_email: str,
    subject: str,
    template_name: str, # e.g., "offer_confirmation.html"
    context: Dict[str, Any]
):
    """
    Renders an HTML template and sends it via the SendGrid API.
    """
    setting = settings
    if not setting.SENDGRID_API_KEY or not setting.DEFAULT_FROM_EMAIL:
        print("ERROR: SENDGRID_API_KEY or DEFAULT_FROM_EMAIL is not set in .env. Cannot send email.")
        # Don't raise an error, just log it so the workflow can continue
        return

    try:
        # 1. Render the HTML from the template
        template = template_env.get_template(template_name)
        html_content = template.render(context)
        
        # 2. Build the SendGrid API payload
        sendgrid_url = "https://api.sendgrid.com/v3/mail/send"
        
        payload = {
            "personalizations": [{
                "to": [{"email": to_email}],
                "dynamic_template_data": context # Pass context to SendGrid
            }],
            "from": {"email": settings.DEFAULT_FROM_EMAIL, "name": "Your Agency Name"},
            "subject": subject,
            "content": [{"type": "text/html", "value": html_content}]
        }
        
        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # 3. Send the API request (using httpx, which is already in requirements.txt)
        async with httpx.AsyncClient() as client:
            response = await client.post(sendgrid_url, json=payload, headers=headers)
            
            if 200 <= response.status_code < 300:
                print(f"Successfully sent email '{subject}' to {to_email}")
            else:
                print(f"ERROR: Failed to send email via SendGrid. Status: {response.status_code}, Body: {response.text}")
                
    except jinja2.TemplateNotFound:
        print(f"ERROR: Email template not found: {template_name}")
    except Exception as e:
        print(f"ERROR: Failed to send email: {e}")