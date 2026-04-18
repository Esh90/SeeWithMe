from pydantic import BaseModel
from typing import List

class NavigationRequest(BaseModel):
    start_location: str
    destination: str

class NavigationResponse(BaseModel):
    status: str
    steps: List[str]

class VQARequest(BaseModel):
    query: str

class VQAResponse(BaseModel):
    status: str
    query: str
    answer: str

class StatusResponse(BaseModel):
    status: str
    message: str
