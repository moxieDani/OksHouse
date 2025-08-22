from fastapi import APIRouter
from .health import router as health_router

public_router = APIRouter()
public_router.include_router(health_router, tags=["public"])