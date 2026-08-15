from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.session import init_db

from backend.api.auth_routes import router as auth_router
from backend.api.profile_routes import router as profile_router
from backend.api.onboarding_routes import router as onboarding_router
from backend.api.engine_routes import router as engine_router

app = FastAPI(
    title="Compound API",
    description="Backend API services for Compound financial engine",
    version="1.0.0",
)

# Allow all origins for API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(onboarding_router)
app.include_router(engine_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "compound-api"}
