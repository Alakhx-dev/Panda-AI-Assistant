import os
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

genai.configure(api_key=API_KEY)

MODEL_NAME = "models/gemini-1.5-flash"

model = genai.GenerativeModel(MODEL_NAME)

import re
import json
import io
from google.api_core.exceptions import NotFound
from flask import Flask, request, jsonify, render_template, session, redirect, make_response
from flask_cors import CORS
import pytesseract
from PIL import Image

app = Flask(__name__, static_folder='static', template_folder='templates', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key
CORS(app)

# Explicitly set Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"

USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def get_video_id(url):
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    return match.group(1) if match else None

def gemini_chat(prompt: str) -> str:
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except NotFound:
        raise Exception("AI Model configuration error. Please update the SDK.")
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def summarize_text(text: str) -> str:
    prompt = (
        "Summarize this for a student in short, clear bullet points.\n\n"
        f"{text}"
    )
    return gemini_chat(prompt)

def answer_question_text(question: str) -> str:
    return gemini_chat(question)

def summarize_youtube_fallback(url: str) -> str:
    prompt = f"The transcript is unavailable, please provide a general summary based on this URL and its title: {url}"
    return gemini_chat(prompt)

@app.route('/')
def index():
    return "Backend is Running"

@app.route('/image')
def image():
    return render_template('image.html')

@app.route('/question')
def question():
    return render_template('question.html')

@app.route('/youtube')
def youtube():
    return render_template('youtube.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    else:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        users = load_users()
        if username in users and users[username] == password:
            session['username'] = username
            return jsonify({'success': True})
        else:
            return jsonify({'success': False})

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        return render_template('signup.html')
    else:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'success': False})
        users = load_users()
        if username in users:
            return jsonify({'success': False})
        users[username] = password
        save_users(users)
        return jsonify({'success': True})

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        if "image" not in request.files:
            return jsonify({"summary": None, "error": "Image not found"}), 400

        image = request.files["image"]

        if image.filename == "":
            return jsonify({"summary": None, "error": "Empty filename"}), 400

        # Process image in memory using io.BytesIO
        image_bytes = io.BytesIO(image.read())
        img = Image.open(image_bytes)
        extracted_text = pytesseract.image_to_string(img).strip()

        if len(extracted_text) < 10:
            return jsonify({"summary": None, "error": "Image text unreadable. Please upload a clearer photo."})

        summary = summarize_text(extracted_text)
        return jsonify({
            "summary": summary,
            "error": None
        })
    except Exception as e:
        return jsonify({"summary": None, "error": f"Failed to process image: {str(e)}"}), 500

@app.route('/solve-question', methods=['POST'])
def solve_question():
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"summary": None, "error": "No question provided"}), 400

        question = data['question'].strip()
        if not question:
            return jsonify({"summary": None, "error": "No question provided"}), 400

        summary = answer_question_text(question)
        return jsonify({
            "summary": summary,
            "error": None
        })
    except Exception as e:
        return jsonify({"summary": None, "error": f"Failed to process question: {str(e)}"}), 500

@app.route('/youtube-process', methods=['POST'])
def youtube_process():
    try:
        data = request.get_json()

        if not data or "url" not in data:
            return jsonify({"summary": None, "error": "URL missing"}), 400

        url = data["url"]
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({"summary": None, "error": "Invalid YouTube URL"}), 400

        transcript_text = None
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = ' '.join([item['text'] for item in transcript_list]).strip()
        except Exception:
            # Fallback to Gemini
            summary = summarize_youtube_fallback(url)
            return jsonify({
                "summary": summary,
                "error": None
            })

        if not transcript_text:
            # Fallback to Gemini
            summary = summarize_youtube_fallback(url)
            return jsonify({
                "summary": summary,
                "error": None
            })

        summary = summarize_text(transcript_text)
        return jsonify({
            "summary": summary,
            "error": None
        })
    except Exception as e:
        return jsonify({"summary": None, "error": f"Failed to process YouTube request: {str(e)}"}), 500

@app.route('/home')
def home():
    if 'username' not in session:
        return redirect('/')
    return render_template('home.html')

@app.route('/summary')
def summary():
    if 'username' not in session:
        return redirect('/')
    return render_template('summary.html')

@app.route('/solution')
def solution():
    if 'username' not in session:
        return redirect('/')
    return render_template('solution.html')

@app.route('/notes')
def notes():
    if 'username' not in session:
        return redirect('/')
    return render_template('notes.html')

@app.route('/logout')
def logout():
    session.clear()
    response = make_response(redirect('/signup'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
