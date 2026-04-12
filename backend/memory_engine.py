"""
memory_engine.py
----------------
Dynamic per-user memory bank backed by SQLite.

Responsibilities:
  - store_interaction_memory()  →  Decides what is worth remembering from each
                                   interaction and writes it to the DB.
                                   Also persists raw user message for future recall.
  - retrieve_memory_context()   →  Fetches the user's long-term memory facts AND
                                   their recent session chat history, formatting
                                   them as a single injectable prompt block.

Each user gets their own isolated set of memory rows keyed by user_id.
No cross-user data is ever mixed.
"""

from __future__ import annotations

import database
from datetime import datetime
import os
import threading
import requests

def sync_to_hindsight(user_id: str, content: str, role: str = "assistant", session_id: str = "default_session", msg_type: str = "chat"):
    """Asynchronously push raw user chat and raw documents to Hindsight API per-user bank via SDK"""
    if not content or not content.strip():
        return
        
    def run_sync():
        try:
            from hindsight_client import Hindsight
            hk = os.getenv("HINDSIGHT_API_KEY", "")
            hb = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
            bank_id = os.getenv("HINDSIGHT_BANK_ID", "1")
            
            if hk:
                client = Hindsight(api_key=hk, base_url=hb)
                meta = {
                    "user_id": str(user_id),
                    "conversation_id": str(session_id),
                    "role": str(role),
                    "type": str(msg_type)
                }
                client.retain(bank_id=bank_id, content=content, metadata=meta)
                print(f"[HINDSIGHT] Synced {msg_type} for user {user_id} (role: {role})")
        except Exception as e:
            print(f"[HINDSIGHT] Error: {e}")
    threading.Thread(target=run_sync, daemon=True).start()

def _add_memory(user_id: str, content: str, memory_type: str = "general"):
    """Wraps database.add_memory to isolate internal state from Hindsight."""
    database.add_memory(user_id, content, memory_type)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def retrieve_memory_context(user_id: str, session_id: str = None) -> str:
    """
    Return a formatted string combining:
      1. The user's long-term memory facts (orders, preferences, conditions).
      2. The most recent turns of the current session (short-term context).

    This is injected directly into the LLM system prompt so the agent can:
      - Personalise responses based on past behaviour.
      - Continue conversations naturally without losing context mid-session.

    Returns an empty string for GUEST users or when no data exists yet.
    """
    if not user_id or user_id == "GUEST":
        return ""

    parts = []

    # ── 1. Long-term memory facts (cross-session) ─────────────────────────────
    memories = database.get_memories(user_id, limit=15)
    if memories:
        fact_lines = []
        for mem in reversed(memories):           # oldest → newest for natural flow
            ts = mem.get("created_at", "")[:10]  # YYYY-MM-DD
            fact_lines.append(f"  [{ts}] ({mem['memory_type']}) {mem['content']}")
        parts.append("=== LONG-TERM USER MEMORY (facts learned from past sessions) ===\n" + "\n".join(fact_lines))

    # ── 2. Short-term context (current session chat turns) ────────────────────
    if session_id:
        recent = database.get_recent_session_messages(user_id, session_id, limit=12)
        if recent:
            turn_lines = []
            for msg in recent:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                turn_lines.append(f"  {role_label}: {msg['content']}")
            parts.append("=== CURRENT SESSION HISTORY (recent conversation turns) ===\n" + "\n".join(turn_lines))

    return "\n\n".join(parts)


