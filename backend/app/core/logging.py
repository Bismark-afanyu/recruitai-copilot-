"""JSON structured logging configuration."""
import json
import logging
import sys

from .config import get_settings


def configure_logging():
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    if settings.log_format == "structured":
        class StructuredFormatter(logging.Formatter):
            def format(self, record):
                obj = {
                    "ts": self.formatTime(record, self.datefmt),
                    "level": record.levelname,
                    "logger": record.name,
                    "msg": record.getMessage(),
                }
                if record.exc_info and record.exc_info[0]:
                    obj["exc"] = self.formatException(record.exc_info)
                return json.dumps(obj)

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logging.basicConfig(level=level, handlers=[handler], force=True)
    else:
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
            stream=sys.stdout,
            force=True,
        )
