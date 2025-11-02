# Sales Pipeline API Documentation

## Overview

Complete Sales Pipeline API with Workflow Engine, State Management, Milestones, SLA Tracking, and Events System.

## Sales Pipeline States

The workflow follows: **New → Viewing → Offer → Exchange → Complete**

- **New**: Initial lead/inquiry
- **Viewing**: Viewing scheduled
- **Offer**: Formal offer made
- **Exchange**: Contracts exchanged
- **Complete**: Sale completed
- **Withdrawn**: Offer withdrawn

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (creates session)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Offers

- `POST /api/offers` - Create new offer
  ```json
  {
    "property_id": 1,
    "price": 250000,
    "terms": "Subject to survey",
    "state": "New",
    "applicant_name": "John Smith",
    "applicant_contact": "john@example.com",
    "notes": "First-time buyer"
  }
  ```

- `GET /api/offers` - List all offers

- `POST /api/offers/<id>/counter` - Create counter offer
  ```json
  {
    "price": 260000,
    "terms": "Revised offer"
  }
  ```

- `POST /api/offers/<id>/accept` - Accept offer (transitions to Exchange)

- `POST /api/offers/<id>/withdraw` - Withdraw offer
  ```json
  {
    "reason": "Buyer pulled out"
  }
  ```

- `POST /api/offers/<id>/transition` - Transition to any valid state
  ```json
  {
    "state": "Viewing",
    "notes": "Scheduled viewing for next week"
  }
  ```

### Milestones

- `POST /api/offers/<id>/milestones/searches` - Mark searches completed
- `POST /api/offers/<id>/milestones/contracts` - Mark contracts exchanged
- `POST /api/offers/<id>/milestones/funds` - Mark funds received
- `POST /api/offers/<id>/milestones/complete` - Mark offer as Complete

### SLA & Workflow

- `POST /api/offers/check-sla` - Manually check for overdue offers
- `GET /api/workflow/config` - Get workflow configuration

### Sales KPIs

- `GET /api/kpi/sales` - Get sales KPIs
  Returns:
  ```json
  {
    "conversion_rate": 45.5,
    "median_days_to_exchange": 12,
    "median_days_to_complete": 45,
    "total_offers": 10,
    "active_offers": 6,
    "exchanged_offers": 3,
    "completed_offers": 2,
    "withdrawn_offers": 1,
    "overdue_count": 1,
    "state_distribution": {
      "New": 2,
      "Offer": 3,
      "Exchange": 1,
      "Complete": 2,
      "Withdrawn": 1
    }
  }
  ```

## Workflow Engine

The workflow engine validates state transitions based on configured rules:

```json
{
  "states": ["New", "Viewing", "Offer", "Exchange", "Complete"],
  "transitions": [
    {"from": "New", "to": "Viewing", "action": "schedule_viewing"},
    {"from": "Viewing", "to": "Offer", "action": "create_offer"},
    {"from": "Offer", "to": "Exchange", "action": "accept_offer"},
    {"from": "Exchange", "to": "Complete", "action": "complete_sale"},
    {"from": "New", "to": "Offer", "action": "direct_offer"},
    {"from": "*", "to": "Withdrawn", "action": "withdraw"}
  ],
  "sla_days": {
    "New": 7,
    "Viewing": 14,
    "Offer": 10,
    "Exchange": 28
  }
}
```

## Events System

Events are automatically emitted on state changes:

- `offer.created` - New offer created
- `offer.countered` - Counter offer created
- `offer.accepted` - Offer accepted (moved to Exchange)
- `offer.withdrawn` - Offer withdrawn
- `offer.completed` - Offer completed
- `offer.sla_overdue` - SLA deadline passed
- `offer.milestone.searches_completed` - Searches milestone
- `offer.milestone.contracts_exchanged` - Contracts milestone
- `offer.milestone.funds_received` - Funds milestone

Events are stored in `offer_events` table and can trigger downstream AI/Comms workflows.

## SLA Tracking

Each offer has:
- `sla_deadline` - Calculated based on current state
- `sla_overdue` - Boolean flag (auto-updated)
- `sla_reminder_sent` - Tracks reminder status

SLA deadlines:
- **New**: 7 days to Viewing
- **Viewing**: 14 days to Offer
- **Offer**: 10 days to Exchange
- **Exchange**: 28 days to Complete

## Progression Milestones

Track key progression steps:
- `searches_completed` / `searches_completed_at`
- `contracts_exchanged` / `contracts_exchanged_at`
- `funds_received` / `funds_received_at`
- `completion_date`

## Postman Collection

Import `postman_collection.json` into Postman for easy API testing.

## Seed Data

Run `python3.13 seed_data.py` to create demo data:
- 3 sample properties
- 6 offers across different workflow states
- Sample events

Login with: `demo@example.com` / (any password)

## Example Workflow

1. Create offer: `POST /api/offers` (state: "New")
2. Schedule viewing: `POST /api/offers/<id>/transition` (state: "Viewing")
3. Create formal offer: `POST /api/offers/<id>/transition` (state: "Offer")
4. Accept offer: `POST /api/offers/<id>/accept` (state: "Exchange")
5. Mark milestones:
   - `POST /api/offers/<id>/milestones/searches`
   - `POST /api/offers/<id>/milestones/contracts`
   - `POST /api/offers/<id>/milestones/funds`
6. Complete: `POST /api/offers/<id>/milestones/complete` (state: "Complete")

## Notes

- All endpoints require authentication (except register/login)
- State transitions are validated by workflow engine
- SLA deadlines auto-calculate on state changes
- Events are emitted automatically and stored for audit
- Sales KPIs are calculated from real-time data

