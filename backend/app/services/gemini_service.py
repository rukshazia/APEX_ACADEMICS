import logging
from typing import Optional, List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback models in order of trial if default encounters temporary outage
FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemma-4-26b-a4b-it"
]

def get_gemini_client():
    """Initializes and returns Google GenAI client if GEMINI_API_KEY is configured."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client: {e}")
        return None


def is_gemini_available() -> bool:
    """Checks whether Gemini API is configured with an active key."""
    return bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)


def generate_gemini_response(
    prompt: str,
    system_instruction: Optional[str] = None,
    preferred_model: Optional[str] = None
) -> Optional[str]:
    """
    Generates text using Google Gemini with automatic model fallback.
    Never exposes or logs the API key.
    """
    client = get_gemini_client()
    if not client:
        return None

    target_model = preferred_model or settings.GEMINI_MODEL

    models_to_try = [target_model] + [m for m in FALLBACK_MODELS if m != target_model]

    for model_name in models_to_try:
        try:
            full_prompt = prompt
            if system_instruction:
                full_prompt = f"System Instruction: {system_instruction}\n\nTask:\n{prompt}"

            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini generation failed for model {model_name}: {type(e).__name__}")
            continue

    return None


def generate_ask_data_insight(
    question: str,
    role: str,
    context_facts: List[str],
    metrics_summary: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Grounded academic query answering using Google Gemini.
    Synthesizes conversational insights based strictly on institutional database records.
    """
    if not is_gemini_available():
        return None

    facts_text = "\n".join(f"- {fact}" for fact in context_facts)
    metrics_text = ", ".join(f"{k}: {v}" for k, v in metrics_summary.items())

    system_prompt = (
        "You are the Apex Academics AI Academic Advisor & Institutional Analytics Specialist. "
        "Your task is to provide clear, helpful, supportive, and professional answers to questions "
        "from students, faculty, department heads, and campus leadership. "
        "STRICT RULES:\n"
        "1. Base your answer strictly on the provided Institutional Database Facts and Metrics.\n"
        "2. Do not invent marks, percentages, or attendance sessions that are not listed.\n"
        "3. Provide supportive, actionable next steps where relevant.\n"
        "4. Keep the tone encouraging, concise (2-4 paragraphs maximum), and well-formatted."
    )

    user_prompt = (
        f"User Role: {role.upper()}\n"
        f"User Question: \"{question}\"\n\n"
        f"Institutional Database Facts:\n{facts_text if facts_text else 'No specific logs found.'}\n\n"
        f"Summary Metrics: {metrics_text if metrics_text else 'None'}\n\n"
        f"Provide a clear, contextually accurate answer answering the user's question directly."
    )

    answer_text = generate_gemini_response(user_prompt, system_instruction=system_prompt)
    if not answer_text:
        return None

    return {
        "question": question,
        "answer": answer_text,
        "provider": f"Google Gemini ({settings.GEMINI_MODEL})",
        "metrics": metrics_summary,
        "confidence": "high",
        "evidence": context_facts
    }


def generate_ai_intervention_strategy(
    student_name: str,
    roll_number: str,
    department: str,
    risk_score: Optional[float],
    risk_category: str,
    evidence_points: List[str]
) -> Optional[Dict[str, Any]]:
    """
    Generates an AI-assisted early intervention action plan using Google Gemini.
    """
    if not is_gemini_available():
        return None

    evidence_text = "\n".join(f"- {e}" for e in evidence_points)

    system_prompt = (
        "You are an expert Academic Success Coordinator at a collegiate university. "
        "Formulate a humane, evidence-based academic support plan for an at-risk student. "
        "Provide:\n"
        "1. Intervention Title (concise, e.g. 'Attendance & Core Algorithm Remediation Plan')\n"
        "2. Core Goal (1-2 sentences with measurable target)\n"
        "3. Action Steps (3 actionable steps for faculty and student)\n"
        "4. Suggested Timeline (e.g. 14 days with 7-day milestone check)"
    )

    user_prompt = (
        f"Student: {student_name} ({roll_number})\n"
        f"Department: {department}\n"
        f"Overall Risk Score: {risk_score}/100 ({risk_category})\n"
        f"Identified Evidence & Warning Indicators:\n{evidence_text}\n\n"
        f"Generate the academic intervention recommendation."
    )

    result_text = generate_gemini_response(user_prompt, system_instruction=system_prompt)
    if not result_text:
        return None

    return {
        "student_name": student_name,
        "risk_category": risk_category,
        "ai_strategy": result_text,
        "provider": f"Google Gemini ({settings.GEMINI_MODEL})"
    }
