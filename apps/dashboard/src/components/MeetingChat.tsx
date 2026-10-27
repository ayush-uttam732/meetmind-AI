import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { TranscriptMessage } from "../types/Meeting";
import { initials, speakerTone } from "../utils/meetingFormat";

interface Props {
  transcript: TranscriptMessage[];
  /** Messages from this speaker show on the right, like "you" in WhatsApp. */
  selfName?: string;
}

interface Group {
  speaker: string;
  messages: TranscriptMessage[];
}

/** Consecutive messages from the same speaker share one name header. */
function groupBySpeaker(messages: TranscriptMessage[]): Group[] {
  const groups: Group[] = [];
  for (const message of messages) {
    const last = groups[groups.length - 1];
    if (last && last.speaker === message.speaker) {
      last.messages.push(message);
    } else {
      groups.push({ speaker: message.speaker, messages: [message] });
    }
  }
  return groups;
}

export default function MeetingChat({ transcript, selfName }: Props) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transcript;
    return transcript.filter(
      (m) =>
        m.text.toLowerCase().includes(q) || m.speaker.toLowerCase().includes(q)
    );
  }, [transcript, query]);

  const groups = useMemo(() => groupBySpeaker(visible), [visible]);

  if (transcript.length === 0) {
    return <p className="mm-empty-line">No transcript is available for this meeting.</p>;
  }

  return (
    <div className="mm-chat">
      <label className="mm-chat-search">
        <Search size={14} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in conversation"
          aria-label="Search in conversation"
        />
      </label>

      <div className="mm-chat-body">
        {groups.length === 0 && (
          <p className="mm-empty-line">No messages match "{query}".</p>
        )}

        {groups.map((group, index) => {
          const isSelf = !!selfName && group.speaker === selfName;
          const tone = speakerTone(group.speaker);
          return (
            <div
              key={`${group.speaker}-${group.messages[0].id}-${index}`}
              className={`mm-chat-group ${isSelf ? "self" : "other"}`}
            >
              {!isSelf && (
                <div className={`mm-avatar tone-${tone}`} aria-hidden="true">
                  {initials(group.speaker)}
                </div>
              )}
              <div className="mm-chat-col">
                <span className={`mm-chat-name tone-${tone}`}>
                  {isSelf ? "You" : group.speaker}
                </span>
                {group.messages.map((message) => (
                  <div key={message.id} className="mm-bubble">
                    <p>{message.text}</p>
                    <time>{message.time}</time>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}