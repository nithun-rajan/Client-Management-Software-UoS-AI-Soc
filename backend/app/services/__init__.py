"""
Services Module

Contains business logic and external API integrations.
"""

from app.services.land_registry_service import (
    LandRegistryService,
    close_land_registry_service,
    get_land_registry_service,
)


__all__ = [
    "LandRegistryService",
    "close_land_registry_service",
    "get_land_registry_service",
]
