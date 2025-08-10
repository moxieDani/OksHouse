from fastapi import APIRouter
from .reservations import router as reservations_router
from .extended_reservations import router as extended_reservations_router
from .admins import router as admins_router

api_router = APIRouter()
api_router.include_router(reservations_router, prefix="/reservations", tags=["reservations"])
api_router.include_router(extended_reservations_router, prefix="/reservations-extended", tags=["extended-reservations"])
api_router.include_router(admins_router, prefix="/admins", tags=["admins"])