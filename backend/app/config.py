import os
from dotenv import load_dotenv, find_dotenv

dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path, override=True)
else:
    load_dotenv(override=True)

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7bdf74de8fa96277b78912d1b72e185859d57a26f3bbdcd854c86e00a20a59a7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    OLLAMA_API_KEY: str = os.getenv("OLLAMA_API_KEY", "")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "")
    raw_origins: str = os.getenv("ALLOWED_ORIGINS", "")
    ALLOWED_ORIGINS: list[str] = [x.strip() for x in raw_origins.split(",") if x.strip()]
    raw_db_url: str = os.getenv("DATABASE_URL", "").strip()
    DATABASE_URL: str = raw_db_url.replace("postgres://", "postgresql://", 1) if raw_db_url.startswith("postgres://") else raw_db_url

settings = Settings()
