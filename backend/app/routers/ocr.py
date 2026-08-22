"""POST /ocr — extracts text from a base64 image using the OCR service.

Wires services/ocr.py into the API. The frontend posts
{ "imageData": "<dataURL>" } and expects { "text": "<extracted text>" }.
Requires authentication.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.dependencies import UserId
from services.ocr import extract_text_from_base64

router = APIRouter(tags=["ocr"])


class OCRRequest(BaseModel):
    imageData: str


class OCRResponse(BaseModel):
    text: str


@router.post("/ocr", response_model=OCRResponse)
def ocr(request: OCRRequest, _user_id: UserId) -> OCRResponse:
    try:
        text = extract_text_from_base64(request.imageData)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return OCRResponse(text=text)
