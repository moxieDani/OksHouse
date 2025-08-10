from fastapi import APIRouter
from .reservations import router as admin_reservations_router
from .admins import router as admin_management_router

admin_router = APIRouter()
admin_router.include_router(admin_reservations_router, prefix="/reservations", tags=["admin-reservations"])
admin_router.include_router(admin_management_router, prefix="/admins", tags=["admin-management"])