import os
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

from backend.linearizer import linearize
from backend.inference import generate_summary

app = FastAPI(title="ScoreScribe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Performer(BaseModel):
    name: str
    pts: int = 0
    reb: int = 0
    ast: int = 0
    stl: int = 0
    blk: int = 0


class GameData(BaseModel):
    home_city: str
    home_name: str
    home_score: int
    home_assists: int = 0
    home_rebounds: int = 0
    home_turnovers: int = 0
    away_city: str
    away_name: str
    away_score: int
    away_assists: int = 0
    away_rebounds: int = 0
    away_turnovers: int = 0
    home_performers: List[Performer] = []
    away_performers: List[Performer] = []
    date: Optional[str] = None


class SummaryResponse(BaseModel):
    summary: str
    linearized_input: str


dataset = None


@app.on_event("startup")
async def load_dataset_on_startup():
    global dataset
    from datasets import load_dataset
    print("[ScoreScribe] Loading rotowire dataset...")
    dataset = load_dataset("mrm8488/rotowire-sbnation", split="train")
    print(f"[ScoreScribe] Dataset loaded: {len(dataset)} games.")


def _safe_int(val):
    if val is None or val == "N/A" or val == "":
        return 0
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def _extract_team_performers(box_score, team_city, top_n=5):
    players = []
    name_map = box_score.get("PLAYER_NAME", {})
    city_map = box_score.get("TEAM_CITY", {})
    pts_map = box_score.get("PTS", {})
    reb_map = box_score.get("REB", {})
    ast_map = box_score.get("AST", {})
    stl_map = box_score.get("STL", {})
    blk_map = box_score.get("BLK", {})

    for idx in name_map:
        if name_map[idx] is None:
            continue
        if city_map.get(idx) != team_city:
            continue
        pts_val = _safe_int(pts_map.get(idx))
        if pts_val == 0 and _safe_int(reb_map.get(idx)) == 0 and _safe_int(ast_map.get(idx)) == 0:
            continue
        players.append({
            "name": name_map[idx],
            "pts": pts_val,
            "reb": _safe_int(reb_map.get(idx)),
            "ast": _safe_int(ast_map.get(idx)),
            "stl": _safe_int(stl_map.get(idx)),
            "blk": _safe_int(blk_map.get(idx)),
        })

    players.sort(key=lambda p: p["pts"], reverse=True)
    return players[:top_n]


@app.get("/random-game")
async def random_game():
    if dataset is None:
        return {"error": "Dataset not loaded yet"}

    entry = dataset[random.randint(0, len(dataset) - 1)]

    home_line = entry.get("home_line", {})
    vis_line = entry.get("vis_line", {})
    box_score = entry.get("box_score", {})

    home_city = home_line.get("TEAM-CITY", entry.get("home_city", ""))
    home_name = home_line.get("TEAM-NAME", entry.get("home_name", ""))
    away_city = vis_line.get("TEAM-CITY", entry.get("vis_city", ""))
    away_name = vis_line.get("TEAM-NAME", entry.get("vis_name", ""))

    home_score = _safe_int(home_line.get("TEAM-PTS"))
    away_score = _safe_int(vis_line.get("TEAM-PTS"))

    home_q1 = _safe_int(home_line.get("TEAM-PTS_QTR1"))
    home_q2 = _safe_int(home_line.get("TEAM-PTS_QTR2"))
    home_q3 = _safe_int(home_line.get("TEAM-PTS_QTR3"))
    home_q4 = _safe_int(home_line.get("TEAM-PTS_QTR4"))

    away_q1 = _safe_int(vis_line.get("TEAM-PTS_QTR1"))
    away_q2 = _safe_int(vis_line.get("TEAM-PTS_QTR2"))
    away_q3 = _safe_int(vis_line.get("TEAM-PTS_QTR3"))
    away_q4 = _safe_int(vis_line.get("TEAM-PTS_QTR4"))

    home_scores_str = ", ".join(str(v) for v in [home_score, home_q1, home_q2, home_q3, home_q4])
    away_scores_str = ", ".join(str(v) for v in [away_score, away_q1, away_q2, away_q3, away_q4])

    home_performers = _extract_team_performers(box_score, home_city)
    away_performers = _extract_team_performers(box_score, away_city)

    return {
        "home_city": home_city,
        "home_name": home_name,
        "home_scores": home_scores_str,
        "home_assists": _safe_int(home_line.get("TEAM-AST")),
        "home_rebounds": _safe_int(home_line.get("TEAM-REB")),
        "home_turnovers": _safe_int(home_line.get("TEAM-TOV")),
        "away_city": away_city,
        "away_name": away_name,
        "away_scores": away_scores_str,
        "away_assists": _safe_int(vis_line.get("TEAM-AST")),
        "away_rebounds": _safe_int(vis_line.get("TEAM-REB")),
        "away_turnovers": _safe_int(vis_line.get("TEAM-TOV")),
        "home_performers": home_performers,
        "away_performers": away_performers,
    }


@app.post("/generate", response_model=SummaryResponse)
async def generate(game: GameData):
    payload = game.model_dump()
    linearized = linearize(payload)
    summary = generate_summary(linearized)
    return SummaryResponse(summary=summary, linearized_input=linearized)


FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
async def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

