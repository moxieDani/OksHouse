from fastapi import APIRouter
from .reservations import router as user_reservations_router
from .auth import router as user_auth_router

user_router = APIRouter()
user_router.include_router(user_reservations_router, prefix="/reservations", tags=["user-reservations"])
user_router.include_router(user_auth_router, prefix="/auth", tags=["user-auth"])