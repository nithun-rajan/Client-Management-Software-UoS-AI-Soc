# Database Schema Documentation

## Overview

This document describes the finalized database schema for the Client Management Software CRM system, including Properties, Landlords, Tenants, Tenancies, and Maintenance Issues.

---

## 📋 Table of Contents

1. [Property Model](#property-model)
2. [Landlord Model](#landlord-model)
3. [Tenancy Model](#tenancy-model)
4. [MaintenanceIssue Model](#maintenanceissue-model)
5. [Relationships](#relationships)
6. [Key Fields Summary](#key-fields-summary)

---

## Property Model

**Table:** `properties`

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `address_line1` | String | Primary address line |
| `address_line2` | String | Secondary address line |
| `city` | String | City |
| `postcode` | String | Postcode (indexed) |
| `property_type` | String | flat, house, maisonette |
| `bedrooms` | Integer | Number of bedrooms |
| `bathrooms` | Integer | Number of bathrooms |
| `floor_area_sqft` | Float | Floor area in square feet |
| `furnished` | Boolean | Is property furnished |

### Financial Fields

| Field | Type | Description |
|-------|------|-------------|
| `asking_rent` | Float | Listed rent amount |
| `rent` | Float | Actual achieved rent |
| `deposit` | Float | Security deposit amount |

### Status & Dates

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | available, under_offer, let_agreed, tenanted, managed, etc. |
| `listed_date` | DateTime | When property was first listed |
| `let_agreed_date` | DateTime | When offer was accepted |
| `let_date` | DateTime | When tenancy started |
| `last_status_change` | DateTime | Last status change timestamp |

### Compliance Documents

| Field | Type | Description |
|-------|------|-------------|
| `epc_rating` | String | EPC rating (A-G) |
| `epc_date` | Date | **Date EPC was issued** |
| `epc_expiry` | Date | **Date EPC expires** |
| `gas_safety_date` | Date | **Date gas safety certificate was issued** |
| `gas_cert_expiry` | Date | **Date gas safety certificate expires** |
| `eicr_date` | Date | Date EICR was issued |
| `eicr_expiry` | Date | Date EICR expires |
| `hmolicence_date` | Date | Date HMO licence was issued |
| `hmolicence_expiry` | Date | Date HMO licence expires |

### Property Management

| Field | Type | Description |
|-------|------|-------------|
| `landlord_id` | String (FK) | **Link to landlord** |
| `managed_by` | String (FK) | **Property manager user_id** |
| `management_type` | String | fully_managed, let_only, rent_collection |

### Complaints Tracking

| Field | Type | Description |
|-------|------|-------------|
| `complaints_count` | Integer | **Total number of complaints** |
| `active_complaints_count` | Integer | **Currently open complaints** |
| `last_complaint_date` | DateTime | **Date of last complaint** |

### Engagement Tracking

| Field | Type | Description |
|-------|------|-------------|
| `viewing_count` | Integer | Number of viewings |
| `enquiry_count` | Integer | Number of enquiries |
| `offer_count` | Integer | Number of offers |

### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | Text | Property description |
| `features` | Text | JSON array of features |
| `council_tax_band` | String | Council tax band |
| `main_photo_url` | String | Main property photo |
| `photo_urls` | Text | JSON array of photo URLs |
| `virtual_tour_url` | String | Virtual tour URL |

### Relationships

- `landlord` → Landlord (many-to-one)
- `tenancies` → Tenancy (one-to-many)
- `maintenance_issues` → MaintenanceIssue (one-to-many)
- `communications` → Communication (one-to-many)

### Computed Properties

- `days_on_market` - Days since listed
- `price_achievement_rate` - Rent vs asking rent percentage
- `is_compliant` - Checks if all certificates are valid
- `expiring_documents` - List of documents expiring within 30 days
- `active_tenancy` - Current active tenancy
- `current_tenant_id` - ID of current tenant

---

## Landlord Model

**Table:** `landlords`

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `full_name` | String | Landlord full name (indexed) |
| `email` | String | Email address (indexed) |
| `phone` | String | Phone number |
| `address` | Text | Landlord address |

### Compliance Fields

| Field | Type | Description |
|-------|------|-------------|
| `aml_verified` | Boolean | AML verification status |
| `aml_verification_date` | Date | Date of AML verification |

### Banking Fields

| Field | Type | Description |
|-------|------|-------------|
| `bank_account_name` | String | Bank account name |
| `sort_code` | String | Sort code |
| `account_number` | String | Account number |

### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | Text | Internal notes |

### Relationships

- `properties` → Property (one-to-many)
- `maintenance_issues` → MaintenanceIssue (one-to-many)
- `communications` → Communication (one-to-many)

---

## Tenancy Model

**Table:** `tenancies`

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `start_date` | Date | Tenancy start date |
| `end_date` | Date | Tenancy end date |
| `rent_amount` | Float | Monthly rent amount |
| `deposit_amount` | Float | Security deposit amount |
| `status` | String | pending, active, expired, terminated, renewed |

### Tenant Information

| Field | Type | Description |
|-------|------|-------------|
| `applicant_id` | String (FK) | **Link to applicant record** |
| `tenant_id` | String | **Tenant ID (indexed)** |
| `tenant_name` | String | **Primary tenant name** |
| `tenant_email` | String | **Primary tenant email** |
| `tenant_phone` | String | **Primary tenant phone** |

### Property Management

| Field | Type | Description |
|-------|------|-------------|
| `property_id` | String (FK) | **Link to property** |
| `managed_by` | String (FK) | **Property manager user_id** |

### Progression Tracking

| Field | Type | Description |
|-------|------|-------------|
| `agreed_rent` | Float | Agreed rent amount |
| `tenancy_term` | String | Tenancy term (12 months, etc.) |
| `special_conditions` | Text | Special conditions |
| `holding_deposit_amount` | Float | Holding deposit amount |
| `holding_deposit_date` | Date | Holding deposit date |
| `holding_deposit_payment_method` | String | Payment method |
| `reference_status` | String | pending, pass, fail, pass_with_conditions |
| `right_to_rent_status` | String | Right to rent status |
| `right_to_rent_check_date` | Date | Right to rent check date |

### Move-in Tracking

| Field | Type | Description |
|-------|------|-------------|
| `move_in_monies_received` | Boolean | Move-in monies received |
| `security_deposit_registered` | Boolean | Deposit registered with scheme |
| `tenancy_agreement_sent` | Boolean | Tenancy agreement sent |
| `statutory_documents_sent` | Boolean | Statutory documents sent |

### Relationships

- `property` → Property (many-to-one)
- `applicant` → Applicant (many-to-one)
- `tasks` → Task (one-to-many)
- `maintenance_issues` → MaintenanceIssue (one-to-many)

---

## MaintenanceIssue Model

**Table:** `maintenance_issues`

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `title` | String | Issue title (indexed) |
| `description` | Text | Issue description |
| `issue_type` | String | repair, emergency, plumbing, electrical, etc. |
| `status` | String | reported, acknowledged, inspected, quoted, approved, in_progress, completed, closed, cancelled |
| `priority` | String | low, medium, high, urgent |

### Complaint Tracking

| Field | Type | Description |
|-------|------|-------------|
| `is_complaint` | Boolean | **Is this a complaint?** |
| `complaint_type` | String | **noise, neighbour, property_condition, maintenance, rent, deposit, other** |

### Reporting Information

| Field | Type | Description |
|-------|------|-------------|
| `reported_by` | String | **Tenant name or contact** |
| `reported_by_phone` | String | **Reporter phone** |
| `reported_by_email` | String | **Reporter email** |
| `reported_date` | DateTime | **Date reported** |
| `reported_via` | String | phone, email, portal, in_person |

### Relationships

| Field | Type | Description |
|-------|------|-------------|
| `property_id` | String (FK) | **Link to property (indexed)** |
| `tenancy_id` | String (FK) | **Link to tenancy (indexed)** |
| `landlord_id` | String (FK) | **Link to landlord (indexed)** |
| `managed_by` | String (FK) | **Property manager user_id** |
| `assigned_to` | String | **Contractor or staff member** |

### Dates & Timing

| Field | Type | Description |
|-------|------|-------------|
| `acknowledged_date` | DateTime | When issue was acknowledged |
| `inspection_date` | DateTime | When inspection was completed |
| `scheduled_date` | DateTime | When work is scheduled |
| `started_date` | DateTime | When work started |
| `completed_date` | DateTime | When work completed |
| `closed_date` | DateTime | When issue was closed |

### Financial Tracking

| Field | Type | Description |
|-------|------|-------------|
| `estimated_cost` | Float | Estimated cost |
| `actual_cost` | Float | Actual cost |
| `quote_received` | Boolean | Quote received |
| `quote_amount` | Float | Quote amount |
| `landlord_approved` | Boolean | Landlord approved work |
| `landlord_approval_date` | DateTime | Landlord approval date |

### Contractor Information

| Field | Type | Description |
|-------|------|-------------|
| `contractor_name` | String | Contractor name |
| `contractor_contact` | String | Contractor contact |
| `contractor_quote_ref` | String | Contractor quote reference |
| `contractor_invoice_ref` | String | Contractor invoice reference |

### Resolution

| Field | Type | Description |
|-------|------|-------------|
| `resolution_notes` | Text | Resolution notes |
| `tenant_satisfied` | Boolean | Tenant satisfied with resolution |
| `follow_up_required` | Boolean | Follow up required |
| `follow_up_date` | DateTime | Follow up date |

### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `photos_urls` | Text | JSON array of photo URLs |
| `documents_urls` | Text | JSON array of document URLs |
| `internal_notes` | Text | Internal notes (staff only) |
| `public_notes` | Text | Public notes (tenant/landlord visible) |
| `is_emergency` | Boolean | Is this an emergency? |
| `emergency_response_time` | DateTime | Emergency response time |
| `is_recurring` | Boolean | Is this a recurring issue? |
| `parent_issue_id` | String (FK) | Parent issue ID for recurring issues |
| `recurrence_count` | Integer | Number of times issue recurred |

### Compliance Flags

| Field | Type | Description |
|-------|------|-------------|
| `requires_epc_update` | Boolean | Requires EPC update |
| `requires_gas_safety_update` | Boolean | Requires gas safety update |
| `requires_eicr_update` | Boolean | Requires EICR update |

### Relationships

- `property` → Property (many-to-one)
- `tenancy` → Tenancy (many-to-one)
- `landlord` → Landlord (many-to-one)
- `related_tasks` → Task (one-to-many)

### Computed Properties

- `days_open` - Days since issue was reported
- `is_overdue` - Check if issue is overdue based on priority
- `requires_attention` - Check if issue requires immediate attention

---

## Relationships

### Property Relationships

```
Property
├── landlord_id → Landlord (many-to-one)
├── managed_by → User (many-to-one)
├── tenancies → Tenancy[] (one-to-many)
├── maintenance_issues → MaintenanceIssue[] (one-to-many)
└── communications → Communication[] (one-to-many)
```

### Tenancy Relationships

```
Tenancy
├── property_id → Property (many-to-one)
├── applicant_id → Applicant (many-to-one)
├── managed_by → User (many-to-one)
├── tasks → Task[] (one-to-many)
└── maintenance_issues → MaintenanceIssue[] (one-to-many)
```

### MaintenanceIssue Relationships

```
MaintenanceIssue
├── property_id → Property (many-to-one)
├── tenancy_id → Tenancy (many-to-one)
├── landlord_id → Landlord (many-to-one)
├── managed_by → User (many-to-one)
└── related_tasks → Task[] (one-to-many)
```

---

## Key Fields Summary

### Required Fields for Property Management

✅ **property_id** - Links maintenance to property  
✅ **landlord_id** - Links property/maintenance to landlord  
✅ **tenant_id** - Links tenancy to tenant (via applicant_id)  
✅ **managed_by** - Property manager user_id (Property & Tenancy)  
✅ **epc_date** - Date EPC was issued (Property)  
✅ **gas_safety_date** - Date gas safety cert was issued (Property)  
✅ **complaints** - Tracked via MaintenanceIssue.is_complaint and Property.complaints_count  

### Compliance Tracking

✅ **epc_date** + **epc_expiry** - EPC certificate tracking  
✅ **gas_safety_date** + **gas_cert_expiry** - Gas safety tracking  
✅ **eicr_date** + **eicr_expiry** - EICR tracking  
✅ **hmolicence_date** + **hmolicence_expiry** - HMO licence tracking  

### Maintenance & Complaints

✅ **MaintenanceIssue** model - Comprehensive maintenance tracking  
✅ **is_complaint** flag - Identify complaints  
✅ **complaint_type** - Categorize complaints  
✅ **Property.complaints_count** - Quick access to complaint count  
✅ **Property.active_complaints_count** - Active complaints tracking  

---

## Database Migration Notes

When applying these changes to the database:

1. **Add new columns** to existing tables (Property, Tenancy, Landlord)
2. **Create new table** for MaintenanceIssue
3. **Add foreign key constraints** for new relationships
4. **Create indexes** on frequently queried fields:
   - `properties.managed_by`
   - `properties.complaints_count`
   - `tenancies.tenant_id`
   - `tenancies.managed_by`
   - `maintenance_issues.property_id`
   - `maintenance_issues.tenancy_id`
   - `maintenance_issues.status`
   - `maintenance_issues.is_complaint`

---

## Example Queries

### Get property with all maintenance issues
```python
property = db.query(Property).filter(Property.id == property_id).first()
maintenance_issues = property.maintenance_issues
complaints = [issue for issue in maintenance_issues if issue.is_complaint]
```

### Get active tenancy with tenant info
```python
tenancy = db.query(Tenancy).filter(
    Tenancy.property_id == property_id,
    Tenancy.status == "active"
).first()
tenant_id = tenancy.tenant_id
tenant_name = tenancy.tenant_name
```

### Get all complaints for a property
```python
complaints = db.query(MaintenanceIssue).filter(
    MaintenanceIssue.property_id == property_id,
    MaintenanceIssue.is_complaint == True,
    MaintenanceIssue.status != "closed"
).all()
```

### Get properties managed by a user
```python
managed_properties = db.query(Property).filter(
    Property.managed_by == user_id
).all()
```

---

## Schema Version

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Finalized

