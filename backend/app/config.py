import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("api")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://malnad-roasters.vercel.app",
    ).split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = (
    os.environ.get("ALLOWED_ORIGIN_REGEX")
    or r"^https:\/\/.*\.vercel\.app$"
)

IS_LOCAL_MODE = not (SUPABASE_URL and SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY)


def assert_configured() -> None:
    if IS_LOCAL_MODE:
        logger.info(
            "Running in standalone local mode with SQLite fallback. "
            "To connect to Supabase, provide SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
        )
    else:
        logger.info("Connected to Supabase at %s", SUPABASE_URL)
