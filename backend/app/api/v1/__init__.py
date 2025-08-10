from fastapi import APIRouter
from .reservations import router as reservations_router

api_router = APIRouter()
api_router.include_router(reservations_router, prefix="/reservations", tags=["reservations"])