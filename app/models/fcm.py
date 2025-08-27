from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime


class FCMToken(Base):
    __tablename__ = "fcm_tokens"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.admin_id"), nullable=False)
    fcm_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    admin = relationship("Admin", back_populates="fcm_tokens")
