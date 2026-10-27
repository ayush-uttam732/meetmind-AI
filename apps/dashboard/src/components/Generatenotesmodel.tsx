import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { generateNotes } from "../services/api";
import "../styles/modal.css";

interface GenerateNotesModalProps {
  onClose: () => void;
  /** Called after the backend returns notes, so the page can show them in the recap card. */
  onGenerated: (title: string, notes: string) => void;
}

export default function GenerateNotesModal({ onClose, onGenerated }: GenerateNotesModalProps) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!transcript.trim()) return;
    setLoading(true);
    setNotes("");
    setError("");
    try {
      const result = await generateNotes(meetingTitle, transcript);
      setNotes(result);
      onGenerated(meetingTitle.trim() || "Untitled Meeting", result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mm-modal-head">
          <div>
            <span className="mm-eyebrow">AI ASSISTANT</span>
            <h3>Generate meeting notes</h3>
            <p>Paste a transcript and get structured notes.</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label htmlFor="mm-title">Meeting title</label>
        <input
          id="mm-title"
          className="mm-field"
          placeholder="e.g. Product team weekly sync"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
        />

        <div className="mm-field-row">
          <label htmlFor="mm-transcript">Transcript</label>
          <span>{transcript.length.toLocaleString()} characters</span>
        </div>
        <textarea
          id="mm-transcript"
          className="mm-field"
          rows={8}
          placeholder="Paste your meeting transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        {error && <div className="mm-error">{error}</div>}

        <div className="mm-modal-actions">
          <button className="mm-primary" onClick={handleGenerate} disabled={loading || !transcript.trim()}>
            {loading ? "Generating..." : "Generate notes"} <Sparkles size={15} />
          </button>
          {notes && (
            <button className="mm-outline" onClick={() => navigator.clipboard.writeText(notes)}>
              Copy notes
            </button>
          )}
        </div>

        {notes && <pre className="mm-modal-notes">{notes}</pre>}
      </div>
    </div>
  );
}