from fastapi import APIRouter

from app.api.v1 import (
    applicants, 
    agents,
    auth, 
    events, 
    kpis, 
    land_registry, 
    landlords, 
    messaging, 
    properties, 
    property_matching, 
    search,
    tenancy,
    tasks,
    tickets,
    vendors,
    viewings,
    offers,
    workflows,
    sales,
    valuations
)

api_router = APIRouter()

api_router.include_router(applicants.router)
api_router.include_router(agents.router)
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(kpis.router)
api_router.include_router(land_registry.router)
api_router.include_router(landlords.router)
api_router.include_router(messaging.router)
api_router.include_router(properties.router)
api_router.include_router(property_matching.router)
api_router.include_router(search.router)
api_router.include_router(tenancy.router)
api_router.include_router(tasks.router)
api_router.include_router(tickets.router)
api_router.include_router(vendors.router)
api_router.include_router(viewings.router)
api_router.include_router(offers.router)
api_router.include_router(workflows.router)
api_router.include_router(sales.router, tags=["sales"])
api_router.include_router(valuations.router, tags=["valuations"])
