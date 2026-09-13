"""Structured application logging configuration."""
import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configures root application logging."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    logger = logging.getLogger("medikiosk")
    logger.setLevel(log_level)
    if not logger.handlers:
        logger.addHandler(handler)

    return logger


logger = setup_logging()
