from llm_client import get_llm_client
from utils import safe_parse_json


MCQ_SYSTEM = "You generate exam-style MCQs based on provided content."


def generate_mcqs(text: str, num_questions: int = 5):
    client = get_llm_client()
    prompt = (
        "Generate {n} multiple-choice questions (MCQs) from the content. "
        "Each MCQ must include question, 4 options, and the correct answer. "
        "Return ONLY valid JSON using this format:\n"
        "{{\"mcqs\":[{{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"...\"}}]}}\n\n"
        "Content:\n{content}"
    ).format(n=num_questions, content=text)

    raw = client.generate(MCQ_SYSTEM, prompt)
    data = safe_parse_json(raw)
    if data and "mcqs" in data:
        return data["mcqs"]

    return [
        {
            "question": "Unable to generate MCQs. Please try again.",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A",
        }
    ]
