"""Build mailto links and comment templates for public comment submissions."""
import urllib.parse


CLERK_EMAIL = "cpmc@collegeparkmd.gov"
COUNTY_CLERK_EMAIL = "clerkofthecouncil@co.pg.md.us"


def build_comment_template(
    item: dict,
    user_name: str,
    user_address: str,
    city_district: int,
    comment_body: str = "",
) -> dict:
    jurisdiction = item.get("jurisdiction", "City")
    to_email = COUNTY_CLERK_EMAIL if jurisdiction == "County" else CLERK_EMAIL
    meeting_date = item.get("meetingDate", "")
    item_id = item.get("id", item.get("itemId", ""))
    headline = item.get("headline", "")

    subject = f"Public Comment — {meeting_date} — Agenda Item {item_id}: {headline}"

    name_placeholder = user_name or "[YOUR NAME]"
    body_placeholder = comment_body or "[ — write your comment here — ]"

    body = f"""Dear Mayor and Council,

My name is {name_placeholder} and I live at {user_address} in District {city_district}.

I am writing regarding {headline}.

{body_placeholder}

Thank you for entering this into the record.

Sincerely,
{name_placeholder}"""

    mailto = (
        f"mailto:{to_email}"
        f"?subject={urllib.parse.quote(subject)}"
        f"&body={urllib.parse.quote(body)}"
    )

    return {
        "to": to_email,
        "subject": subject,
        "body": body,
        "mailto": mailto,
        "deadline_note": "Submit by 5:00 PM on the day of the meeting to be entered into the official record.",
    }
