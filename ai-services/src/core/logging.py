"""
Logging configuration for AI Services
"""
import logging
import sys
from typing import Dict, Any


def setup_logging(log_level: str = "INFO") -> None:
    """Setup logging configuration"""
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


# Create logger instance
logger = logging.getLogger("ai-services")

# Setup default logging
setup_logging()

logger.info("AI Services logging initialized")