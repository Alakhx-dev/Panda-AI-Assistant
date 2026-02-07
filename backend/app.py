import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from ocr import extract_text_from_image
from summarizer import generate_summary
from mcq_generator import generate_mcqs
from solver import solve_question
from youtube_processor import process_youtube_link
from utils import allowed_file, save_upload, validate_youtube_url


def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(app)

    app.config["UPLOAD_FOLDER"] = os.path.abspath(os.path.join(os.getcwd(), "..", "uploads"))
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    @app.route("/upload-image", methods=["POST"])
    def upload_image():
        if "image" not in request.files:
            return jsonify({"error": "Image file is required."}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No file selected."}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only jpg and png are allowed."}), 400

        image_path = save_upload(file, app.config["UPLOAD_FOLDER"])
        text = extract_text_from_image(image_path)
        if not text.strip():
            return jsonify({"error": "No readable text found in the image."}), 422

        summary = generate_summary(text)
        mcqs = generate_mcqs(text, num_questions=7)

        return jsonify({"summary": summary, "mcqs": mcqs}), 200

    @app.route("/solve-question", methods=["POST"])
    def solve_question_route():
        question_text = ""
        if "question" in request.form and request.form["question"].strip():
            question_text = request.form["question"].strip()

        if "image" in request.files and request.files["image"].filename:
            file = request.files["image"]
            if not allowed_file(file.filename):
                return jsonify({"error": "Invalid file type. Only jpg and png are allowed."}), 400
            image_path = save_upload(file, app.config["UPLOAD_FOLDER"])
            ocr_text = extract_text_from_image(image_path)
            question_text = f"{question_text}\n{ocr_text}".strip()

        if not question_text:
            return jsonify({"error": "Provide a question text or image."}), 400

        solution = solve_question(question_text)
        return jsonify(solution), 200

    @app.route("/youtube-process", methods=["POST"])
    def youtube_process_route():
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()
        if not url:
            return jsonify({"error": "YouTube URL is required."}), 400
        if not validate_youtube_url(url):
            return jsonify({"error": "Invalid YouTube URL."}), 400

        result = process_youtube_link(url)
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result), 200

    @app.errorhandler(413)
    def file_too_large(_):
        return jsonify({"error": "File too large. Limit is 5MB."}), 413

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
