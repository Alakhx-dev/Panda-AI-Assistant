import os
import re
import hashlib
import mimetypes
import ast
import operator
import json
import requests
import easyocr
from urllib.parse import urlparse
from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, make_response
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key
CORS(app)

HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
if not HUGGINGFACE_API_KEY:
    raise ValueError("HUGGINGFACE_API_KEY environment variable is not set")

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

topics = ["mathematics", "physics", "chemistry", "biology", "history", "literature"]

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

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def guess_content_type(filename: str) -> str:
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or ""

def summarize_text(text: str) -> str:
    """Summarize text using Hugging Face facebook/bart-large-cnn model."""
    url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    payload = {"inputs": text, "parameters": {"max_length": 150, "min_length": 30}}
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        result = response.json()
        if isinstance(result, list) and result:
            return result[0].get("summary_text", "")
    return ""

def generate_mcqs(summary: str):
    """Generate MCQs from summary using Hugging Face iarfmoose/t5-base-question-generator."""
    url = "https://api-inference.huggingface.co/models/iarfmoose/t5-base-question-generator"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    # Generate questions from summary
    payload = {"inputs": f"generate questions: {summary}", "parameters": {"max_length": 100}}
    response = requests.post(url, headers=headers, json=payload)
    mcqs = []
    if response.status_code == 200:
        result = response.json()
        if isinstance(result, list) and result:
            generated_text = result[0].get("generated_text", "")
            # Parse generated text to extract questions and answers
            # Assuming format like "Question: ... Answer: ..."
            lines = generated_text.split('\n')
            questions = []
            answers = []
            for line in lines:
                if line.startswith("Question:"):
                    questions.append(line.replace("Question:", "").strip())
                elif line.startswith("Answer:"):
                    answers.append(line.replace("Answer:", "").strip())
            # Create MCQs with options
            for i, q in enumerate(questions[:5]):  # Limit to 5 MCQs
                correct_answer = answers[i] if i < len(answers) else "Unknown"
                # Generate distractors from summary words
                words = summary.split()
                distractors = [w for w in words if w.lower() != correct_answer.lower()][:3]
                if len(distractors) < 3:
                    distractors.extend(["Option A", "Option B", "Option C"][:3-len(distractors)])
                options = [correct_answer] + distractors
                import random
                random.shuffle(options)
                mcqs.append({
                    "question": q,
                    "options": options,
                    "answer": correct_answer
                })
    return mcqs

_ALLOWED_AST_NODES = {
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Pow,
    ast.Mod,
    ast.USub,
    ast.UAdd,
    ast.Constant,
    ast.FloorDiv,
    ast.LShift,
    ast.RShift,
    ast.BitOr,
    ast.BitAnd,
    ast.BitXor,
}

_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.BitOr: operator.or_,
    ast.BitAnd: operator.and_,
    ast.BitXor: operator.xor,
    ast.LShift: operator.lshift,
    ast.RShift: operator.rshift,
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}

def extract_math_expression(text: str) -> str | None:
    matches = re.findall(r"[0-9\.\+\-\*\/\%\(\)\^\|\&\<\>]+", text)
    if not matches:
        return None
    candidate = max(matches, key=len)
    if re.search(r"\d", candidate) is None:
        return None
    return candidate.replace("^", "**")

def safe_eval_expr(expression: str):
    def _eval(node):
        if type(node) not in _ALLOWED_AST_NODES:
            raise ValueError("unsupported_expression")
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError("unsupported_constant")
        if isinstance(node, ast.UnaryOp):
            op = _OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError("unsupported_operator")
            return op(_eval(node.operand))
        if isinstance(node, ast.BinOp):
            op = _OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError("unsupported_operator")
            return op(_eval(node.left), _eval(node.right))
        raise ValueError("unsupported_node")

    parsed = ast.parse(expression, mode="eval")
    return _eval(parsed)

def build_solution(question: str):
    expression = extract_math_expression(question)
    if expression:
        try:
            value = safe_eval_expr(expression)
            return {
                "steps": [f"expression={expression}", f"result={value}"],
                "final_answer": str(value),
            }
        except Exception:
            pass
    return {
        "steps": [f"question={question}", f"length={len(question)}"],
        "final_answer": "",
    }



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
    if "image" not in request.files:
        return jsonify({"summary": None, "mcqs": [], "error": "Image not found"}), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({"summary": None, "mcqs": [], "error": "Empty filename"}), 400

    # Save image temporarily for OCR
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
        image.save(temp_file.name)
        temp_path = temp_file.name

    try:
        # Perform OCR
        results = reader.readtext(temp_path)
        extracted_text = ' '.join([text for _, text, _ in results]).strip()

        if not extracted_text or len(extracted_text) < 10:
            return jsonify({"summary": None, "mcqs": [], "error": "Unable to extract readable text from image."}), 400

        # Summarize the extracted text
        summary = summarize_text(extracted_text)
        if not summary:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate summary."}), 500

        # Generate MCQs from summary
        mcqs = generate_mcqs(summary)

        return jsonify({
            "summary": summary,
            "mcqs": mcqs,
            "error": None
        })
    finally:
        import os
        os.unlink(temp_path)

@app.route('/solve-question', methods=['POST'])
def solve_question():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"status": "error", "message": "No question provided"}), 400

    question = data['question']
    solution = build_solution(question)

    return jsonify({
        "solution": solution
    })

@app.route('/youtube-process', methods=['POST'])
def youtube_process():
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

        if not transcript_text:
            return jsonify({"summary": None, "mcqs": [], "error": "Transcript not available for this video."}), 400

        # Summarize the transcript
        summary = summarize_text(transcript_text)
        if not summary:
            return jsonify({"summary": None, "mcqs": [], "error": "Failed to generate summary."}), 500

        # Generate MCQs from summary
        mcqs = generate_mcqs(summary)

        response_payload = {
            "summary": summary,
            "mcqs": mcqs,
            "error": None
        }
        if data.get("include_notes"):
            # For notes, perhaps include some metadata, but since task doesn't specify, keep minimal
            response_payload["notes"] = [f"video_id={video_id}", f"url={url}"]
        return jsonify(response_payload)
    except Exception as e:
        return jsonify({"summary": None, "mcqs": [], "error": "Transcript not available for this video."}), 400



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
    app.run(debug=True)
            
