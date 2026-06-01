from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str = "change_me_in_production"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 10080
    app_name: str = "PrimetradeAI API"
    cors_origins: str = "*"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
