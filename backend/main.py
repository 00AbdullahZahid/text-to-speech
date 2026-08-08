"""Shim entrypoint — re-exports the FastAPI app from app.main.

Run with: uvicorn main:app --reload
"""
from app.main import app  # noqa: F401
