import os


class LLMClient:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        if not self.openai_key and not self.gemini_key:
            raise RuntimeError("Missing API key. Set OPENAI_API_KEY or GEMINI_API_KEY in .env")

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if self.openai_key:
            return self._generate_openai(system_prompt, user_prompt)
        return self._generate_gemini(system_prompt, user_prompt)

    def _generate_openai(self, system_prompt: str, user_prompt: str) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=self.openai_key)
        response = client.chat.completions.create(
            model=self.openai_model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content.strip()

    def _generate_gemini(self, system_prompt: str, user_prompt: str) -> str:
        import google.generativeai as genai

        genai.configure(api_key=self.gemini_key)
        model = genai.GenerativeModel(self.gemini_model, system_instruction=system_prompt)
        response = model.generate_content(user_prompt)
        return response.text.strip()


_CLIENT = None


def get_llm_client() -> LLMClient:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = LLMClient()
    return _CLIENT
