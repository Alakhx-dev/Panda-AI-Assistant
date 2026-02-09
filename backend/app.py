import os
import re
import json
import openai
from flask import Flask, request, jsonify, render_template, session, redirect, make_response
from flask_cors import CORS
import pytesseract
from PIL import Image

app = Flask(__name__, static_folder='static', template_folder='templates', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")

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

def openai_chat(prompt: str) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    return response.choices[0].message["content"].strip()

def summarize_text(text: str) -> str:
    prompt = (
        "Summarize the following text in 100-150 words:\n\n"
        f"{text}"
    )
    return openai_chat(prompt)

def answer_question_text(question: str) -> str:
    return openai_chat(question)

def generate_mcqs(summary: str):
    prompt = (
        "Generate up to 5 MCQs from the following summary. "
        "Return a JSON array of objects, each with keys: "
        "question, options (array of 4 strings), and answer (correct option text).\n\n"
        f"{summary}"
    )
    generated_text = openai_chat(prompt)
    mcqs = json.loads(generated_text)
    if isinstance(mcqs, list):
        return mcqs[:5]
    return []



@app.route('/')
def index():
    if 'username' in session:
        return redirect('/home')
    return redirect('/signup')

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
            return jsonify({"summary": None, "mcqs": [], "error": "Image not found"}), 400

        image = request.files["image"]

        if image.filename == "":
            return jsonify({"summary": None, "mcqs": [], "error": "Empty filename"}), 400

        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            image.save(temp_file.name)
            temp_path = temp_file.name

        try:
            img = Image.open(temp_path)
            extracted_text = pytesseract.image_to_string(img).strip()

            if not extracted_text:
                return jsonify({"summary": None, "mcqs": [], "error": "No readable text found in image"}), 400

            summary = summarize_text(extracted_text)
            if not summary:
                return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate summary"}), 500

            mcqs = generate_mcqs(summary)
            if not mcqs:
                return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate MCQs"}), 500

            return jsonify({
                "summary": summary,
                "mcqs": mcqs,
                "error": None
            })
        finally:
            os.unlink(temp_path)
    except Exception:
        return jsonify({"summary": None, "mcqs": [], "error": "Failed to process image"}), 500

@app.route('/solve-question', methods=['POST'])
def solve_question():
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"summary": None, "mcqs": [], "error": "No question provided"}), 400

        question = data['question'].strip()
        if not question:
            return jsonify({"summary": None, "mcqs": [], "error": "No question provided"}), 400

        summary = answer_question_text(question)
        if not summary:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate answer"}), 500

        mcqs = generate_mcqs(summary)
        if not mcqs:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate MCQs"}), 500

        return jsonify({
            "summary": summary,
            "mcqs": mcqs,
            "error": None
        })
    except Exception:
        return jsonify({"summary": None, "mcqs": [], "error": "Failed to process question"}), 500

@app.route('/youtube-process', methods=['POST'])
def youtube_process():
    try:
        data = request.get_json()

        if not data or "url" not in data:
            return jsonify({"summary": None, "mcqs": [], "error": "URL missing"}), 400

        url = data["url"]
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({"summary": None, "mcqs": [], "error": "Invalid YouTube URL"}), 400

        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = ' '.join([item['text'] for item in transcript_list]).strip()
        except Exception:
            return jsonify({"summary": None, "mcqs": [], "error": "Transcript not available"}), 400

        if not transcript_text:
            return jsonify({"summary": None, "mcqs": [], "error": "Transcript not available"}), 400

        summary = summarize_text(transcript_text)
        if not summary:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate summary"}), 500

        mcqs = generate_mcqs(summary)
        if not mcqs:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate MCQs"}), 500

        return jsonify({
            "summary": summary,
            "mcqs": mcqs,
            "error": None
        })
    except Exception:
        return jsonify({"summary": None, "mcqs": [], "error": "Failed to process YouTube request"}), 500



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
    app.run(host='0.0.0.0', debug=True)
            
