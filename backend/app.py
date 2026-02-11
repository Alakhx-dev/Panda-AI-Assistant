import os
import re
import io
import json
import time
import platform

import google.generativeai as genai
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from PIL import Image
import pytesseract
from youtube_transcript_api import YouTubeTranscriptApi

# ─── Configuration ──────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, "users.json")

# Gemini API Key – from environment (never hardcoded)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ GEMINI_API_KEY loaded successfully.")
else:
    print("⚠️  WARNING: GEMINI_API_KEY not found in environment.")
    print("   Set it with: $env:GEMINI_API_KEY='your-key-here'")

# Model – gemini-2.0-flash (supports both text and vision)
model = genai.GenerativeModel("gemini-2.0-flash")

# Pytesseract – auto-discover on Windows
if platform.system() == "Windows":
    for _path in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ]:
        if os.path.exists(_path):
            pytesseract.pytesseract.tesseract_cmd = _path
            print(f"✅ Tesseract found: {_path}")
            break

# ─── Flask App ──────────────────────────────────────────────────────────────

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static",
)
app.secret_key = "your_secret_key_here"
CORS(app)

# ─── Helpers: Users ─────────────────────────────────────────────────────────

def load_users():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w") as f:
            json.dump({}, f)
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

# ─── Helpers: YouTube ──────────────────────────────────────────────────────

def get_video_id(url):
    match = re.search(r"(?:v=|/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else None

def get_transcript_text(url):
    video_id = get_video_id(url)
    if not video_id:
        return None
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        parts = [item.get("text", "") for item in transcript]
        text = " ".join(part for part in parts if part).strip()
        return text or None
    except Exception as e:
        print(f"   Transcript fetch failed: {e}")
        return None

# ─── Helpers: Gemini AI (with retry for rate limits) ───────────────────────

def gemini_generate(prompt, max_retries=3):
    """
    Call Gemini with automatic retry on rate-limit errors.
    Supports both text prompts and multimodal (image) prompts.
    """
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return getattr(response, "text", None)
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str or "resource" in error_str:
                wait_time = (attempt + 1) * 15  # 15s, 30s, 45s
                print(f"   ⏳ Rate limited (attempt {attempt+1}/{max_retries}), waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"   Gemini error: {e}")
                return None
    print("   ❌ Max retries reached.")
    return None

def generate_summary(text):
    if not text or len(text.strip()) < 10:
        return None
    return gemini_generate(
        f"Summarize the following text clearly and concisely:\n\n{text}"
    )

def generate_solution(question):
    if not question or len(question.strip()) < 3:
        return None
    return gemini_generate(
        f"Solve this question with a detailed step-by-step explanation:\n\n{question}"
    )

def generate_image_summary_and_notes(text):
    if not text or len(text.strip()) < 10:
        return None
    return gemini_generate(
        "From the following extracted text, generate TWO sections:\n\n"
        "## Short Summary\n"
        "Provide a brief, 2-3 sentence summary of the content.\n\n"
        "## Student-Friendly Notes\n"
        "Provide detailed, easy-to-understand notes using bullet points "
        "that a student can use for revision.\n\n"
        f"--- Extracted Text ---\n{text}"
    )

def generate_image_summary_vision(pil_image):
    """
    Use Gemini Vision to directly analyze the image.
    This bypasses OCR entirely and sends the image to Gemini.
    """
    prompt = [
        "Analyze this image and generate TWO sections:\n\n"
        "## Short Summary\n"
        "Provide a brief, 2-3 sentence summary of what the image contains.\n\n"
        "## Student-Friendly Notes\n"
        "Provide detailed, easy-to-understand notes using bullet points "
        "that a student can use for revision.\n\n"
        "If the image contains text, formulas, diagrams, or any educational content, "
        "extract and explain it clearly.",
        pil_image,
    ]
    return gemini_generate(prompt)

def generate_notes_from_text(text):
    if not text or len(text.strip()) < 10:
        return None
    return gemini_generate(
        "Generate detailed student-friendly study notes from this text. "
        "Use headings and bullet points:\n\n" + text
    )

def generate_youtube_fallback_summary(url):
    return gemini_generate(
        f"The following is a YouTube video URL: {url}\n\n"
        "I could not retrieve the video transcript. "
        "Based on the URL, provide a brief general summary of what this "
        "video might be about. If you cannot determine the content, say so clearly."
    )

# ─── Helpers: Image ────────────────────────────────────────────────────────

def open_uploaded_image(image_file):
    """Open an uploaded image file. Returns (PIL.Image, error_string)."""
    try:
        image_bytes = io.BytesIO(image_file.read())
        image = Image.open(image_bytes)
        image.load()  # Force load so errors happen now
        return image, None
    except Exception as e:
        print(f"   Image open error: {e}")
        return None, "Failed to open the uploaded image. Please upload a valid image file."

def extract_text_ocr(pil_image):
    """Run OCR on a PIL image. Returns extracted text or empty string."""
    try:
        return pytesseract.image_to_string(pil_image).strip()
    except Exception as e:
        print(f"   OCR error: {e}")
        return ""

# ─── Response Builders ─────────────────────────────────────────────────────

def success_response(summary):
    return jsonify({"summary": summary, "error": None})

def error_response(message, status=400):
    return jsonify({"summary": None, "error": message}), status

# ─── Base Route ─────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

# ─── Auth Routes ────────────────────────────────────────────────────────────

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm  = request.form.get("confirm_password")

        if not username or not password or password != confirm:
            return render_template("signup.html", error="Invalid input or passwords do not match")

        users = load_users()
        if username in users:
            return render_template("signup.html", error="Username already exists")

        users[username] = password
        save_users(users)
        session["user"] = username
        return redirect(url_for("home"))

    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        users = load_users()
        if username in users and users[username] == password:
            session["user"] = username
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error="Invalid username or password")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# ─── Page Routes ────────────────────────────────────────────────────────────

@app.route("/home")
def home():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("home.html")

@app.route("/summary")
def summary():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("summary.html")

@app.route("/solution")
def solution():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("solution.html")

@app.route("/notes")
def notes():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("notes.html")

# ─── API: Upload Image ─────────────────────────────────────────────────────

@app.route("/upload-image", methods=["POST"])
def upload_image():
    """
    POST /upload-image
    Strategy:
      1. Open the image
      2. Try Gemini Vision (direct image → AI analysis) — best quality
      3. Fallback: OCR text → Gemini text summary
      4. Retry automatically on rate-limit errors
    """
    if "image" not in request.files:
        return error_response("Please upload an image.")

    image_file = request.files["image"]
    if image_file.filename == "":
        return error_response("Please upload an image.")

    # Step 1: Open the image
    pil_image, err = open_uploaded_image(image_file)
    if err:
        return error_response(err)

    # Step 2: Try Gemini Vision (send image directly to AI)
    print("   🖼️ Trying Gemini Vision...")
    try:
        result = generate_image_summary_vision(pil_image)
        if result:
            return success_response(result)
    except Exception as e:
        print(f"   Vision attempt failed: {e}")

    # Step 3: Fallback to OCR → Gemini text
    print("   📝 Falling back to OCR...")
    extracted_text = extract_text_ocr(pil_image)
    if not extracted_text or len(extracted_text) < 10:
        return error_response("Image is blurry or unreadable.")

    try:
        result = generate_image_summary_and_notes(extracted_text)
    except Exception as e:
        print(f"   Fallback error: {e}")
        return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)

    if not result:
        return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)

    return success_response(result)

