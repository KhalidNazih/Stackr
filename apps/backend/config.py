
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database & Cache
    DATABASE_URL: str = "postgresql+asyncpg://stackr:stackr_secret@postgres-svc:5432/stackr_platform"
    REDIS_URL: str = "redis://redis-svc:6379"

    # Keycloak
    KEYCLOAK_INTERNAL_URL: str
    KEYCLOAK_REALM: str = "Devsecops_Platform_Users"
    KEYCLOAK_CLIENT_ID: str = "stackr-plus"
    KEYCLOAK_CLIENT_SECRET: str

    # GitLab
    GITLAB_URL: str
    GITLAB_TOKEN: str
    GITLAB_GROUP: str = "root"
    GITLAB_TENANT_REPO: str = "platform-gitops"
    GITLAB_REGISTRY_PATH: str = "registry"
    GITLAB_PROJECT_ID: str = "1"
    GITLAB_DEFAULT_BRANCH: str = "main"

    # Argo CD
    ARGOCD_URL: str
    ARGOCD_TOKEN: str

    # Kubernetes
    KUBE_API_URL: str
    KUBE_TOKEN: str

    # App
    API_SECRET_KEY: str = "change-me"
    ALLOW_DEV_AUTH_BYPASS: bool = False

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
        "secrets_dir": "/mnt/secrets" if os.path.exists("/mnt/secrets") else None
    }


settings = Settings()

