from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.auth import router as auth_router
from api.keycloak import router as keycloak_router
from api.gitlab_api import router as gitlab_router
from api.argocd import router as argocd_router
from api.platform_users import router as users_router
from api.projects import router as projects_router
from api.kubernetes import router as kube_router
from api.me import router as me_router
from api.tickets import router as tickets_router
from api.provisioning import router as provisioning_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup database schema updates
    try:
        from db.session import engine, Base
        import db.models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS name TEXT;"))
            await conn.execute(text("ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS department TEXT;"))
            await conn.execute(text("ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS location TEXT;"))
            await conn.execute(text("ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS avatar_icon TEXT;"))
            await conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_message TEXT;"))
    except Exception as e:
        print(f"Error checking/creating schema columns: {e}")
    yield


app = FastAPI(title="Stackr Platform API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(keycloak_router)
app.include_router(gitlab_router)
app.include_router(argocd_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(kube_router)
app.include_router(me_router)
app.include_router(tickets_router)
app.include_router(provisioning_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"name": "Stackr Platform API", "version": "1.0.0", "docs": "/docs"}
