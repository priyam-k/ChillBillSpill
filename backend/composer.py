from urllib.parse import quote


COMMENT_EMAIL = "cpmc@collegeparkmd.gov"
DEADLINE_NOTE = "Submit by 5:00 PM on the day of the meeting to be entered into the official record."


def build_mailto(
    meeting_date: str,
    item_number: str,
    item_title: str,
    user_name: str = "[Your Name]",
    user_address: str = "[Your Address]",
    cp_district: str = "",
) -> str:
    """
    Build a mailto: link pre-populated with the correct recipient, subject,
    and body template for a College Park public comment submission.
    """
    district_str = f" in District {cp_district}" if cp_district else ""
    subject = f"Public Comment – {meeting_date} – Agenda Item {item_number}: {item_title}"
    body = (
        f"Dear Mayor and Council,\n\n"
        f"My name is {user_name} and I live at {user_address}{district_str}.\n\n"
        f"I am writing regarding Agenda Item {item_number}: {item_title}.\n\n"
        f"[✍️ Write your comment here]\n\n"
        f"Thank you for entering this into the record.\n\n"
        f"Sincerely,\n{user_name}"
    )
    return f"mailto:{COMMENT_EMAIL}?subject={quote(subject)}&body={quote(body)}"


def build_comment_payload(
    meeting_id: str,
    meeting_date: str,
    item_number: str,
    item_title: str,
    cp_district: str = "",
) -> dict:
    """
    Returns structured data for the frontend CommentComposer modal.
    The frontend uses this to pre-fill the form fields.
    """
    return {
        "to": COMMENT_EMAIL,
        "subject_template": f"Public Comment – {meeting_date} – Agenda Item {item_number}: {item_title}",
        "body_template": (
            "Dear Mayor and Council,\n\n"
            "My name is [Your Name] and I live at [Your Address]"
            + (f" in District {cp_district}" if cp_district else "")
            + ".\n\n"
            f"I am writing regarding Agenda Item {item_number}: {item_title}.\n\n"
            "[✍️ Write your comment here]\n\n"
            "Thank you for entering this into the record.\n\n"
            "Sincerely,\n[Your Name]"
        ),
        "deadline_note": DEADLINE_NOTE,
        "meeting_id": meeting_id,
        "meeting_date": meeting_date,
        "item_number": item_number,
        "item_title": item_title,
    }
