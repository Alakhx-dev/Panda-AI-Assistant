from youtube_transcript_api import YouTubeTranscriptApi

from llm_client import get_llm_client
from mcq_generator import generate_mcqs
from summarizer import generate_summary
from utils import extract_video_id


NOTES_SYSTEM = "You create structured, exam-ready notes with headings and bullet points."


def _get_transcript(video_id: str) -> str:
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    return " ".join([item["text"] for item in transcript_list])


def _generate_notes(transcript: str) -> str:
    client = get_llm_client()
    prompt = (
        "Create detailed structured notes with headings and bullet points. "
        "Cover all key concepts and make it exam-ready.\n\n"
        f"{transcript}"
    )
    return client.generate(NOTES_SYSTEM, prompt)


def process_youtube_link(url: str):
    video_id = extract_video_id(url)
    if not video_id:
        return {"error": "Could not extract video ID."}

    try:
        transcript = _get_transcript(video_id)
    except Exception as exc:
        return {"error": f"Transcript error: {exc}"}

    summary = generate_summary(transcript)
    mcqs = generate_mcqs(transcript, num_questions=7)
    notes = _generate_notes(transcript)

    return {"summary": summary, "mcqs": mcqs, "notes": notes}
