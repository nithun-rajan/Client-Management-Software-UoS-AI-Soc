# 📚 API Reference Guide

Complete API documentation for the Estate Agent CRM backend.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Core Endpoints](#core-endpoints)
  - [Properties](#properties)
  - [Landlords](#landlords)
  - [Applicants](#applicants)
  - [Search](#search)
  - [KPIs](#kpis)
  - [Events](#events)
- [System Endpoints](#system-endpoints)
- [Response Formats](#response-formats)
- [Best Practices](#best-practices)

---

## Overview

The Estate Agent CRM API is a RESTful API built with FastAPI. It provides:

- **JSON-based** request and response formats
- **Type-safe** validation with Pydantic
- **Interactive documentation** at `/docs` (Swagger UI)
- **OpenAPI 3.0** specification at `/openapi.json`
- **Rate limiting** for security and stability
- **Structured error responses** with clear messages

---

## Base URL

### Development
```
http://localhost:8000
```

### Production
```
https://your-domain.railway.app
```

All endpoints are prefixed with `/api/v1` unless otherwise noted.

---

## Authentication

**Current Status**: No authentication required (development mode)

**Future Implementation**: JWT-based authentication
```http
Authorization: Bearer <token>
```

To prepare for authentication:
1. All endpoints will require JWT token in `Authorization` header
2. Token refresh mechanism will be available at `/api/v1/auth/refresh`
3. Token expiry: 1 hour (configurable)
4. Refresh token expiry: 30 days

---

## Rate Limiting

### Default Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|--------|
| General API | 100 requests | 1 minute |
| Health Check | 60 requests | 1 minute |
| CSRF Token | 10 requests | 1 minute |
| Error Budget | 60 requests | 1 minute |
| Trace (dev only) | 20 requests | 1 minute |

### Rate Limit Headers

Response headers on every request:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699024800
```

### Rate Limit Exceeded

**Status Code**: `429 Too Many Requests`

**Response**:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 42
}
```

**Retry Strategy**:
- Wait for `retry_after` seconds
- Implement exponential backoff for repeated violations
- Maximum 5 retries recommended

---

## Error Handling

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-11-03T12:34:56.789Z",
  "path": "/api/v1/properties",
  "request_id": "req_abc123"
}
```

### HTTP Status Codes

| Status Code | Meaning | When It Occurs |
|-------------|---------|----------------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST |
| `204` | No Content | Successful DELETE (no body) |
| `400` | Bad Request | Invalid input, validation errors |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions, CSRF failure |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists |
| `422` | Unprocessable Entity | Validation error with details |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | Server overloaded or maintenance |

### Validation Errors

**Status Code**: `422 Unprocessable Entity`

**Response**:
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "address"],
      "msg": "Field required",
      "input": {}
    },
    {
      "type": "string_too_short",
      "loc": ["body", "postcode"],
      "msg": "String should have at least 5 characters",
      "input": "SW1"
    }
  ]
}
```

---

## Core Endpoints

### Properties

#### List Properties

```http
GET /api/v1/properties
```

**Query Parameters:**
- `skip` (integer, default: 0) - Number of records to skip
- `limit` (integer, default: 100, max: 1000) - Number of records to return

**Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "address": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "bedrooms": 3,
    "bathrooms": 2,
    "rent_pcm": 2500.00,
    "property_type": "flat",
    "status": "available",
    "available_from": "2025-12-01",
    "description": "Beautiful 3-bedroom flat in central London",
    "landlord_id": 1,
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-01T10:00:00Z"
  }
]
```

#### Get Property by ID

```http
GET /api/v1/properties/{id}
```

**Path Parameters:**
- `id` (integer, required) - Property ID

**Response** (`200 OK`):
```json
{
  "id": 1,
  "address": "123 High Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "bedrooms": 3,
  "bathrooms": 2,
  "rent_pcm": 2500.00,
  "property_type": "flat",
  "status": "available",
  "available_from": "2025-12-01",
  "description": "Beautiful 3-bedroom flat in central London",
  "landlord_id": 1,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-01T10:00:00Z"
}
```

**Error** (`404 Not Found`):
```json
{
  "detail": "Property not found"
}
```

#### Create Property

```http
POST /api/v1/properties
Content-Type: application/json
X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "address": "123 High Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "bedrooms": 3,
  "bathrooms": 2,
  "rent_pcm": 2500.00,
  "property_type": "flat",
  "status": "available",
  "available_from": "2025-12-01",
  "description": "Beautiful 3-bedroom flat in central London",
  "landlord_id": 1
}
```

**Response** (`201 Created`):
```json
{
  "id": 1,
  "address": "123 High Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "bedrooms": 3,
  "bathrooms": 2,
  "rent_pcm": 2500.00,
  "property_type": "flat",
  "status": "available",
  "available_from": "2025-12-01",
  "description": "Beautiful 3-bedroom flat in central London",
  "landlord_id": 1,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-01T10:00:00Z"
}
```

**Validation Rules:**
- `address`: Required, 1-200 characters
- `city`: Required, 1-100 characters
- `postcode`: Required, 5-10 characters
- `bedrooms`: Required, 0-20
- `bathrooms`: Required, 0-10
- `rent_pcm`: Required, > 0
- `property_type`: Required, one of: `flat`, `house`, `bungalow`, `studio`
- `status`: Required, one of: `available`, `under_offer`, `let`, `withdrawn`
- `available_from`: Optional, ISO 8601 date
- `description`: Optional, max 2000 characters
- `landlord_id`: Required, must reference existing landlord

#### Update Property

```http
PUT /api/v1/properties/{id}
Content-Type: application/json
X-CSRF-Token: <token>
```

**Path Parameters:**
- `id` (integer, required) - Property ID

**Request Body:**
```json
{
  "rent_pcm": 2600.00,
  "status": "under_offer",
  "description": "Beautiful 3-bedroom flat in central London - Under Offer"
}
```

**Response** (`200 OK`):
```json
{
  "id": 1,
  "address": "123 High Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "bedrooms": 3,
  "bathrooms": 2,
  "rent_pcm": 2600.00,
  "property_type": "flat",
  "status": "under_offer",
  "available_from": "2025-12-01",
  "description": "Beautiful 3-bedroom flat in central London - Under Offer",
  "landlord_id": 1,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-03T14:30:00Z"
}
```

#### Delete Property

```http
DELETE /api/v1/properties/{id}
X-CSRF-Token: <token>
```

**Path Parameters:**
- `id` (integer, required) - Property ID

**Response** (`204 No Content`):
No response body

**Error** (`404 Not Found`):
```json
{
  "detail": "Property not found"
}
```

---

### Landlords

#### List Landlords

```http
GET /api/v1/landlords
```

**Query Parameters:**
- `skip` (integer, default: 0)
- `limit` (integer, default: 100, max: 1000)

**Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "title": "Mr",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "phone": "+447700900000",
    "address": "456 Oak Lane",
    "city": "Manchester",
    "postcode": "M1 1AA",
    "aml_verified": true,
    "aml_verification_date": "2025-10-15",
    "bank_name": "HSBC",
    "account_number": "****5678",
    "sort_code": "40-20-10",
    "tax_reference": "1234567890",
    "created_at": "2025-10-01T09:00:00Z",
    "updated_at": "2025-10-01T09:00:00Z"
  }
]
```

#### Create Landlord

```http
POST /api/v1/landlords
Content-Type: application/json
X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "title": "Mr",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "phone": "+447700900000",
  "address": "456 Oak Lane",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "aml_verified": false,
  "bank_name": "HSBC",
  "account_number": "12345678",
  "sort_code": "40-20-10",
  "tax_reference": "1234567890"
}
```

**Response** (`201 Created`):
```json
{
  "id": 1,
  "title": "Mr",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "phone": "+447700900000",
  "address": "456 Oak Lane",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "aml_verified": false,
  "aml_verification_date": null,
  "bank_name": "HSBC",
  "account_number": "****5678",
  "sort_code": "40-20-10",
  "tax_reference": "1234567890",
  "created_at": "2025-11-03T10:00:00Z",
  "updated_at": "2025-11-03T10:00:00Z"
}
```

**Validation Rules:**
- `title`: Optional, one of: `Mr`, `Mrs`, `Miss`, `Ms`, `Dr`, `Prof`
- `first_name`: Required, 1-50 characters
- `last_name`: Required, 1-50 characters
- `email`: Required, valid email format
- `phone`: Required, valid UK phone number format
- `address`: Required, 1-200 characters
- `city`: Required, 1-100 characters
- `postcode`: Required, 5-10 characters
- `aml_verified`: Optional, boolean (default: false)
- `bank_name`: Required, 1-100 characters
- `account_number`: Required, 8 digits (masked in responses)
- `sort_code`: Required, format: XX-XX-XX
- `tax_reference`: Optional, 10 characters

---

### Applicants

#### List Applicants

```http
GET /api/v1/applicants
```

**Query Parameters:**
- `skip` (integer, default: 0)
- `limit` (integer, default: 100, max: 1000)

**Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "title": "Ms",
    "first_name": "Emma",
    "last_name": "Johnson",
    "email": "emma.johnson@example.com",
    "phone": "+447700900001",
    "current_address": "789 Elm Street",
    "current_city": "Birmingham",
    "current_postcode": "B1 1AA",
    "min_bedrooms": 2,
    "max_rent_pcm": 1500.00,
    "preferred_areas": ["Birmingham City Centre", "Jewellery Quarter"],
    "move_in_date": "2025-12-01",
    "employment_status": "employed",
    "annual_income": 35000.00,
    "references_checked": false,
    "right_to_rent_verified": false,
    "created_at": "2025-11-02T11:00:00Z",
    "updated_at": "2025-11-02T11:00:00Z"
  }
]
```

#### Create Applicant

```http
POST /api/v1/applicants
Content-Type: application/json
X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "title": "Ms",
  "first_name": "Emma",
  "last_name": "Johnson",
  "email": "emma.johnson@example.com",
  "phone": "+447700900001",
  "current_address": "789 Elm Street",
  "current_city": "Birmingham",
  "current_postcode": "B1 1AA",
  "min_bedrooms": 2,
  "max_rent_pcm": 1500.00,
  "preferred_areas": ["Birmingham City Centre", "Jewellery Quarter"],
  "move_in_date": "2025-12-01",
  "employment_status": "employed",
  "annual_income": 35000.00
}
```

**Response** (`201 Created`):
```json
{
  "id": 1,
  "title": "Ms",
  "first_name": "Emma",
  "last_name": "Johnson",
  "email": "emma.johnson@example.com",
  "phone": "+447700900001",
  "current_address": "789 Elm Street",
  "current_city": "Birmingham",
  "current_postcode": "B1 1AA",
  "min_bedrooms": 2,
  "max_rent_pcm": 1500.00,
  "preferred_areas": ["Birmingham City Centre", "Jewellery Quarter"],
  "move_in_date": "2025-12-01",
  "employment_status": "employed",
  "annual_income": 35000.00,
  "references_checked": false,
  "right_to_rent_verified": false,
  "created_at": "2025-11-02T11:00:00Z",
  "updated_at": "2025-11-02T11:00:00Z"
}
```

**Validation Rules:**
- `employment_status`: One of: `employed`, `self_employed`, `student`, `unemployed`, `retired`
- `annual_income`: Required if employed/self-employed, > 0
- `preferred_areas`: Optional, array of strings (max 10)
- `move_in_date`: Optional, ISO 8601 date

---

### Search

#### Search Properties

```http
GET /api/v1/search/properties
```

**Query Parameters:**
- `min_bedrooms` (integer) - Minimum bedrooms
- `max_bedrooms` (integer) - Maximum bedrooms
- `min_rent` (number) - Minimum rent per month
- `max_rent` (number) - Maximum rent per month
- `property_type` (string) - Property type: `flat`, `house`, `bungalow`, `studio`
- `postcode` (string) - Postcode prefix (e.g., "SW1")
- `city` (string) - City name
- `status` (string) - Property status: `available`, `under_offer`, `let`, `withdrawn`
- `skip` (integer, default: 0) - Pagination offset
- `limit` (integer, default: 100, max: 1000) - Results per page

**Example Request:**
```http
GET /api/v1/search/properties?min_bedrooms=2&max_rent=2000&city=London&status=available
```

**Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "address": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "bedrooms": 3,
    "bathrooms": 2,
    "rent_pcm": 2500.00,
    "property_type": "flat",
    "status": "available",
    "available_from": "2025-12-01",
    "description": "Beautiful 3-bedroom flat",
    "landlord_id": 1
  }
]
```

#### Get Search Count

```http
GET /api/v1/search/count
```

**Query Parameters:** (Same as search)

**Response** (`200 OK`):
```json
{
  "count": 42,
  "filters": {
    "min_bedrooms": 2,
    "max_rent": 2000.00,
    "city": "London",
    "status": "available"
  }
}
```

---

### KPIs

#### Get Dashboard KPIs

```http
GET /api/v1/kpis/
```

**Response** (`200 OK`):
```json
{
  "timestamp": "2025-11-03T12:34:56.789Z",
  "properties": {
    "total": 150,
    "available": 45,
    "under_offer": 12,
    "let": 88,
    "withdrawn": 5,
    "average_rent": 1850.50,
    "by_type": {
      "flat": 90,
      "house": 45,
      "bungalow": 10,
      "studio": 5
    }
  },
  "landlords": {
    "total": 75,
    "aml_verified": 70,
    "pending_verification": 5,
    "properties_per_landlord": 2.0
  },
  "applicants": {
    "total": 230,
    "active": 180,
    "verified": 150,
    "average_budget": 1650.00
  },
  "recent_activity": [
    {
      "type": "property_created",
      "description": "New property added: 123 High Street",
      "timestamp": "2025-11-03T10:30:00Z"
    }
  ]
}
```

---

### Events

#### Log Event

```http
POST /api/v1/events/
Content-Type: application/json
X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "event_type": "property_viewed",
  "entity_type": "property",
  "entity_id": 1,
  "description": "Property viewed by applicant",
  "metadata": {
    "applicant_id": 5,
    "view_duration_seconds": 120
  }
}
```

**Response** (`201 Created`):
```json
{
  "id": 1,
  "event_type": "property_viewed",
  "entity_type": "property",
  "entity_id": 1,
  "description": "Property viewed by applicant",
  "metadata": {
    "applicant_id": 5,
    "view_duration_seconds": 120
  },
  "created_at": "2025-11-03T12:34:56.789Z"
}
```

#### List Events

```http
GET /api/v1/events/
```

**Query Parameters:**
- `event_type` (string) - Filter by event type
- `entity_type` (string) - Filter by entity type
- `entity_id` (integer) - Filter by entity ID
- `skip` (integer, default: 0)
- `limit` (integer, default: 100, max: 1000)

**Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "event_type": "property_viewed",
    "entity_type": "property",
    "entity_id": 1,
    "description": "Property viewed by applicant",
    "metadata": {
      "applicant_id": 5,
      "view_duration_seconds": 120
    },
    "created_at": "2025-11-03T12:34:56.789Z"
  }
]
```

---

## System Endpoints

### Health Check

```http
GET /health
```

**Query Parameters:**
- `detailed` (boolean, default: false) - Include detailed metrics

**Response** (`200 OK`):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T12:34:56.789Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime_seconds": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 2.5,
      "pool_size": 5,
      "pool_available": 3
    },
    "memory": {
      "status": "healthy",
      "used_mb": 256,
      "available_mb": 768,
      "percent": 25.0
    },
    "disk": {
      "status": "healthy",
      "used_gb": 10.5,
      "available_gb": 49.5,
      "percent": 17.5
    }
  }
}
```

### Metrics

```http
GET /metrics
```

**Response** (`200 OK`):
```
# Prometheus metrics in text format
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/properties",status="200"} 1234
...
```

### Error Budget

```http
GET /error-budget
```

**Response** (`200 OK`):
```json
{
  "timestamp": "2025-11-03T12:34:56.789Z",
  "overall_status": "healthy",
  "slos": [
    {
      "name": "API Availability",
      "type": "availability",
      "target": "99.90%",
      "actual": "99.95%",
      "status": "healthy",
      "budget": {
        "total": "0.100%",
        "consumed": "0.050%",
        "remaining": "0.050%",
        "remaining_pct": "50.0%"
      },
      "burn_rate": {
        "current": 0.5,
        "level": "safe",
        "time_to_exhaustion": "N/A (budget healthy)"
      },
      "window": {
        "days": 30,
        "start": "2025-10-04T12:34:56.789Z",
        "end": "2025-11-03T12:34:56.789Z"
      }
    }
  ]
}
```

### CSRF Token

```http
GET /csrf-token
```

**Response** (`200 OK`):
```json
{
  "csrf_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Cookie Set:**
```http
Set-Cookie: csrf_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

### Request Tracing (Dev Only)

```http
GET /trace
```

**Response** (`200 OK`):
```json
{
  "enabled": true,
  "request_id": "req_abc123xyz789",
  "timestamp": "2025-11-03T12:34:56.789Z",
  "method": "GET",
  "path": "/trace",
  "headers": {
    "user-agent": "curl/8.0.0",
    "accept": "*/*"
  },
  "context": {
    "environment": "development",
    "version": "1.0.0"
  }
}
```

---

## Response Formats

### Success Response

```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "created_at": "2025-11-03T12:34:56.789Z",
  "updated_at": "2025-11-03T12:34:56.789Z"
}
```

### List Response

```json
[
  {
    "id": 1,
    "field1": "value1"
  },
  {
    "id": 2,
    "field1": "value2"
  }
]
```

### Error Response

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-11-03T12:34:56.789Z",
  "path": "/api/v1/endpoint",
  "request_id": "req_abc123"
}
```

### Validation Error Response

```json
{
  "detail": [
    {
      "type": "validation_error_type",
      "loc": ["body", "field_name"],
      "msg": "Error message",
      "input": "invalid_value"
    }
  ]
}
```

---

## Best Practices

### 1. Always Include CSRF Token

For state-changing requests (POST, PUT, DELETE):

```bash
# Get token
TOKEN=$(curl -s http://localhost:8000/csrf-token | jq -r '.csrf_token')

# Use in request
curl -X POST http://localhost:8000/api/v1/properties \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "..."}'
```

### 2. Handle Rate Limits

```python
import time
import requests

def make_request_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url)

        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"Rate limited. Waiting {retry_after}s...")
            time.sleep(retry_after)
            continue

        return response

    raise Exception("Max retries exceeded")
