import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import settings
from app.core.errors import setup_exception_handlers

app = FastAPI(
    title="Nubara Airlines - Disruption Companion API",
    version="1.0.0",
    description="Operational disruption orchestrator with policy evaluation and idempotency control.",
)

# Correlation Trace ID middleware
@app.middleware("http")
async def add_trace_id_header(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id
    return response

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Exception Handlers
setup_exception_handlers(app)

# API Routes
app.include_router(api_router, prefix="/api/v1")
