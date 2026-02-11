import os
import re
import io
import json

import google.generativeai as genai
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from PIL import Image
import pytesseract
from youtube_transcript_api import YouTubeTranscriptApi

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-flash")

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static",
)
app.secret_key = 'your_secret_key_here'  # Change this to a secure key in production
CORS(app)

def get_video_id(url):
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    return match.group(1) if match else None

def get_transcript_text(url):
    video_id = get_video_id(url)
    if not video_id:
        return None
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
    except Exception:
        return None
    parts = [item.get("text", "") for item in transcript]
    text = " ".join(part for part in parts if part).strip()
    return text or None

def generate_summary(text):
    if not text or len(text) < 30:
        return None
    try:
        response = model.generate_content(f"Summarize this text clearly:\n{text}")
        return getattr(response, "text", None)
    except Exception:
        return None

@app.route('/')
def home():
    if "user" not in session:
        return redirect(url_for("signup"))
    return redirect(url_for("summary"))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not username or not password or password != confirm_password:
            return render_template('signup.html', error="Invalid input or passwords do not match")

        with open('users.json', 'r') as f:
            users = json.load(f)

        if username in users:
            return render_template('signup.html', error="Username already exists")

        users[username] = password
        with open('users.json', 'w') as f:
            json.dump(users, f)

        session['user'] = username
        return redirect(url_for('summary'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        with open('users.json', 'r') as f:
            users = json.load(f)

        if username in users and users[username] == password:
            session['user'] = username
            return redirect(url_for('summary'))
        else:
            return render_template('login.html', error="Invalid username or password")

    return render_template('login.html')

@app.route('/summary')
def summary():
    if "user" not in session:
        return redirect(url_for("signup"))
    return render_template("summary.html")

def success_response(summary):
    return jsonify({"summary": summary, "error": None})

def error_response(message, status=400):
    return jsonify({"summary": None, "error": message}), status

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if "image" not in request.files:
        return error_response("Please upload an image.")

    image_file = request.files["image"]
    if image_file.filename == "":
        return error_response("Please upload an image.")

    try:
        image_bytes = io.BytesIO(image_file.read())
        image = Image.open(image_bytes)
        extracted_text = pytesseract.image_to_string(image).strip()
    except Exception:
        extracted_text = ""

    if not extracted_text:
        return success_response(
            "Image summary is currently unavailable on the deployed version."
        )

    summary = generate_summary(extracted_text)
    if not summary:
        return success_response(
            "Image summary is currently unavailable on the deployed version."
        )

    return success_response(summary)

@app.route('/youtube-process', methods=['POST'])
def youtube_process():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not url:
        return error_response("Please provide a YouTube link.")

    transcript_text = get_transcript_text(url)
    if not transcript_text:
        return success_response(
            "YouTube summary is temporarily unavailable on the deployed version."
        )

    summary = generate_summary(transcript_text)
    if not summary:
        return success_response(
            "YouTube summary is temporarily unavailable on the deployed version."
        )

    return success_response(summary)

if __name__ == '__main__':
    debug_enabled = os.getenv("DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5000, debug=debug_enabled)
