from __future__ import annotations

import logging
import sys
from functools import lru_cache


@lru_cache()
def get_logger(name: str) -> logging.Logger:
    """Return a named logger configured for the app."""
    return logging.getLogger(name)


def setup_logging(debug: bool = False) -> None:
    """
    Call once at application startup.
    DEBUG=true  → level DEBUG, verbose format with module path
    DEBUG=false → level INFO, clean production format
    """
    level = logging.DEBUG if debug else logging.INFO

    fmt_debug = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d — %(message)s"
    fmt_prod  = "%(asctime)s | %(levelname)-8s | %(name)s — %(message)s"

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(
        logging.Formatter(
            fmt=fmt_debug if debug else fmt_prod,
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Quiet noisy third-party loggers unless in debug
    if not debug:
        for noisy in ("httpcore", "httpx", "uvicorn.access", "motor", "pymongo"):
            logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(__name__).debug("Logging initialised — level=%s", logging.getLevelName(level))
