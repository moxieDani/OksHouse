from fastapi import APIRouter
from .user import user_router
from .admin import admin_router
from .public import public_router
from .reservations import router as legacy_reservations_router

api_router = APIRouter()

# New structured API routes
api_router.include_router(user_router, prefix="/user")
api_router.include_router(admin_router, prefix="/admin")
api_router.include_router(public_router, prefix="/public")

# Legacy routes for backward compatibility (deprecated)
api_router.include_router(legacy_reservations_router, prefix="/reservations", tags=["legacy-reservations"])