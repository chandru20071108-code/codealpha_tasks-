import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "urls.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS urls (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            short_code TEXT    NOT NULL UNIQUE,
            original_url TEXT  NOT NULL,
            created_at   TEXT  DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


def save_url(short_code: str, original_url: str) -> bool:
    """Insert a new short_code/original_url pair. Returns True on success."""
    try:
        conn = get_connection()
        conn.execute(
            "INSERT INTO urls (short_code, original_url) VALUES (?, ?)",
            (short_code, original_url),
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False


def get_original_url(short_code: str) -> str | None:
    """Return the original URL for a given short code, or None if not found."""
    conn = get_connection()
    row = conn.execute(
        "SELECT original_url FROM urls WHERE short_code = ?", (short_code,)
    ).fetchone()
    conn.close()
    return row["original_url"] if row else None


def short_code_exists(short_code: str) -> bool:
    conn = get_connection()
    row = conn.execute(
        "SELECT 1 FROM urls WHERE short_code = ?", (short_code,)
    ).fetchone()
    conn.close()
    return row is not None
