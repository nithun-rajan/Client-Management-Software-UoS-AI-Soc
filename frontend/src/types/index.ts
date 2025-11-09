export interface LandlordInfo {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

export interface Property {
  id: string;
  address_line1?: string;
  address?: string;
  address_line2?: string;
  city: string;
  postcode: string;
  status:
    | "available"
    | "let_agreed"
    | "let_by"
    | "tenanted"
    | "under_offer"
    | "blocked"
    | "maintenance"
    | "managed"
    | "withdrawn";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  rent?: number;
  landlord_id?: string;
  landlord?: LandlordInfo;
  virtual_tour_url?: string;
  main_photo_url?: string;
  // Sales fields
  sales_status?: string;
  asking_price?: number;
  price_qualifier?: string;
  has_valuation_pack?: boolean;
  // Property management fields
  managed_by?: string;
  management_type?: string;
  management_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Landlord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  aml_verified: boolean;
  aml_verification_date?: string;
  aml_check_expiry?: string;
  bank_account_name?: string;
  sort_code?: string;
  account_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Vendor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_phone: string;
  current_address?: string;
  date_of_birth?: string;
  nationality?: string;
  aml_status: string; // "pending" | "verified" | "rejected"
  aml_verification_date?: string;
  aml_verification_expiry?: string;
  proof_of_ownership_uploaded?: boolean;
  status: string; // "new" | "instructed" | "active" | "sold" | "withdrawn" | "lost"
  instruction_type?: string; // "sole_agency" | "multi_agency"
  instruction_date?: string;
  agreed_commission?: number | string; // Numeric or string
  minimum_fee?: string;
  contract_expiry_date?: string;
  source_of_lead?: string;
  marketing_consent?: boolean;
  conveyancer_name?: string;
  conveyancer_firm?: string;
  conveyancer_contact?: string;
  instructed_property_id?: string;
  vendor_complete_info?: boolean;
  // Optional fields that may not be in model yet
  id_document_type?: string;
  proof_of_address_type?: string;
  pep_check?: boolean;
  contract_length_weeks?: number;
  created_at: string;
  updated_at?: string;
}

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  status:
    | "new"
    | "qualified"
    | "viewing_booked"
    | "offer_submitted"
    | "offer_accepted"
    | "references"
    | "let_agreed"
    | "tenancy_started"
    | "archived";
  desired_bedrooms?: string;
  desired_property_type?: string;
  rent_budget_min?: number;
  rent_budget_max?: number;
  preferred_locations?: string;
  move_in_date?: string;
  has_pets: boolean;
  pet_details?: string;
  special_requirements?: string;
  references_passed?: boolean;
  willing_to_rent?: boolean;
  willing_to_buy?: boolean;
  buyer_questions_answered?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface KPIData {
  properties_letting?: {
    total: number;
    available: number;
    let_by: number;
    managed: number;
    avg_rent: number;
  };
  properties_sale?: {
    total: number;
    avg_selling_price: number;
  };
  landlords?: {
    total: number;
    aml_verified: number;
    verification_rate: number;
  };
  tenants?: {
    total: number;
    qualified: number;
    qualification_rate: number;
  };
  buyers?: {
    total: number;
  };
  vendors?: {
    total: number;
  };
  // Legacy fields for backward compatibility
  properties?: {
    total: number;
    available: number;
    let_by: number;
    managed: number;
    avg_rent: number;
  };
  applicants?: {
    total: number;
    qualified: number;
    qualification_rate: number;
  };
}

export interface SalesProgression {
  id: string;
  property_id: string;
  vendor_id: string;
  buyer_id: string;
  assigned_progressor_id?: string;
  current_stage: string;
  sales_status: string;
  offer_date?: string;
  offer_accepted_date?: string;
  sstc_date?: string;
  solicitor_instructed_date?: string;
  mortgage_applied_date?: string;
  survey_ordered_date?: string;
  searches_ordered_date?: string;
  exchange_date?: string;
  completion_date?: string;
  offer_amount?: number;
  agreed_price?: number;
  offer_status?: string;
  offer_conditions?: string;
  chain_id?: string;
  chain_position?: string;
  is_chain_break: boolean;
  chain_notes?: string;
  buyer_solicitor_name?: string;
  buyer_solicitor_contact?: string;
  buyer_solicitor_email?: string;
  vendor_solicitor_name?: string;
  vendor_solicitor_contact?: string;
  vendor_solicitor_email?: string;
  mortgage_status?: string;
  mortgage_lender?: string;
  mortgage_offer_expiry?: string;
  mortgage_notes?: string;
  survey_type?: string;
  surveyor_name?: string;
  survey_issues_identified: boolean;
  survey_issues_notes?: string;
  is_leasehold: boolean;
  service_charge?: number;
  ground_rent?: number;
  lease_length_years?: number;
  major_works_planned: boolean;
  major_works_details?: string;
  is_fall_through: boolean;
  fall_through_reason?: string;
  delay_reason?: string;
  internal_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SalesOffer {
  id: string;
  property_id: string;
  buyer_id: string;
  sales_progression_id?: string;
  offer_amount: number;
  status: string;
  is_subject_to_survey: boolean;
  is_subject_to_contract: boolean;
  is_subject_to_mortgage: boolean;
  is_cash_buyer: boolean;
  has_chain: boolean;
  offer_made_date?: string;
  offer_expiry_date?: string;
  decision_date?: string;
  special_conditions?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}