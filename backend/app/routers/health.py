from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request) -> JSONResponse:
    """Liveness + database reachability check."""
    try:
        await request.app.state.mongo_client.admin.command("ping")
        database = "up"
    except Exception:
        database = "down"

    ok = database == "up"
    return JSONResponse(
        status_code=200 if ok else 503,
        content={"status": "ok" if ok else "degraded", "database": database},
    )
