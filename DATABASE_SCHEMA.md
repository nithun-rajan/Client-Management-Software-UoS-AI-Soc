# Database Schema Documentation

## Overview

This document describes the finalized database schema for the Client Management Software CRM system, including Properties (for both lettings and sales), Landlords, Tenants, Buyers, Vendors, Tenancies, Sales Progression, and Maintenance Issues.

The system supports both **Lettings** (rental properties) and **Sales** (property sales) workflows, with Applicants serving as a general blueprint that can be classified as Tenants (willing to rent) or Buyers (willing to buy).

---

## 📋 Table of Contents

1. [Property Model](#property-model)
2. [Landlord Model](#landlord-model)
3. [Applicant Model](#applicant-model)
4. [Vendor Model](#vendor-model)
5. [Tenancy Model](#tenancy-model)
6. [SalesProgression Model](#salesprogression-model)
7. [SalesOffer Model](#salesoffer-model)
8. [MaintenanceIssue Model](#maintenanceissue-model)
9. [Relationships](#relationships)
10. [Key Fields Summary](#key-fields-summary)

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

### Financial Fields (Lettings)

| Field | Type | Description |
|-------|------|-------------|
| `asking_rent` | Float | Listed rent amount |
| `rent` | Float | Actual achieved rent |
| `deposit` | Float | Security deposit amount |

### Financial Fields (Sales)

| Field | Type | Description |
|-------|------|-------------|
| `asking_price` | Numeric(12,2) | Asking price for sale |
| `price_qualifier` | String | Price qualifier (e.g., "POA", "Guide Price") |
| `sales_status` | String | available, under_offer, sstc, exchanged (indexed) |

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
- `sales_progression` → SalesProgression (one-to-one)
- `offers` → Offer (one-to-many, lettings offers)
- `sales_offers` → SalesOffer (one-to-many, sales offers)

### Computed Properties

- `days_on_market` - Days since listed
- `price_achievement_rate` - Rent vs asking rent percentage
- `is_compliant` - Checks if all certificates are valid
- `expiring_documents` - List of documents expiring within 30 days
- `active_tenancy` - Current active tenancy
- `current_tenant_id` - ID of current tenant

---

## Applicant Model

**Table:** `applicants`

The Applicant model serves as a general blueprint for people who interact with the system. Applicants can be classified as **Tenants** (willing to rent) or **Buyers** (willing to buy), or both.

### Core Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `first_name` | String | First name (required) |
| `last_name` | String | Last name (required) |
| `email` | String | Email address (required) |
| `phone` | String | Phone number (required) |
| `date_of_birth` | Date | Date of birth |

### Status & Classification

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | new, qualified, viewing_booked, offer_submitted, offer_accepted, references, let_agreed, tenancy_started, archived |
| `willing_to_rent` | Boolean | **Is this person willing to rent?** (default: True) |
| `willing_to_buy` | Boolean | **Is this person willing to buy?** (default: False) |

### Property Requirements

| Field | Type | Description |
|-------|------|-------------|
| `desired_bedrooms` | String | Desired number of bedrooms (e.g., "2-3") |
| `desired_property_type` | String | flat, house, maisonette |
| `rent_budget_min` | Float | Minimum budget (rent or purchase) |
| `rent_budget_max` | Float | Maximum budget (rent or purchase) |
| `preferred_locations` | Text | Preferred locations |
| `move_in_date` | Date | Desired move-in date |

### Additional Criteria

| Field | Type | Description |
|-------|------|-------------|
| `has_pets` | Boolean | Has pets (default: False) |
| `pet_details` | Text | Pet details |
| `special_requirements` | Text | Special requirements |

### Sales Buyer Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `buyer_type` | String | Type of buyer |
| `mortgage_status` | String | Mortgage application status (default: not_applied) |
| `has_property_to_sell` | Boolean | Has property to sell (default: False) |
| `is_chain_free` | Boolean | Is chain-free (default: False) |

### Relationships

- `tenancies` → Tenancy (one-to-many)
- `communications` → Communication (one-to-many)
- `letting_offers` → Offer (one-to-many, lettings offers)
- `sales_progression` → SalesProgression (one-to-many)
- `sales_offers` → SalesOffer (one-to-many, sales offers)

### Notes

- **Tenants**: Applicants with `willing_to_rent = True` (default)
- **Buyers**: Applicants with `willing_to_buy = True`
- An applicant can be both a tenant and a buyer if both flags are True
- The `rent_budget_min` and `rent_budget_max` fields are used for both rental and purchase budgets

---

## Vendor Model

**Table:** `vendors`

Vendors are property sellers who instruct the agency to sell their properties.

### Core Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `first_name` | String | First name (required) |
| `last_name` | String | Last name (required) |
| `email` | String | Email address (required) |
| `primary_phone` | String | Primary phone number (required) |
| `current_address` | Text | Current address |

### Compliance (AML/KYC)

| Field | Type | Description |
|-------|------|-------------|
| `date_of_birth` | Date | Date of birth |
| `nationality` | String | Nationality |
| `aml_status` | String | AML status (default: "pending") |
| `aml_verification_date` | DateTime | When AML was completed |
| `aml_verification_expiry` | DateTime | AML verification expiry date |
| `proof_of_ownership_uploaded` | Boolean | Land Registry title uploaded (default: False) |

### Sales Instruction

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | new, valuation_booked, instructed, active, sold, withdrawn, lost |
| `instruction_type` | String | sole_agency, multi_agency (default: sole_agency) |
| `instruction_date` | DateTime | Date instruction was signed |
| `agreed_commission` | Numeric(5,2) | Agreed commission percentage |
| `minimum_fee` | String | Minimum fee |
| `contract_expiry_date` | DateTime | Contract expiry date |

### Relationship Tracking

| Field | Type | Description |
|-------|------|-------------|
| `source_of_lead` | String | Portal, Referral, Board, Past Client, Walk In |
| `marketing_consent` | Boolean | GDPR marketing opt-in (default: False) |

### Conveyancer Information

| Field | Type | Description |
|-------|------|-------------|
| `conveyancer_name` | String | Solicitor/conveyancer name |
| `conveyancer_firm` | String | Law firm name |
| `conveyancer_contact` | String | Phone/email |

### Property Link

| Field | Type | Description |
|-------|------|-------------|
| `instructed_property_id` | String (FK) | Link to property being sold (indexed) |

### Relationships

- `instructed_property` → Property (many-to-one)
- `tasks` → Task (one-to-many)
- `communications` → Communication (one-to-many)

### Notes

- **Removed Fields**: `title` and `secondary_phone` have been removed from the model
- Vendors are linked to properties via `instructed_property_id`
- AML verification is tracked with expiry dates for automated reminders

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

## SalesProgression Model

**Table:** `sales_progression`

Tracks the progression of a property sale from offer acceptance through to completion.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `property_id` | String (FK) | Link to property (required, indexed) |
| `buyer_id` | String (FK) | Link to buyer (Applicant) |
| `current_stage` | String | Current sales stage |
| `sales_status` | String | available, under_offer, sstc, exchanged, completed |

### Stage Tracking

| Field | Type | Description |
|-------|------|-------------|
| `offer_accepted_date` | Date | Date offer was accepted |
| `sstc_date` | Date | Sold Subject To Contract date |
| `solicitor_instructed_date` | Date | When solicitor was instructed |
| `mortgage_applied_date` | Date | When mortgage was applied |
| `survey_ordered_date` | Date | When survey was ordered |
| `searches_ordered_date` | Date | When searches were ordered |
| `searches_received_date` | Date | When searches were received |
| `management_pack_received_date` | Date | When management pack was received |
| `ready_for_exchange_date` | Date | When ready for exchange |
| `exchanged_date` | Date | Exchange date |
| `completion_date` | Date | Completion date |

### Chain Information

| Field | Type | Description |
|-------|------|-------------|
| `is_chain_free` | Boolean | Is chain-free |
| `chain_length` | Integer | Length of chain |
| `chain_position` | Integer | Position in chain |

### Solicitor Details

| Field | Type | Description |
|-------|------|-------------|
| `buyer_solicitor_name` | String | Buyer's solicitor name |
| `buyer_solicitor_firm` | String | Buyer's solicitor firm |
| `buyer_solicitor_contact` | String | Buyer's solicitor contact |
| `vendor_solicitor_name` | String | Vendor's solicitor name |
| `vendor_solicitor_firm` | String | Vendor's solicitor firm |
| `vendor_solicitor_contact` | String | Vendor's solicitor contact |

### Mortgage Information

| Field | Type | Description |
|-------|------|-------------|
| `mortgage_lender` | String | Mortgage lender |
| `mortgage_application_ref` | String | Mortgage application reference |
| `mortgage_offer_received` | Boolean | Mortgage offer received |
| `mortgage_offer_date` | Date | Mortgage offer date |

### Survey Information

| Field | Type | Description |
|-------|------|-------------|
| `survey_type` | String | Type of survey |
| `survey_company` | String | Survey company |
| `survey_date` | Date | Survey date |
| `survey_results` | Text | Survey results |

### Documents Tracking

| Field | Type | Description |
|-------|------|-------------|
| `contract_sent` | Boolean | Contract sent |
| `contract_received` | Boolean | Contract received |
| `enquiries_raised` | Boolean | Enquiries raised |
| `enquiries_answered` | Boolean | Enquiries answered |

### Leasehold Information

| Field | Type | Description |
|-------|------|-------------|
| `is_leasehold` | Boolean | Is leasehold property |
| `lease_length_years` | Integer | Lease length in years |
| `ground_rent` | Numeric | Ground rent amount |
| `service_charge` | Numeric | Service charge amount |

### Checklist & KPIs

| Field | Type | Description |
|-------|------|-------------|
| `checklist_items` | Text | JSON array of checklist items |
| `days_to_exchange` | Integer | Days to exchange |
| `days_to_completion` | Integer | Days to completion |
| `target_exchange_date` | Date | Target exchange date |
| `target_completion_date` | Date | Target completion date |

### Relationships

- `property` → Property (many-to-one)
- `buyer` → Applicant (many-to-one)
- `offers` → SalesOffer (one-to-many)

---

## SalesOffer Model

**Table:** `sales_offers`

Tracks offers made on properties for sale.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `property_id` | String (FK) | Link to property (required, indexed) |
| `buyer_id` | String (FK) | Link to buyer (Applicant) |
| `offer_amount` | Numeric(12,2) | Offer amount |
| `status` | String | pending, accepted, rejected, withdrawn, expired |
| `offer_date` | Date | Date offer was made |
| `expiry_date` | Date | Offer expiry date |

### Offer Details

| Field | Type | Description |
|-------|------|-------------|
| `conditions` | Text | Offer conditions |
| `timeline` | Text | Proposed timeline |
| `financing_type` | String | cash, mortgage, part_cash |
| `chain_status` | String | chain_free, in_chain |

### Relationships

- `property` → Property (many-to-one)
- `buyer` → Applicant (many-to-one)

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
├── communications → Communication[] (one-to-many)
├── sales_progression → SalesProgression (one-to-one)
├── offers → Offer[] (one-to-many, lettings)
└── sales_offers → SalesOffer[] (one-to-many, sales)
```

### Applicant Relationships

```
Applicant
├── tenancies → Tenancy[] (one-to-many)
├── communications → Communication[] (one-to-many)
├── letting_offers → Offer[] (one-to-many)
├── sales_progression → SalesProgression[] (one-to-many)
└── sales_offers → SalesOffer[] (one-to-many)
```

### Vendor Relationships

```
Vendor
├── instructed_property_id → Property (many-to-one)
├── tasks → Task[] (one-to-many)
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

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** Finalized

### Version 2.0 Changes

- **Applicant Model**: Added `willing_to_rent` and `willing_to_buy` flags to distinguish between tenants and buyers
- **Vendor Model**: Removed `title` and `secondary_phone` fields
- **Property Model**: Added sales-specific fields (`asking_price`, `sales_status`, `price_qualifier`)
- **Sales Models**: Added `SalesProgression` and `SalesOffer` models for sales workflow tracking
- **Relationships**: Updated to include sales-related relationships

