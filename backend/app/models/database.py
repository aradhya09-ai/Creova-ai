"""Database models for CREOVA AI."""
import sqlite3
import json
import os
import threading
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = os.environ.get(
    "DATABASE_URL", "sqlite:///./creova.db"
).replace("sqlite:///", "")

_lock = threading.Lock()


def _get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock:
        conn = _get_conn()
        try:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    assets TEXT DEFAULT '[]'
                );
                CREATE TABLE IF NOT EXISTS history (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    prompt TEXT DEFAULT '',
                    filename TEXT DEFAULT '',
                    preview TEXT DEFAULT '',
                    metadata TEXT DEFAULT '{}',
                    project_id TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS voices (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    gender TEXT DEFAULT 'neutral',
                    filename TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                );
                """
            )
            conn.commit()
        finally:
            conn.close()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def save_project(project_id, name, assets, created_at=None, updated_at=None):
    with _lock:
        conn = _get_conn()
        try:
            ts = now_iso()
            conn.execute(
                "INSERT OR REPLACE INTO projects (id, name, created_at, updated_at, assets) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    project_id,
                    name,
                    created_at or ts,
                    updated_at or ts,
                    json.dumps(assets),
                ),
            )
            conn.commit()
        finally:
            conn.close()


def update_project(project_id, name=None, assets=None):
    with _lock:
        conn = _get_conn()
        try:
            row = conn.execute(
                "SELECT * FROM projects WHERE id=?", (project_id,)
            ).fetchone()
            if not row:
                return None
            new_name = name or row["name"]
            new_assets = assets if assets is not None else json.loads(row["assets"])
            conn.execute(
                "UPDATE projects SET name=?, assets=?, updated_at=? WHERE id=?",
                (new_name, json.dumps(new_assets), now_iso(), project_id),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM projects WHERE id=?", (project_id,)
            ).fetchone()
            return dict(row)
        finally:
            conn.close()


def get_projects():
    with _lock:
        conn = _get_conn()
        try:
            rows = conn.execute(
                "SELECT * FROM projects ORDER BY updated_at DESC"
            ).fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["assets"] = json.loads(d.get("assets") or "[]")
                result.append(d)
            return result
        finally:
            conn.close()


def get_project(project_id):
    with _lock:
        conn = _get_conn()
        try:
            row = conn.execute(
                "SELECT * FROM projects WHERE id=?", (project_id,)
            ).fetchone()
            if not row:
                return None
            d = dict(row)
            d["assets"] = json.loads(d.get("assets") or "[]")
            return d
        finally:
            conn.close()


def delete_project(project_id):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute("DELETE FROM projects WHERE id=?", (project_id,))
            conn.commit()
            return True
        finally:
            conn.close()


def add_history(entry):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO history "
                "(id, type, kind, prompt, filename, preview, metadata, project_id, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    entry["id"],
                    entry["type"],
                    entry.get("kind", ""),
                    entry.get("prompt", ""),
                    entry.get("filename", ""),
                    entry.get("preview", ""),
                    json.dumps(entry.get("metadata", {})),
                    entry.get("project_id", ""),
                    entry.get("created_at", now_iso()),
                ),
            )
            conn.commit()
        finally:
            conn.close()


def get_history(limit=100):
    with _lock:
        conn = _get_conn()
        try:
            rows = conn.execute(
                "SELECT * FROM history ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["metadata"] = json.loads(d.get("metadata") or "{}")
                result.append(d)
            return result
        finally:
            conn.close()


def delete_history(entry_id):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute("DELETE FROM history WHERE id=?", (entry_id,))
            conn.commit()
            return True
        finally:
            conn.close()


def get_setting(key, default=None):
    conn = _get_conn()
    try:
        row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        return json.loads(row["value"]) if row else default
    finally:
        conn.close()


def set_setting(key, value):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                (key, json.dumps(value)),
            )
            conn.commit()
        finally:
            conn.close()


def get_settings_map():
    conn = _get_conn()
    try:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        return {r["key"]: json.loads(r["value"]) for r in rows}
    finally:
        conn.close()


# ---- Voices ----

def save_voice(voice_id, name, gender, filename, created_at=None):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO voices (id, name, gender, filename, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (voice_id, name, gender, filename, created_at or now_iso()),
            )
            conn.commit()
        finally:
            conn.close()


def get_voices():
    with _lock:
        conn = _get_conn()
        try:
            rows = conn.execute("SELECT * FROM voices ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


def delete_voice(voice_id):
    with _lock:
        conn = _get_conn()
        try:
            conn.execute("DELETE FROM voices WHERE id=?", (voice_id,))
            conn.commit()
            return True
        finally:
            conn.close()