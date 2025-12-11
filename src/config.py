from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/market_sentiment_db"
    # Fallback to SQLite for local running if Postgres is not available
    DATABASE_URL: str = "sqlite+aiosqlite:///./market_sentiment.db"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