def store_interaction_memory(
    user_id: str,
    user_text: str,
    extraction_result: dict | None = None,
    interaction_type: str = "general",
) -> None:
    """
    Persist what happened in this interaction to the user's memory bank.

    Parameters
    ----------
    user_id          : The authenticated user's ID.
    user_text        : The raw message the user sent (already translated to EN).
    extraction_result: The dict returned by OrderExtractorAgent.run()  (or None
                       for non-extraction interactions like confirmations).
    interaction_type : Hint from the caller; one of:
                         'order'        – user placed / added items to cart
                         'query'        – user asked a product question
                         'confirmation' – user confirmed or cancelled an order
                         'general'      – everything else (greeting, chitchat…)
    """
    if not user_id or user_id == "GUEST":
        return

    today = datetime.now().strftime("%Y-%m-%d")

    # ── 1. Medicines ordered / added to cart ──────────────────────────────────
    if extraction_result:
        medicines = extraction_result.get("medicines", [])
        if medicines:
            items_str = ", ".join(
                f"{m.get('qty', 1)}x {m.get('name', '?')}" for m in medicines
            )
            _add_memory(
                user_id,
                f"Added to cart / ordered: {items_str} on {today}.",
                memory_type="order",
            )

        # ── 2. Medicine the user enquired about ───────────────────────────────
        pending = extraction_result.get("pending_item_name")
        if pending:
            _add_memory(
                user_id,
                f"Showed interest in '{pending}' (asked about it) on {today}.",
                memory_type="query",
            )

        # ── 3. Suggestions hinted at the user's need ──────────────────────────
        suggestions = extraction_result.get("suggestions", [])
        if suggestions and not medicines and not pending:
            sugg_str = ", ".join(suggestions[:3])
            _add_memory(
                user_id,
                f"Searched for medicine not in inventory; nearest matches: {sugg_str}.",
                memory_type="query",
            )

    # ── 4. Capture key keywords from free-text for preference/condition hints ─
    text_lower = user_text.lower()

    # Health conditions the user volunteers
    condition_keywords = {
        "diabetes": "User mentioned they have diabetes.",
        "hypertension": "User mentioned hypertension / high blood pressure.",
        "asthma": "User mentioned asthma.",
        "allergy": "User mentioned an allergy.",
        "pregnant": "User mentioned pregnancy.",
        "heart": "User mentioned a heart condition.",
        "thyroid": "User mentioned a thyroid condition.",
        "cholesterol": "User mentioned high cholesterol.",
        "arthritis": "User mentioned arthritis.",
        "migraine": "User mentioned migraines.",
        "anxiety": "User mentioned anxiety.",
        "depression": "User mentioned depression.",
        "pain": "User reported pain.",
        "fever": "User reported fever.",
        "cold": "User reported cold / flu symptoms.",
        "cough": "User reported a cough.",
        "stomach": "User reported a stomach issue.",
        "infection": "User reported an infection.",
        "bp": "User mentioned blood pressure (BP).",
        "sugar": "User mentioned blood sugar.",
    }

    for kw, fact in condition_keywords.items():
        if kw in text_lower:
            _store_if_not_duplicate(user_id, fact, memory_type="preference")
            break  # one health fact per turn is enough

    # Preference: generic vs branded / budget sensitivity
    if "generic" in text_lower:
        _store_if_not_duplicate(
            user_id,
            "User expressed preference for generic medicines.",
            memory_type="preference",
        )
    elif "cheap" in text_lower or "affordable" in text_lower or "budget" in text_lower:
        _store_if_not_duplicate(
            user_id,
            "User is price-sensitive and prefers affordable options.",
            memory_type="preference",
        )

    # ── 5. Store the raw user message for general recall ──────────────────────
    # Only for substantive messages (min 5 chars, not just "yes"/"no" confirmations)
    confirmation_words = {"yes", "no", "ok", "sure", "confirm", "cancel", "abort",
                          "nevermind", "confirm order", "please"}
    if (
        len(user_text.strip()) >= 5
        and user_text.strip().lower() not in confirmation_words
        and interaction_type != "confirmation"
        and interaction_type != "cancellation"
    ):
        _add_memory(
            user_id,
            f"User said: \"{user_text.strip()[:200]}\"",
            memory_type="general",
        )

    # Confirmation / cancellation events
    if interaction_type == "confirmation":
        _add_memory(
            user_id,
            f"Confirmed and placed an order on {today}.",
            memory_type="order",
        )
    elif interaction_type == "cancellation":
        _add_memory(
            user_id,
            f"Cancelled their cart / order on {today}.",
            memory_type="general",
        )

    # ── 6. Prune old memories to keep the bank lean ───────────────────────────
    database.clear_old_memories(user_id, keep_last=60)


