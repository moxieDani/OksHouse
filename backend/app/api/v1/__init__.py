from fastapi import APIRouter
from .user import user_router
from .admin import admin_router
from .public import public_router

api_router = APIRouter()

# Structured API routes
api_router.include_router(user_router, prefix="/user")
api_router.include_router(admin_router, prefix="/admin")
api_router.include_router(public_router, prefix="/public")