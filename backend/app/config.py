import os
import json
from typing import Any, Tuple, Type
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, EnvSettingsSource
from dotenv import load_dotenv

load_dotenv()


class _EnvSource(EnvSettingsSource):
    """EnvSettingsSource that parses comma-separated strings into lists
    instead of requiring JSON-formatted env vars."""

    def prepare_field_value(
        self, field_name: str, field: Any, value: Any, value_is_complex: bool
    ) -> Any:
        if field_name == "CORS_ORIGINS" and isinstance(value, str):
            if value.strip().startswith("["):
                return json.loads(value)
            return [o.strip() for o in value.split(",") if o.strip()]
        return super().prepare_field_value(field_name, field, value, value_is_complex)


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/grant_contracts")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # AWS S3
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "grantos")

    # App
    APP_NAME: str = "GrantOS"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # ChromaDB
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "contract_embeddings"

    # AI Models
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"

    # CORS — set CORS_ORIGINS in .env as a comma-separated list
    CORS_ORIGINS: list = []

    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    ALGORITHM: str = "HS256"

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        # Replace the default env source with our comma-aware version.
        # load_dotenv() above already merged .env into os.environ, so
        # _EnvSource will pick up those values automatically.
        return (init_settings, _EnvSource(settings_cls), file_secret_settings)


settings = Settings()
