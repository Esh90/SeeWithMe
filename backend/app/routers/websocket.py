from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import base64
import io
from PIL import Image

from ..services.vision_engine import run_hazard_detection
from ..database import SessionLocal
from ..models import DetectionEvent

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/video")
async def video_stream(websocket: WebSocket):
    await websocket.accept()
    is_inferring = False
    
    async def analyze_frame_realtime(base64_data):
        nonlocal is_inferring
        is_inferring = True
        try:
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            img_bytes = base64.b64decode(base64_data)
            pil_img = Image.open(io.BytesIO(img_bytes))
            
            # Execute AI Vision
            text = await run_hazard_detection(pil_img)
            
            # Heuristics for alert severity
            is_hazard = any(word in text.lower() for word in ['stop', 'warning', 'careful', 'hazard', 'obstacle', 'wall', 'car', 'person'])
            
            await websocket.send_json({
                "type": "warning" if is_hazard else "navigation",
                "message": text
            })
            
            # Log event stream asynchronously to DB
            def log_to_db():
                db = SessionLocal()
                try:
                    event = DetectionEvent(trigger_type="REALTIME_SCAN", detected_content=text)
                    db.add(event)
                    db.commit()
                finally:
                    db.close()
            
            await asyncio.to_thread(log_to_db)
            
        except Exception as e:
            print(f"Vision Engine Error: {e}")
        finally:
            await asyncio.sleep(4) 
            is_inferring = False

    try:
        while True:
            data = await websocket.receive_text()
            if not is_inferring:
                asyncio.create_task(analyze_frame_realtime(data))
    except WebSocketDisconnect:
        print("Frontend disconnected from video stream.")
    except Exception as e:
        print(f"WS Error: {e}")
