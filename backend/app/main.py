from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from loguru import logger
from app.core.logger import setup_logging
from app.database import Database
from app.routers import auth, voice, chat, phone

settings = get_settings()
setup_logging(debug=settings.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await Database.connect()
    logger.info("Application started — debug={}", settings.DEBUG)
    yield
    await Database.disconnect()
    logger.info("Application stopped")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(voice.router)
    app.include_router(chat.router)
    app.include_router(phone.router)

    @app.get("/health", tags=["system"])
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok", "service": settings.APP_NAME, "debug": settings.DEBUG})

    return app


app = create_app()
