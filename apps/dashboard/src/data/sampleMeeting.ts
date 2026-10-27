import type { MeetingContext } from "../services/askService";

/**
 * DEMO ONLY: made-up meetings for trying Ask MeetMind AI before the extension can capture real ones.
 * Never stored, never mixed with real notes, and only reachable in dev mode (see AskMeetMind.tsx).
 * Delete this file once real meeting notes come from the backend.
 */
export const SAMPLE_MEETINGS: MeetingContext[] = [
  {
    title: "[Sample] Project Planning & Roadmap (Oct 14)",
    notes: `Summary: The team reviewed project milestones, finalized priorities and planned the next deliverables. The main focus is completing the MVP and preparing for the client review.

Key points:
- MVP scope is limited to the dashboard, the Chrome extension and AI-generated notes.
- The client review will happen after the MVP is complete.
- API integration options still need to be compared.

Decisions:
- MVP timeline confirmed: release candidate by Oct 25.
- Client review is scheduled for the week after the MVP is ready.
- Weekly sync stays on Thursdays.

Action items:
- Riya Sharma: prepare wireframes for the meeting history page (due Oct 18)
- Aman Verma: review API integration options and share a short comparison (due Oct 20)
- Uttam: share the roadmap with the client (due Oct 17)

Follow-ups:
- Who will own QA before the client review?`,
  },
  {
    title: "[Sample] Client Requirements Discussion (Oct 12)",
    notes: `Summary: The team gathered requirements from the client for the meeting assistant. The client wants searchable meeting history and automatic action items. Budget limits were discussed.

Key points:
- The client wants meeting notes to be searchable by keyword.
- Action items must show an owner and a due date.
- Priya Nair (client) mentioned the budget is capped at 4 lakh rupees for phase one.

Decisions:
- Phase one will exclude mobile apps because of the budget.
- Notes will be reviewed by the client before they are shared with their team.

Action items:
- Uttam: send the revised estimate to the client (due Oct 16)
- Riya Sharma: list the minimum features that fit the 4 lakh budget (due Oct 15)

Follow-ups:
- Does the client need Hindi language support in phase one?`,
  },
  {
    title: "[Sample] Team Weekly Sync (Oct 13)",
    notes: `Summary: Short weekly sync. Progress on the dashboard and backend was reviewed, and one blocker was raised about audio capture permissions.

Key points:
- The dashboard layout is complete and the Ask MeetMind AI feature works end to end.
- Audio capture in the extension is blocked until the microphone permission flow is fixed.

Decisions:
- The audio permission flow will be handled before any new extension features.

Action items:
- Aman Verma: fix the microphone permission flow in the extension (due Oct 19)
- Riya Sharma: update the design for the permission screen (due Oct 17)

Follow-ups:
- Check whether tab audio capture needs a separate permission.`,
  },
];