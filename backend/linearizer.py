from datetime import datetime


def linearize(data: dict) -> str:
    now = datetime.now()
    date_str = data.get("date", now.strftime("%m_%d_%y"))

    home_city = data.get("home_city", "")
    home_name = data.get("home_name", "")
    home_score = data.get("home_score", 0)
    home_assists = data.get("home_assists", 0)
    home_rebounds = data.get("home_rebounds", 0)
    home_turnovers = data.get("home_turnovers", 0)

    away_city = data.get("away_city", "")
    away_name = data.get("away_name", "")
    away_score = data.get("away_score", 0)
    away_assists = data.get("away_assists", 0)
    away_rebounds = data.get("away_rebounds", 0)
    away_turnovers = data.get("away_turnovers", 0)

    parts = []

    parts.append(f"[DATE] {date_str}")

    home_full = f"{home_city} {home_name}".strip()
    parts.append(
        f"[HOME_TEAM] {home_full} scored {home_score} points "
        f"with {home_assists} assists, {home_rebounds} rebounds, "
        f"and {home_turnovers} turnovers."
    )

    away_full = f"{away_city} {away_name}".strip()
    parts.append(
        f"[AWAY_TEAM] {away_full} scored {away_score} points "
        f"with {away_assists} assists, {away_rebounds} rebounds, "
        f"and {away_turnovers} turnovers."
    )

    for performer in data.get("home_performers", []):
        team_short = home_city if home_city else home_name
        parts.append(_format_player(performer, team_short))

    for performer in data.get("away_performers", []):
        team_short = away_city if away_city else away_name
        parts.append(_format_player(performer, team_short))

    return " ".join(parts)


def _format_player(player: dict, team: str) -> str:
    name = player.get("name", "Unknown")
    pts = player.get("pts", 0)
    reb = player.get("reb", 0)
    ast = player.get("ast", 0)
    stl = player.get("stl", 0)
    blk = player.get("blk", 0)

    return (
        f"[PLAYER] {name} from {team} had {pts} points, "
        f"{reb} rebounds, {ast} assists, {stl} steals, "
        f"and {blk} blocks."
    )
