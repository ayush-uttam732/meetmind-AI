import type { MeetingRecord } from "../types/Meeting";

/**
 * DEMO ONLY: made-up meetings so the dashboard can be tried before the extension captures real ones.
 * Every record has isSample: true. Only used when demo mode is on (dev builds). Delete this file
 * once meetings come from the backend.
 */
function at(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const AYUSH = "Ayush Uttam";
const RIYA = "Riya Sharma";
const AMAN = "Aman Verma";
const PRIYA = "Priya Nair (Client)";

export const SAMPLE_MEETINGS: MeetingRecord[] = [
  {
    id: "sample-1",
    title: "Project Planning & Roadmap",
    startedAt: at(0, 10, 30),
    durationMin: 32,
    status: "Completed",
    isSample: true,
    participants: [AYUSH, RIYA, AMAN],
    notes: {
      summary:
        "The team reviewed project milestones, finalized priorities and planned the next deliverables. The main focus is completing the MVP and preparing for the client review.",
      keyPoints: [
        "MVP covers the dashboard, the Chrome extension and AI-generated notes.",
        "The client review happens after the MVP is ready.",
        "API integration options still need to be compared.",
      ],
      decisions: [
        "MVP release candidate confirmed for the end of the month",
        "Client review will be scheduled the week after the MVP",
        "Weekly sync stays on Thursdays",
      ],
      actionItems: [
        { task: "Prepare wireframes for the meeting history page", owner: RIYA, dueDate: "Friday" },
        { task: "Compare API integration options and share a short summary", owner: AMAN, dueDate: "Next Tuesday" },
        { task: "Share the roadmap with the client", owner: AYUSH, dueDate: "Thursday" },
      ],
      followUps: ["Who will own QA before the client review?"],
    },
    transcript: [
      { id: "1-1", speaker: AYUSH, time: "10:31 AM", text: "Thanks everyone for joining. Let's lock the MVP plan today and agree on who owns what." },
      { id: "1-2", speaker: RIYA, time: "10:32 AM", text: "From design, I can finish the wireframes for the meeting history page by Friday." },
      { id: "1-3", speaker: AMAN, time: "10:33 AM", text: "On the backend I still need to compare two API integration options. I can share a short comparison by next Tuesday." },
      { id: "1-4", speaker: AYUSH, time: "10:35 AM", text: "Good. The MVP covers the dashboard, the Chrome extension and AI-generated notes." },
      { id: "1-5", speaker: AYUSH, time: "10:35 AM", text: "Can we confirm the release candidate for the end of the month?" },
      { id: "1-6", speaker: AMAN, time: "10:37 AM", text: "That works if audio capture in the extension is not delayed." },
      { id: "1-7", speaker: RIYA, time: "10:39 AM", text: "Should the client review happen before or after the MVP?" },
      { id: "1-8", speaker: AYUSH, time: "10:40 AM", text: "After. We'll schedule the client review for the week after the MVP is ready." },
      { id: "1-9", speaker: AYUSH, time: "10:41 AM", text: "I'll share the roadmap with the client by Thursday." },
      { id: "1-10", speaker: AMAN, time: "10:44 AM", text: "One open question: who will own QA before the client review?" },
      { id: "1-11", speaker: RIYA, time: "10:45 AM", text: "Not decided yet. Let's pick that up next week." },
      { id: "1-12", speaker: AYUSH, time: "10:48 AM", text: "We keep the weekly sync on Thursdays. Thanks all." },
    ],
  },
  {
    id: "sample-2",
    title: "Team Weekly Sync",
    startedAt: at(1, 15, 0),
    durationMin: 45,
    status: "Completed",
    isSample: true,
    participants: [AYUSH, RIYA, AMAN],
    notes: {
      summary:
        "Short weekly sync. Dashboard progress was reviewed and one blocker was raised: audio capture is blocked by the microphone permission flow.",
      keyPoints: [
        "Dashboard layout is complete and Ask MeetMind AI works end to end.",
        "Audio capture in the extension is blocked until the permission flow is fixed.",
      ],
      decisions: ["Fix the microphone permission flow before adding new extension features"],
      actionItems: [
        { task: "Fix the microphone permission flow in the extension", owner: AMAN, dueDate: "End of this week" },
        { task: "Update the design of the permission screen", owner: RIYA, dueDate: "Thursday" },
      ],
      followUps: ["Check whether tab audio capture needs a separate permission"],
    },
    transcript: [
      { id: "2-1", speaker: AMAN, time: "3:02 PM", text: "Dashboard layout is done and Ask MeetMind AI works end to end." },
      { id: "2-2", speaker: RIYA, time: "3:04 PM", text: "Great. On the extension side, audio capture is blocked by the microphone permission flow." },
      { id: "2-3", speaker: AYUSH, time: "3:06 PM", text: "Then that is the priority. Let's fix the permission flow before any new extension features." },
      { id: "2-4", speaker: AMAN, time: "3:08 PM", text: "I can fix it by the end of this week." },
      { id: "2-5", speaker: RIYA, time: "3:10 PM", text: "I'll update the permission screen design by Thursday." },
      { id: "2-6", speaker: AMAN, time: "3:14 PM", text: "We should also check whether tab audio capture needs a separate permission." },
    ],
  },
  {
    id: "sample-3",
    title: "Client Requirements Discussion",
    startedAt: at(2, 11, 0),
    durationMin: 28,
    status: "Completed",
    isSample: true,
    participants: [AYUSH, RIYA, PRIYA],
    notes: {
      summary:
        "The team gathered requirements for the meeting assistant. The client wants searchable meeting history and action items with owners and due dates. A budget limit was discussed.",
      keyPoints: [
        "Meeting notes must be searchable by keyword.",
        "Action items must show an owner and a due date.",
        "Priya Nair (client) said the phase one budget is capped at 4 lakh rupees.",
      ],
      decisions: [
        "Mobile apps are excluded from phase one because of the budget",
        "The client reviews notes before they are shared with their team",
      ],
      actionItems: [
        { task: "Send the revised estimate to the client", owner: AYUSH, dueDate: "Friday" },
        { task: "List the minimum features that fit the 4 lakh budget", owner: RIYA, dueDate: "Wednesday" },
      ],
      followUps: ["Is Hindi language support possible in phase one?"],
    },
    transcript: [
      { id: "3-1", speaker: PRIYA, time: "11:02 AM", text: "We want meeting notes to be searchable by keyword, and every action item should show an owner and a due date." },
      { id: "3-2", speaker: AYUSH, time: "11:05 AM", text: "Understood. Both are part of the plan." },
      { id: "3-3", speaker: PRIYA, time: "11:09 AM", text: "One constraint: our budget is capped at 4 lakh rupees for phase one." },
      { id: "3-4", speaker: RIYA, time: "11:12 AM", text: "With that budget, we should leave mobile apps out of phase one." },
      { id: "3-5", speaker: PRIYA, time: "11:14 AM", text: "That's fine. We would like to review the notes before they are shared with our team." },
      { id: "3-6", speaker: AYUSH, time: "11:18 AM", text: "Noted. I'll send the revised estimate by Friday." },
      { id: "3-7", speaker: RIYA, time: "11:20 AM", text: "And I'll list the minimum features that fit the budget by Wednesday." },
      { id: "3-8", speaker: PRIYA, time: "11:24 AM", text: "Will Hindi language support be possible in phase one?" },
      { id: "3-9", speaker: AYUSH, time: "11:25 AM", text: "We'll check and confirm." },
    ],
  },
  {
    id: "sample-4",
    title: "Product Brainstorming",
    startedAt: at(4, 14, 0),
    durationMin: 40,
    status: "Completed",
    isSample: true,
    participants: [AYUSH, RIYA, AMAN],
    notes: {
      summary:
        "The team brainstormed features for the extension. A live action-items panel was prioritized, and task reminders were moved to after the MVP.",
      keyPoints: [
        "A live action-items panel in the extension side panel adds the most value.",
        "It needs real-time transcript events over the WebSocket, which is already planned.",
      ],
      decisions: [
        "The live action-items panel goes into the backlog first",
        "Task reminders move to after the MVP",
      ],
      actionItems: [
        { task: "Write a short spec for the live action-items panel", owner: RIYA, dueDate: "Next week" },
      ],
      followUps: ["Check the WebSocket event volume for live updates"],
    },
    transcript: [
      { id: "4-1", speaker: RIYA, time: "2:03 PM", text: "Idea: a live action-items panel in the extension side panel." },
      { id: "4-2", speaker: AMAN, time: "2:06 PM", text: "That needs real-time transcript events over the WebSocket, which we already have planned." },
      { id: "4-3", speaker: AYUSH, time: "2:10 PM", text: "Let's also think about reminders for pending tasks." },
      { id: "4-4", speaker: RIYA, time: "2:14 PM", text: "Reminders can come later. The live panel brings more value first." },
      { id: "4-5", speaker: AYUSH, time: "2:20 PM", text: "Agreed. The live panel goes into the backlog first, reminders after the MVP." },
    ],
  },
  {
    id: "sample-5",
    title: "Marketing Strategy",
    startedAt: at(6, 11, 0),
    durationMin: 35,
    status: "Processing",
    isSample: true,
    participants: [AYUSH, AMAN],
    notes: null,
    transcript: [],
  },
];