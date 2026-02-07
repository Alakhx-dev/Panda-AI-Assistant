from llm_client import get_llm_client


SUMMARY_SYSTEM = (
    "You are an expert tutor. Create clear, concise summaries for exam prep."
)


def generate_summary(text: str) -> str:
    client = get_llm_client()
    prompt = (
        "Summarize the following study material in 6-10 bullet points. "
        "Keep language simple and exam-ready.\n\n"
        f"{text}"
    )
    return client.generate(SUMMARY_SYSTEM, prompt)
