from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import io
from PIL import Image

from ..database import get_db
from ..models import DetectionEvent
from ..schemas import VQAResponse
from ..services.vision_engine import run_vqa_inference

router = APIRouter(prefix="/api/vqa", tags=["VQA"])

@router.post("", response_model=VQAResponse)
async def process_vqa(
    image: UploadFile = File(...), 
    query: str = Form(...),
    db: Session = Depends(get_db)
):
    """Processes Visual Question Answering using the Vision Engine."""
    content = await image.read()
    try:
        pil_img = Image.open(io.BytesIO(content))
        answer = await run_vqa_inference(pil_img, query)
        
        # Log to Database
        db_event = DetectionEvent(trigger_type="VQA_QUERY", detected_content=answer)
        db.add(db_event)
        db.commit()
        
        return VQAResponse(status="success", query=query, answer=answer)
    except Exception as e:
        return VQAResponse(status="error", query=query, answer=f"API Error: {str(e)}")
