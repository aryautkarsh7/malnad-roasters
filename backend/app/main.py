import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config, db
from .routers import admin, orders, public

logger = logging.getLogger("api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    config.assert_configured()
    yield
    await db.close()


app = FastAPI(title="Malnad Roasters API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_origin_regex=config.ALLOWED_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(db.DBError)
async def db_error_handler(_: Request, exc: db.DBError):
    logger.error("database error %s: %s", exc.status, exc.message)
    return JSONResponse(
        status_code=502, content={"detail": "The database is unavailable. Try again shortly."}
    )


app.include_router(public.router)
app.include_router(orders.router)
app.include_router(admin.router)
