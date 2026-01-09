# Config module
from .enterprise_config import get_config

# Export settings for backward compatibility
settings = get_config()