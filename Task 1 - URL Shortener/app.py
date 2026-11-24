import random
import string
from urllib.parse import urlparse

from flask import Flask, jsonify, redirect, render_template, request

from database import get_original_url, init_db, save_url, short_code_exists

app = Flask(__name__)

# Initialize database schema on startup (needed for Gunicorn / production)
init_db()

# ── helpers ──────────────────────────────────────────────────────────────────

def _generate_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def _make_unique_code() -> str:
    for _ in range(10):          # up to 10 retries
        code = _generate_code()
        if not short_code_exists(code):
            return code
    raise RuntimeError("Could not generate a unique short code – try again.")


def _is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


# ── routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/shorten", methods=["POST"])
def shorten():
    data = request.get_json(silent=True) or {}
    original_url = (data.get("url") or "").strip()

    if not original_url:
        return jsonify({"error": "URL is required."}), 400

    if not _is_valid_url(original_url):
        return jsonify({"error": "Invalid URL. Make sure it starts with http:// or https://"}), 400

    try:
        short_code = _make_unique_code()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    if not save_url(short_code, original_url):
        return jsonify({"error": "Failed to save URL. Please try again."}), 500

    short_url = request.host_url.rstrip("/") + "/" + short_code
    return jsonify({"short_url": short_url, "short_code": short_code}), 201


@app.route("/<short_code>")
def redirect_to_original(short_code):
    original_url = get_original_url(short_code)
    if original_url is None:
        return render_template("404.html", short_code=short_code), 404
    return redirect(original_url, code=302)


# ── entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
