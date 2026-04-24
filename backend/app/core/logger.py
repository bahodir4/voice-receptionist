from __future__ import annotations

import logging
import sys

from loguru import logger

# ── Always silenced — too noisy even in DEBUG ──────────────────────────────────
_ALWAYS_WARNING = [
    "passlib",
    "passlib.handlers.bcrypt",
    "pymongo",
    "pymongo.topology",
    "pymongo.serverMonitor",
    "pymongo.connection",
    "pymongo.command",
    "motor",
    "multipart",
    "asyncio",
]

# ── Silenced only in production ────────────────────────────────────────────────
_PROD_WARNING = [
    "uvicorn.access",
    "uvicorn.error",
    "httpx",
    "httpcore",
]


class _InterceptHandler(logging.Handler):
    """Bridge stdlib logging (uvicorn, motor, fastapi) into loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        # Skip passlib/pymongo noise at the handler level as well
        if record.name.startswith(("passlib", "pymongo", "motor", "multipart")):
            return

        try:
            level = logger.level(record.levelname).name
        except ValueError:
            # Custom numeric level (e.g. LiveKit DEV_LEVEL=23) — map to nearest standard level
            no = record.levelno
            if no <= logging.DEBUG:
                level = "DEBUG"
            elif no <= logging.INFO:
                level = "INFO"
            elif no <= logging.WARNING:
                level = "WARNING"
            elif no <= logging.ERROR:
                level = "ERROR"
            else:
                level = "CRITICAL"

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore[assignment]
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging(debug: bool = False) -> None:
    """
    Call once at startup.
    DEBUG=true  → level DEBUG, verbose format with file:line, exceptions with traceback
    DEBUG=false → level INFO, clean production format, noisy libs silenced
    """
    logger.remove()

    fmt_debug = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{line}</cyan> — "
        "<level>{message}</level>"
    )
    fmt_prod = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan> — "
        "<level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        level="DEBUG" if debug else "INFO",
        format=fmt_debug if debug else fmt_prod,
        colorize=True,
        backtrace=debug,
        diagnose=debug,
        enqueue=False,
    )

    # Intercept all stdlib loggers into loguru
    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)

    # Always silence these — they are never useful application logs
    for lib in _ALWAYS_WARNING:
        logging.getLogger(lib).setLevel(logging.WARNING)

    # Silence extra libs in production
    if not debug:
        for lib in _PROD_WARNING:
            logging.getLogger(lib).setLevel(logging.WARNING)

    logger.debug("Loguru ready — level={}", "DEBUG" if debug else "INFO")
