from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_async_db
from app.services.admin_service import AdminService
from app.schemas.admin import AdminCreate, AdminResponse, AdminCheck, AdminUpdate

router = APIRouter()


@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    admin: AdminCreate,
    db: Session = Depends(get_async_db)
):
    """새 관리자 생성 - 관리자 전용"""
    try:
        return await AdminService.create_admin(db=db, admin=admin)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 존재하는 관리자명입니다."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="관리자 생성 중 오류가 발생했습니다."
        )


@router.get("/exists/{admin_name}", response_model=AdminCheck)
async def check_admin_exists(
    admin_name: str,
    db: Session = Depends(get_async_db)
):
    """관리자 존재 여부 확인 (7번 기능) - 관리자 전용"""
    exists = await AdminService.is_admin_exist(db, admin_name)
    return AdminCheck(exists=exists)


@router.get("/{admin_name}", response_model=AdminResponse)
async def get_admin(
    admin_name: str,
    db: Session = Depends(get_async_db)
):
    """관리자 정보 조회 - 관리자 전용"""
    admin = await AdminService.get_admin_by_name(db, admin_name)
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="관리자를 찾을 수 없습니다."
        )
    return admin


@router.put("/{admin_name}", response_model=AdminResponse)
async def update_admin(
    admin_name: str,
    admin_update: AdminUpdate,
    db: Session = Depends(get_async_db)
):
    """관리자 정보 업데이트 - 관리자 전용"""
    try:
        updated_admin = await AdminService.update_admin(db, admin_name, admin_update)
        if updated_admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="관리자를 찾을 수 없습니다."
            )
        return updated_admin
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 존재하는 관리자명입니다."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="관리자 정보 업데이트 중 오류가 발생했습니다."
        )