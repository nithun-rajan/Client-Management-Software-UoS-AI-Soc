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
  properties_count?: number;
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
  created_at: string;
  updated_at?: string;
}

export interface KPIData {
  properties: {
    total: number;
    available: number;
    let_by: number;
    managed: number;
    avg_rent: number;
  };
  landlords: {
    total: number;
    aml_verified: number;
    verification_rate: number;
  };
  applicants: {
    total: number;
    qualified: number;
    qualification_rate: number;
  };
}