```

### 3. Validate Input Client-Side

Before sending requests, validate:
- Required fields are present
- Field formats are correct (email, phone, postcode)
- Numeric ranges are valid
- Enum values match allowed options

### 4. Handle Errors Gracefully

```python
try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 422:
        # Validation error
        errors = e.response.json()['detail']
        for error in errors:
            field = '.'.join(error['loc'])
            print(f"Validation error in {field}: {error['msg']}")
    elif e.response.status_code == 429:
        # Rate limit
        print("Rate limited. Please slow down.")
    else:
        # Other error
        print(f"HTTP {e.response.status_code}: {e.response.json()['detail']}")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
```

### 5. Use Pagination

For list endpoints, always paginate:

```python
def fetch_all_properties():
    all_properties = []
    skip = 0
    limit = 100

    while True:
        response = requests.get(
            f"{BASE_URL}/api/v1/properties",
            params={'skip': skip, 'limit': limit}
        )
        properties = response.json()

        if not properties:
            break

        all_properties.extend(properties)
        skip += limit

    return all_properties
```

### 6. Set Appropriate Timeouts

```python
import requests

# Set connection and read timeouts
response = requests.get(
    url,
    timeout=(5, 30)  # (connect_timeout, read_timeout)
)
```

### 7. Use Request IDs for Debugging

When reporting issues, include the `request_id` from error responses:

```bash
curl -v http://localhost:8000/api/v1/properties/999
# Response includes: "request_id": "req_abc123"
# Quote this ID when asking for support
```

### 8. Monitor Your Usage

Track your API usage:
- Log rate limit headers
- Monitor response times
- Track error rates
- Set up alerts for degraded performance

### 9. Keep Dependencies Updated

```bash
# Check for updates
pip list --outdated