# ─── API: Solve Question ───────────────────────────────────────────────────

@app.route("/solve-question", methods=["POST"])
def solve_question():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return error_response("Please provide a question.")

    result = generate_solution(question)
    if not result:
        return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)

    return success_response(result)

# ─── API: YouTube Process ──────────────────────────────────────────────────

@app.route("/youtube-process", methods=["POST"])
def youtube_process():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not url:
        return error_response("Please provide a YouTube link.")

    # Try transcript first
    transcript_text = get_transcript_text(url)

    if transcript_text:
        result = generate_summary(transcript_text)
    else:
        # Fallback: ask Gemini to summarize from URL
        print(f"   Transcript unavailable, using fallback for: {url}")
        result = generate_youtube_fallback_summary(url)

    if not result:
        return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)

    return success_response(result)

# ─── API: Generate Notes ───────────────────────────────────────────────────

@app.route("/generate-notes", methods=["POST"])
def generate_notes_endpoint():
    # Path A: Image uploaded
    if "image" in request.files and request.files["image"].filename:
        image_file = request.files["image"]
        pil_image, err = open_uploaded_image(image_file)
        if err:
            return error_response(err)

        extracted_text = extract_text_ocr(pil_image)
        if not extracted_text or len(extracted_text) < 10:
            return error_response("Image is blurry or unreadable.")

        result = generate_notes_from_text(extracted_text)
        if not result:
            return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)
        return success_response(result)

    # Path B: YouTube URL
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not url:
        return error_response("Please provide an image or YouTube link.")

    transcript_text = get_transcript_text(url)
    source_text = transcript_text or generate_youtube_fallback_summary(url)

    if not source_text:
        return error_response("Could not retrieve content. Please check input and try again.")

    result = generate_notes_from_text(source_text)
    if not result:
        return error_response("AI service temporarily busy. Please wait a moment and try again.", 503)

    return success_response(result)

# ─── Run ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
