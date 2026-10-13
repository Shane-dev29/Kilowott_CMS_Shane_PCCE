import os
from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from app.config import settings

def get_llm() -> Optional[BaseChatModel]:
    """
    Initializes and returns the configured LLM based on environment variables.
    Returns None if LLM_API_KEY is not configured or LLM is set to mock/offline.
    """
    provider = (settings.LLM_PROVIDER or "").lower().strip()
    api_key = (settings.LLM_API_KEY or "").strip()
    model = settings.LLM_MODEL or "gpt-4o-mini"
    base_url = settings.LLM_BASE_URL

    if not api_key:
        return None

    try:
        if provider == "openai":
            kwargs = {"api_key": api_key, "model": model, "temperature": 0.1}
            if base_url:
                kwargs["base_url"] = base_url
            return ChatOpenAI(**kwargs)

        elif provider == "groq":
            groq_base_url = base_url or "https://api.groq.com/openai/v1"
            groq_model = model if model != "gpt-4o-mini" else "llama-3.3-70b-versatile"
            return ChatOpenAI(api_key=api_key, model=groq_model, base_url=groq_base_url, temperature=0.1)

        elif provider == "openrouter":
            openrouter_base_url = base_url or "https://openrouter.ai/api/v1"
            return ChatOpenAI(api_key=api_key, model=model, base_url=openrouter_base_url, temperature=0.1)

        elif provider == "ollama":
            ollama_base_url = base_url or "http://localhost:11434/v1"
            return ChatOpenAI(api_key=api_key or "ollama", model=model, base_url=ollama_base_url, temperature=0.1)

        else:
            # Generic OpenAI-compatible fallback
            kwargs = {"api_key": api_key, "model": model, "temperature": 0.1}
            if base_url:
                kwargs["base_url"] = base_url
            return ChatOpenAI(**kwargs)
    except Exception as e:
        print(f"Error initializing LLM provider '{provider}': {e}")
        return None
