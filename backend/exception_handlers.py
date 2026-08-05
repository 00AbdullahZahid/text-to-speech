from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from logger import logger


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation failed: %s", exc)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


async def http_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )
