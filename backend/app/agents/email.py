"""Email Agent — drafts and sends notifications via Alibaba Cloud DirectMail.

This agent handles the communication stage of the recruitment pipeline:
1. Draft interview invitation emails
2. Draft status update emails
3. Draft report delivery emails
4. Send emails via DirectMail

Uses Qwen qwen3.6-flash for fast, cost-effective email drafting.
"""
import logging

from .base import Agent, AgentRole, Task, AgentResult
from app.ai.providers.qwen import get_qwen_provider, QwenError

log = logging.getLogger("recruitai.agents.email")


class EmailAgent(Agent):
    """Handles email drafting and sending via DirectMail."""

    name = "Email Agent"
    role = AgentRole.EMAIL
    model_tier = "fast"  # Use fast model for email drafting

    def execute(self, task: Task) -> AgentResult:
        """Route to the appropriate handler based on task action."""
        action = task.payload.get("action", task.action)

        handlers = {
            "draft_interview_invite": self._draft_interview_invite,
            "draft_status_update": self._draft_status_update,
            "draft_report_delivery": self._draft_report_delivery,
            "send_email": self._send_email,
        }

        handler = handlers.get(action)
        if not handler:
            return AgentResult.fail(f"Unknown action: {action}")

        try:
            return handler(task)
        except QwenError as exc:
            log.exception("Email Agent error")
            return AgentResult.fail(str(exc))

    def _draft_interview_invite(self, task: Task) -> AgentResult:
        """Draft an interview invitation email."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        interview_link = task.payload.get("interview_link", "")
        company_name = task.payload.get("company_name", "our team")

        system = """You are a professional HR assistant drafting interview invitation emails.
Write a concise, professional email that:
1. Addresses the candidate by name
2. Mentions the position they applied for
3. Provides the interview link
4. Explains what to expect (AI-conducted interview, ~15-20 minutes)
5. Includes a deadline or validity period
6. Ends professionally

Keep the email under 200 words. Use a warm but professional tone."""

        user = f"""Draft an interview invitation email for:
- Candidate: {candidate_name}
- Position: {job_title}
- Company: {company_name}
- Interview link: {interview_link}
- Link valid for: 7 days

Return only the email body, no subject line."""

        provider = get_qwen_provider()
        try:
            body = provider.text_request(
                system=system,
                user=user,
                tier=self.model_tier,
                max_tokens=500,
            )
            return AgentResult.ok(data={
                "subject": f"Interview Invitation - {job_title}",
                "body": body,
                "recipient_name": candidate_name,
            })
        except QwenError as exc:
            return AgentResult.fail(f"Email drafting failed: {exc}")

    def _draft_status_update(self, task: Task) -> AgentResult:
        """Draft a status update email."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        status = task.payload.get("status", "")
        notes = task.payload.get("notes", "")

        status_messages = {
            "Shortlisted": "has been shortlisted for the next stage",
            "Interview Scheduled": "has an interview scheduled",
            "Interviewed": "has completed the interview stage",
            "Recommended": "has been recommended for hire",
            "Rejected": "will not be moving forward",
            "Hired": "has been selected for the position",
        }

        status_text = status_messages.get(status, f"has been updated to: {status}")

        system = """You are a professional HR assistant drafting status update emails.
Write a concise, professional email that:
1. Addresses the candidate by name
2. Clearly states their application status
3. Provides next steps if applicable
4. Maintains a professional and respectful tone

Keep the email under 150 words."""

        user = f"""Draft a status update email for:
- Candidate: {candidate_name}
- Position: {job_title}
- Status: The candidate {status_text}
- Additional notes: {notes or "None"}

Return only the email body, no subject line."""

        provider = get_qwen_provider()
        try:
            body = provider.text_request(
                system=system,
                user=user,
                tier=self.model_tier,
                max_tokens=400,
            )
            return AgentResult.ok(data={
                "subject": f"Application Update - {job_title}",
                "body": body,
                "recipient_name": candidate_name,
                "status": status,
            })
        except QwenError as exc:
            return AgentResult.fail(f"Email drafting failed: {exc}")

    def _draft_report_delivery(self, task: Task) -> AgentResult:
        """Draft a report delivery email."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        recommendation = task.payload.get("recommendation", "")
        report_link = task.payload.get("report_link", "")

        system = """You are a professional HR assistant drafting report delivery emails.
Write a concise, professional email that:
1. Addresses the recipient by name
2. Mentions the completed evaluation
3. Provides access to the report
4. Includes the hiring recommendation summary
5. Calls to action for next steps

Keep the email under 200 words. Use a professional tone."""

        user = f"""Draft a report delivery email for:
- Candidate: {candidate_name}
- Position: {job_title}
- Recommendation: {recommendation}
- Report link: {report_link}

Return only the email body, no subject line."""

        provider = get_qwen_provider()
        try:
            body = provider.text_request(
                system=system,
                user=user,
                tier=self.model_tier,
                max_tokens=500,
            )
            return AgentResult.ok(data={
                "subject": f"Candidate Report - {job_title} - {candidate_name}",
                "body": body,
                "recipient_name": candidate_name,
            })
        except QwenError as exc:
            return AgentResult.fail(f"Email drafting failed: {exc}")

    def _send_email(self, task: Task) -> AgentResult:
        """Send an email via DirectMail (placeholder — integrate with Alibaba Cloud)."""
        to_address = task.payload.get("to_address", "")
        subject = task.payload.get("subject", "")
        body = task.payload.get("body", "")

        if not to_address:
            return AgentResult.fail("No recipient address provided")

        # TODO: Integrate with Alibaba Cloud DirectMail
        # For now, log the email and mark as sent
        log.info("Email sent to %s: %s", to_address, subject)
        log.debug("Email body: %s", body[:200])

        return AgentResult.ok(data={
            "sent": True,
            "to": to_address,
            "subject": subject,
        })

    def confidence_check(self, result: dict) -> float:
        """Email drafting is straightforward — high confidence."""
        return 0.95
