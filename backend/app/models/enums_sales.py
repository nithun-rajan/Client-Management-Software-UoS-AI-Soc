"""
Sales-specific enums using project's standard structure
"""

class SalesDocumentStatus:
    """Tracks the acquisition workflow for sales documents"""
    NOT_REQUESTED = "not_requested"
    REQUESTED = "requested"
    RECEIVED = "received"
    VERIFIED = "verified"
    EXPIRED = "expired"

class SalesStage:
    OFFER_ACCEPTED = "offer_accepted"
    SSTC = "sstc"
    SOLICITOR_INSTRUCTED = "solicitor_instructed"
    MORTGAGE_APPLIED = "mortgage_applied"
    SURVEY_ORDERED = "survey_ordered"
    SEARCHES_ORDERED = "searches_ordered"
    SEARCHES_RECEIVED = "searches_received"
    MANAGEMENT_PACK_RECEIVED = "management_pack_received"
    READY_FOR_EXCHANGE = "ready_for_exchange"
    EXCHANGED = "exchanged"
    COMPLETED = "completed"

class SalesStatus:
    AVAILABLE = "available"
    UNDER_OFFER = "under_offer"
    SSTC = "sstc"
    EXCHANGED = "exchanged"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"

class InstructionType:
    SOLE_AGENCY = "sole_agency"
    JOINT_SOLE = "joint_sole"
    MULTI_AGENCY = "multi_agency"

class OfferStatus:
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"

class ChainPosition:
    NO_CHAIN = "no_chain"
    CHAIN_TOP = "chain_top"
    CHAIN_MIDDLE = "chain_middle"
    CHAIN_BOTTOM = "chain_bottom"
    CHAIN_UNKNOWN = "chain_unknown"

class MortgageStatus:
    NOT_APPLIED = "not_applied"
    AIP_RECEIVED = "aip_received"
    APPLICATION_SUBMITTED = "application_submitted"
    UNDERWRITING = "underwriting"
    OFFERED = "offered"
    APPROVED = "approved"
    DECLINED = "declined"

class SurveyType:
    VALUATION = "valuation"
    HOME_BUYERS = "home_buyers"
    BUILDING_SURVEY = "building_survey"
    NONE = "none"

class BuyerType:
    FIRST_TIME_BUYER = "first_time_buyer"
    INVESTOR = "investor"
    OWNER_OCCUPIER = "owner_occupier"
    RELOCATION = "relocation"
    SECOND_HOME = "second_home"