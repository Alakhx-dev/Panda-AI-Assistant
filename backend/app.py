import os
import re
import hashlib
import mimetypes
import ast
import operator
import json
from urllib.parse import urlparse
from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key
CORS(app)

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

def build_image_summary(filename: str, content_type: str, size_bytes: int, digest: str) -> str:
    return f"filename={filename};content_type={content_type};bytes={size_bytes};sha256={digest}"

def build_image_mcqs(filename: str, content_type: str, size_bytes: int, digest: str):
    digest_prefix = digest[:12]
    return [
        {
            "question": "Which value matches the file size in bytes?",
            "options": [str(size_bytes), filename, content_type, digest_prefix],
            "answer": str(size_bytes),
        },
        {
            "question": "Which value matches the SHA-256 prefix?",
            "options": [digest_prefix, filename, content_type, str(size_bytes)],
            "answer": digest_prefix,
        },
    ]

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

def build_youtube_payload(url: str):
    parsed = urlparse(url)
    video_id = get_video_id(url) or ""
    digest = sha256_hex(url.encode())
    summary = (
        "url="
        + url
        + ";host="
        + (parsed.hostname or "")
        + ";path="
        + (parsed.path or "")
        + ";video_id="
        + video_id
        + ";sha256="
        + digest
    )
    mcqs = [
        {
            "question": "Which value matches the video_id?",
            "options": [video_id, parsed.hostname or "", parsed.path or "", digest[:12]],
            "answer": video_id,
        },
        {
            "question": "Which value matches the URL host?",
            "options": [parsed.hostname or "", video_id, parsed.path or "", digest[:12]],
            "answer": parsed.hostname or "",
        },
    ]
    notes = [
        f"url={url}",
        f"host={parsed.hostname or ''}",
        f"path={parsed.path or ''}",
        f"video_id={video_id}",
        f"sha256={digest}",
    ]
    return summary, mcqs, notes

@app.route('/')
def index():
    if 'username' in session:
        return redirect('/home')
    return render_template('index.html')

@app.route('/image')
def image():
    return render_template('image.html')

@app.route('/question')
def question():
    return render_template('question.html')

@app.route('/youtube')
def youtube():
    return render_template('youtube.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "Image not found"}), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filename = image.filename
    content_type = guess_content_type(filename)
    size_bytes = len(image.read())
    image.seek(0)  # Reset file pointer
    digest = sha256_hex(image.read())
    image.seek(0)

    summary = build_image_summary(filename, content_type, size_bytes, digest)
    mcqs = build_image_mcqs(filename, content_type, size_bytes, digest)

    return jsonify({
        "summary": summary,
        "mcqs": mcqs
    })

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
        return jsonify({"error": "URL missing"}), 400

    url = data["url"]
    summary, mcqs, notes = build_youtube_payload(url)

    return jsonify({
        "summary": summary,
        "mcqs": mcqs,
        "notes": notes
    })

@app.route('/signup', methods=['POST'])
def signup_post():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    users = load_users()
    if username in users:
        return jsonify({"error": "User already exists"}), 400
    users[username] = password
    save_users(users)
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login_post():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    users = load_users()
    if username not in users or users[username] != password:
        return jsonify({"error": "Invalid credentials"}), 401
    session['username'] = username
    return jsonify({"message": "Login successful"}), 200

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
    session.pop('username', None)
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)
            