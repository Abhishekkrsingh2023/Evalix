#!/usr/bin/env python3
"""
Seed script: populates or updates teams in the database from a CSV file.

Usage:
    uv run python team_seed.py [path_to_csv]
    # or
    python team_seed.py [path_to_csv]

Defaults to 'teams.csv' in the backend directory.
The CSV must have columns: Registration ID, Team Name, Leader Name.
'Registration ID' is stored as the team's team_id and encoded in the QR code.
Seeds directly to the database without requiring admin authentication.
"""
import asyncio
import csv
import sys
from pathlib import Path

from sqlalchemy import select
from app.db.session import AsyncSessionLocal, engine
from app.models.team import Team

DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "teams.csv"


def read_teams_from_csv(file_path: Path) -> list[dict[str, str]]:
    """Read and extract teams from the CSV file."""
    if not file_path.exists():
        raise FileNotFoundError(f"CSV file not found at: {file_path}")

    teams_data: list[dict[str, str]] = []
    with open(file_path, mode="r", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)

        # Validate expected headers — Registration ID is the QR-encoded team identifier
        required_fields = ["Registration ID", "Team Name", "Leader Name"]
        if not reader.fieldnames or not all(field in reader.fieldnames for field in required_fields):
            raise ValueError(
                f"CSV must contain the following columns: {required_fields}. Found: {reader.fieldnames}"
            )

        for row_num, row in enumerate(reader, start=2):
            # Registration ID is used as team_id (encoded in QR code)
            team_id = (row.get("Registration ID") or "").strip().upper()
            team_name = (row.get("Team Name") or "").strip()
            leader_name = (row.get("Leader Name") or "").strip()

            if not team_id:
                print(f"⚠  Row {row_num}: Missing 'Registration ID', skipping.")
                continue

            if not team_name:
                print(f"⚠  Row {row_num}: Team '{team_id}' missing 'Team Name', skipping.")
                continue

            if not leader_name:
                print(f"⚠  Row {row_num}: Team '{team_id}' missing 'Leader Name', skipping.")
                continue

            teams_data.append({
                "team_id": team_id,
                "team_name": team_name,
                "leader_name": leader_name,
            })

    return teams_data


async def seed_teams(csv_path: Path) -> None:
    print(f"Reading teams from: {csv_path}")
    teams_to_seed = read_teams_from_csv(csv_path)
    print(f"Found {len(teams_to_seed)} teams to process.\n")

    created_count = 0
    updated_count = 0
    unchanged_count = 0

    async with AsyncSessionLocal() as db:
        # Fetch existing teams indexed by team_id
        result = await db.execute(select(Team))
        existing_teams: dict[str, Team] = {team.team_id.upper(): team for team in result.scalars().all()}

        for team_info in teams_to_seed:
            team_id = team_info["team_id"]
            team_name = team_info["team_name"]
            leader_name = team_info["leader_name"]

            if team_id in existing_teams:
                team = existing_teams[team_id]
                needs_update = False

                if team.team_name != team_name:
                    team.team_name = team_name
                    needs_update = True

                if team.leader_name != leader_name:
                    team.leader_name = leader_name
                    needs_update = True

                if needs_update:
                    updated_count += 1
                    print(f"⚡ Updated: {team_id} -> '{team_name}' (Leader: {leader_name})")
                else:
                    unchanged_count += 1
                    print(f"✓ Already up to date: {team_id} ('{team_name}')")
            else:
                new_team = Team(
                    team_id=team_id,
                    team_name=team_name,
                    leader_name=leader_name,
                )
                db.add(new_team)
                created_count += 1
                print(f"+ Created: {team_id} -> '{team_name}' (Leader: {leader_name})")

        if created_count > 0 or updated_count > 0:
            await db.commit()
            print("\nDatabase transaction committed successfully.")
        else:
            print("\nNo database changes were needed.")

    await engine.dispose()

    print("\n--- Seeding Summary ---")
    print(f"Total processed: {len(teams_to_seed)}")
    print(f"Created:         {created_count}")
    print(f"Updated:         {updated_count}")
    print(f"Unchanged:       {unchanged_count}")


def main() -> None:
    csv_file = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_CSV_PATH
    try:
        asyncio.run(seed_teams(csv_file))
    except Exception as exc:
        print(f"Error during team seeding: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