# Update FastAPI client libraries
pip install --upgrade httpx requests
```

### 10. Use Environment-Specific Configurations

```python
import os

class Config:
    def __init__(self):
        self.api_base_url = os.getenv(
            'API_BASE_URL',
            'http://localhost:8000'
        )
        self.timeout = int(os.getenv('API_TIMEOUT', '30'))
        self.max_retries = int(os.getenv('API_MAX_RETRIES', '3'))

config = Config()
```

---

## Code Examples

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000"

# Get CSRF token
response = requests.get(f"{BASE_URL}/csrf-token")
csrf_token = response.json()['csrf_token']
cookies = response.cookies

# Create property
property_data = {
    "address": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "bedrooms": 3,
    "bathrooms": 2,
    "rent_pcm": 2500.00,
    "property_type": "flat",
    "status": "available",
    "landlord_id": 1
}

response = requests.post(
    f"{BASE_URL}/api/v1/properties",
    json=property_data,
    headers={"X-CSRF-Token": csrf_token},
    cookies=cookies
)

if response.status_code == 201:
    property = response.json()
    print(f"Created property with ID: {property['id']}")
else:
    print(f"Error: {response.json()['detail']}")
```

### JavaScript (fetch)

```javascript
const BASE_URL = 'http://localhost:8000';

// Get CSRF token
const tokenResponse = await fetch(`${BASE_URL}/csrf-token`, {
  credentials: 'include'
});
const { csrf_token } = await tokenResponse.json();

// Create property
const propertyData = {
  address: '123 High Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  bedrooms: 3,
  bathrooms: 2,
  rent_pcm: 2500.00,
  property_type: 'flat',
  status: 'available',
  landlord_id: 1
};

const response = await fetch(`${BASE_URL}/api/v1/properties`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
  },
  credentials: 'include',
  body: JSON.stringify(propertyData)
});

if (response.status === 201) {
  const property = await response.json();
  console.log(`Created property with ID: ${property.id}`);
} else {
  const error = await response.json();
  console.error(`Error: ${error.detail}`);
}
```

### curl

```bash
# Get CSRF token
TOKEN=$(curl -s -c cookies.txt http://localhost:8000/csrf-token | jq -r '.csrf_token')

# Create property
curl -X POST http://localhost:8000/api/v1/properties \
  -b cookies.txt \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "bedrooms": 3,
    "bathrooms": 2,
    "rent_pcm": 2500.00,
    "property_type": "flat",
    "status": "available",
    "landlord_id": 1
  }'
```

---

## Interactive Documentation

For a better developer experience, use the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
  - Try out API calls directly in the browser
  - See request/response schemas
  - Download OpenAPI specification

- **ReDoc**: http://localhost:8000/redoc
  - Clean, searchable documentation
  - Code samples in multiple languages
  - Detailed schema documentation

---

## Support

For API support:
- **GitHub Issues**: [github.com/your-org/client-management/issues](https://github.com/your-org/client-management/issues)
- **Email**: ali.marzooq13@outlook.com
- **Documentation**: See [README.md](../README.md) for additional guides

---

**Last Updated**: 2025-11-03
**API Version**: 1.0.0
**Team 67** | Hackathon 2025
