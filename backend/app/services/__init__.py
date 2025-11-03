"""
Services Module

Contains business logic and external API integrations.
"""

from app.services.land_registry_service import (
    LandRegistryService,
    get_land_registry_service,
    close_land_registry_service,
)

__all__ = [
    "LandRegistryService",
    "get_land_registry_service",
    "close_land_registry_service",
]

