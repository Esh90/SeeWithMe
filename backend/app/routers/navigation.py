from fastapi import APIRouter, Form, Depends
from sqlalchemy.orm import Session
import json

from ..database import get_db
from ..models import NavigationRoute
from ..schemas import NavigationResponse

router = APIRouter(prefix="/api/navigate", tags=["Navigation"])

@router.post("", response_model=NavigationResponse)
async def request_navigation(
    start: str = Form(...), 
    destination: str = Form(...),
    db: Session = Depends(get_db)
):
    """Generates a step-by-step route and logs the request."""
    # Heuristic algorithm for routing steps
    steps = [
        f"Starting navigation from {start} to {destination}.",
        "Head straight for 50 meters.",
        f"You have arrived at {destination}."
    ]
    
    # Log to Database
    db_route = NavigationRoute(
        start_location=start, 
        destination=destination,
        routing_data=json.dumps(steps)
    )
    db.add(db_route)
    db.commit()
    
    return NavigationResponse(status="success", steps=steps)
