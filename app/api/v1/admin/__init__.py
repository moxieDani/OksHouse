from fastapi import APIRouter
from .reservations import router as admin_reservations_router
from .admins import router as admin_management_router
from .auth import router as admin_auth_router
from .fcm import router as admin_fcm_router

admin_router = APIRouter()
admin_router.include_router(admin_auth_router, prefix="/auth", tags=["admin-auth"])
admin_router.include_router(admin_reservations_router, prefix="/reservations", tags=["admin-reservations"])
admin_router.include_router(admin_management_router, prefix="/admins", tags=["admin-management"])
admin_router.include_router(admin_fcm_router, prefix="/fcm", tags=["admin-fcm"])