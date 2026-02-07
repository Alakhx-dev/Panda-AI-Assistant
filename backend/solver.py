from llm_client import get_llm_client


SOLVER_SYSTEM = (
    "You are a precise exam solver. Provide step-by-step solutions and final answers."
)


def solve_question(question: str):
    client = get_llm_client()
    prompt = (
        "Solve the following question. Provide:\n"
        "1) Step-by-step solution\n"
        "2) Explanation suitable for exams\n"
        "3) Final answer clearly labeled\n\n"
        f"Question:\n{question}"
    )
    response = client.generate(SOLVER_SYSTEM, prompt)
    return {"solution": response}
