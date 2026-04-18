from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DetectionEvent(Base):
    """Audit log for objects detected by the AI vision engine."""
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    trigger_type = Column(String)  # 'VQA_QUERY' or 'REALTIME_SCAN'
    detected_content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NavigationRoute(Base):
    __tablename__ = "navigation_routes"

    id = Column(Integer, primary_key=True, index=True)
    start_location = Column(String)
    destination = Column(String)
    routing_data = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
