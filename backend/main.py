import os
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pipeline import run_briefing

app = FastAPI(title="ChillBillSpill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

FRONTEND = Path(__file__).parent.parent / "frontend"


@app.get("/api/briefing")
async def briefing(address: str = Query(..., description="Street address to look up")):
    if not address.strip():
        raise HTTPException(400, "address required")
    return await run_briefing(address.strip())


@app.get("/api/health")
def health():
    return {"ok": True}


# Serve frontend static files — must come last
if FRONTEND.exists():
    @app.get("/")
    def root():
        return FileResponse(FRONTEND / "index.html")

    app.mount("/", StaticFiles(directory=FRONTEND), name="static")
