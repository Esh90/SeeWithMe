from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import vqa, navigation, websocket

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="See With Me Backend", description="Production Quality Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vqa.router)
app.include_router(navigation.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "See With Me Backend Systems Active"}
