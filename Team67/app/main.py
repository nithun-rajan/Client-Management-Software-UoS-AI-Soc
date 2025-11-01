from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.v1 import properties, landlords, applicants, search  # ← Add search

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Team 67 CRM API",
    description="Estate Agency CRM REST API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Team 1 CRM API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(properties.router, prefix="/api/v1")
app.include_router(landlords.router, prefix="/api/v1")
app.include_router(applicants.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")  