# ──────────────────────────────────────────────────────────────────────────────
# Prescription document memory
# ──────────────────────────────────────────────────────────────────────────────

def store_prescription_memory(
    user_id: str,
    extraction_result: dict,
    matched_meds: list[str],
    unrecognized_meds: list[str],
    file_type: str = "document",
) -> None:
    """
    Persist everything learned from a prescription upload into the user's
    memory bank.  Called immediately after Gemini parses the document.

    Parameters
    ----------
    user_id           : Authenticated user's ID.
    extraction_result : Raw dict from extract_prescription_file() — contains
                        'doctor_name', 'medicines', 'suggestions'.
    matched_meds      : List of human-readable strings e.g. ["2x Metformin 500mg"].
    unrecognized_meds : Medicine names that could not be matched to inventory.
    file_type         : "image" | "pdf" | "document" — for the memory label.
    """
    if not user_id or user_id == "GUEST":
        return

    today = datetime.now().strftime("%Y-%m-%d")
    doc_label = "prescription image" if "image" in file_type else "prescription PDF" if "pdf" in file_type.lower() else "prescription document"

    # ── 1. Record the upload event itself ────────────────────────────────────
    _add_memory(
        user_id,
        f"Uploaded a {doc_label} on {today} for admin approval.",
        memory_type="prescription",
    )

    # ── 2. Doctor who prescribed ──────────────────────────────────────────────
    doctor = extraction_result.get("doctor_name")
    if doctor:
        _store_if_not_duplicate(
            user_id,
            f"Has a prescription from Dr. {doctor}.",
            memory_type="prescription",
        )

    # ── 3. Each matched medicine from the document ────────────────────────────
    medicines = extraction_result.get("medicines", [])
    if medicines:
        items_str = ", ".join(
            f"{m.get('qty', 1)}x {m.get('name', '?')}" for m in medicines
        )
        _add_memory(
            user_id,
            f"Prescription on {today} contained: {items_str} (pending admin approval).",
            memory_type="prescription",
        )

    # ── 4. Individual medicine entries (so future queries can reference them) ─
    for med in medicines:
        name = med.get("name", "")
        qty = med.get("qty", 1)
        if name:
            _store_if_not_duplicate(
                user_id,
                f"Has been prescribed {name} (qty {qty}) per uploaded document.",
                memory_type="prescription",
            )

    # ── 5. Unrecognised medicines hinted at user's broader needs ─────────────
    if unrecognized_meds:
        unrecog_str = ", ".join(unrecognized_meds[:5])
        _add_memory(
            user_id,
            f"Prescription mentioned medicines not in inventory: {unrecog_str}.",
            memory_type="prescription",
        )

    # ── 6. Prune old memories ─────────────────────────────────────────────────
    database.clear_old_memories(user_id, keep_last=60)
    print(f"[MEMORY] Stored prescription memory for {user_id} | doc={doc_label} | meds={len(medicines)}")

    # ── 7. Send the "raw" document content directly to Hindsight ──────────────
    doc_lines = [f"User uploaded a {doc_label}."]
    if doctor:
         doc_lines.append(f"It is a prescription written by Dr. {doctor}.")
    if matched_meds or unrecognized_meds:
         all_meds = matched_meds + unrecognized_meds
         doc_lines.append(f"The document details the following medications/items: {', '.join(all_meds)}.")
    
    sync_to_hindsight(
        user_id=user_id, 
        content=" ".join(doc_lines),
        role="user",
        session_id="document_upload",
        msg_type="document"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────────

def _store_if_not_duplicate(user_id: str, content: str, memory_type: str = "general") -> None:
    """
    Only persist `content` if the user doesn't already have an identical or
    very similar memory stored.  This prevents the same health fact being
    recorded every single session.
    """
    existing = database.get_memories(user_id, limit=60)
    for mem in existing:
        if mem["content"].strip().lower() == content.strip().lower():
            return  # already known — skip
    _add_memory(user_id, content, memory_type=memory_type)
