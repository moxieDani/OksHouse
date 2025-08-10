import asyncio
from sqlalchemy.orm import Session
from app.models.admin import Admin
from app.schemas.admin import AdminCreate
from typing import Optional


class AdminService:
    """관리자 관련 비즈니스 로직"""
    
    @staticmethod
    async def create_admin(db: Session, admin: AdminCreate) -> Admin:
        """관리자 생성"""
        loop = asyncio.get_event_loop()
        
        def sync_create():
            db_admin = Admin(**admin.model_dump())
            db.add(db_admin)
            db.commit()
            db.refresh(db_admin)
            return db_admin
        
        return await loop.run_in_executor(None, sync_create)
    
    @staticmethod
    async def get_admin_by_name(db: Session, admin_name: str) -> Optional[Admin]:
        """관리자명으로 조회"""
        loop = asyncio.get_event_loop()
        
        def sync_get():
            return db.query(Admin).filter(Admin.name == admin_name).first()
        
        return await loop.run_in_executor(None, sync_get)
    
    @staticmethod
    async def is_admin_exist(db: Session, admin_name: str) -> bool:
        """관리자 존재 여부 확인"""
        admin = await AdminService.get_admin_by_name(db, admin_name)
        return admin is not None
    
    @staticmethod
    async def get_or_create_admin(db: Session, admin_name: str) -> Admin:
        """관리자 조회 또는 생성"""
        admin = await AdminService.get_admin_by_name(db, admin_name)
        if not admin:
            admin_create = AdminCreate(name=admin_name)
            admin = await AdminService.create_admin(db, admin_create)
        return admin