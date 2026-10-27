import { useMemo, useState } from "react";

type SearchMeeting = {
id: number;
title: string;
date: string;
duration: string;
summary: string;
keywords: string[];
};

const meetings: SearchMeeting[] = [
{
id: 1,
title: "Project Planning & Roadmap",
date: "Oct 14, 2026",
duration: "32 min",
summary:
"Discussed project milestones, finalized priorities and planned upcoming deliverables.",
keywords: ["planning", "roadmap", "milestones", "project"],
},
{
id: 2,
title: "Team Weekly Sync",
date: "Oct 13, 2026",
duration: "45 min",
summary:
"Reviewed team progress, blockers, responsibilities and upcoming deadlines.",
keywords: ["team", "weekly", "progress", "deadlines"],
},
{
id: 3,
title: "Client Requirements Discussion",
date: "Oct 12, 2026",
duration: "28 min",
summary:
"Reviewed client expectations, feature requirements and possible solutions.",
keywords: ["client", "requirements", "features", "discussion"],
},
{
id: 4,
title: "Product Brainstorming",
date: "Oct 11, 2026",
duration: "38 min",
summary:
"Explored product ideas, user feedback and potential feature improvements.",
keywords: ["product", "ideas", "brainstorming", "features"],
},
];

const suggestions = [
"project milestones",
"team progress",
"client requirements",
"product ideas",
];

export default function Search() {
const [query, setQuery] = useState("");
const [selectedSuggestion, setSelectedSuggestion] = useState("");

const results = useMemo(() => {
const normalizedQuery = query.trim().toLowerCase();

if (!normalizedQuery) return [];

return meetings.filter((meeting) => {
  const searchableText = [
    meeting.title,
    meeting.date,
    meeting.summary,
    ...meeting.keywords,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
});

}, [query]);

function chooseSuggestion(suggestion: string) {
setSelectedSuggestion(suggestion);
setQuery(suggestion);
}

return ( <section className="dashboard-page search-page"> <div className="welcome-row"> <div> <span className="eyebrow">MEETING INTELLIGENCE</span> <h2>Find anything, faster.</h2> <p>Search across your meeting records and revisit key discussions.</p> </div> </div>

  <section className="panel search-main-panel">
    <div className="search-large-box">
      <span className="search-large-icon">⌕</span>
      <input
        autoFocus
        type="search"
        aria-label="Search meetings"
        placeholder="Search meeting titles, summaries or keywords..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedSuggestion("");
        }}
      />
      {query && (
        <button
          type="button"
          className="search-clear-button"
          onClick={() => {
            setQuery("");
            setSelectedSuggestion("");
          }}
        >
          Clear
        </button>
      )}
    </div>

    {!query.trim() && (
      <div className="search-suggestions">
        <span>TRY SEARCHING FOR</span>
        <div>
          {suggestions.map((suggestion) => (
            <button
              type="button"
              className="search-suggestion"
              key={suggestion}
              onClick={() => chooseSuggestion(suggestion)}
            >
              {suggestion} ↗
            </button>
          ))}
        </div>
      </div>
    )}

    {query.trim() && (
      <div className="search-results-section">
        <div className="search-results-heading">
          <div>
            <span className="section-kicker">SEARCH RESULTS</span>
            <h3>
              {results.length} {results.length === 1 ? "meeting" : "meetings"} found
            </h3>
          </div>
          <span className="search-query-label">
            “{selectedSuggestion || query.trim()}”
          </span>
        </div>

        {results.length > 0 ? (
          <div className="search-results-list">
            {results.map((meeting) => (
              <article className="search-result-card" key={meeting.id}>
                <div className="meeting-icon purple">◈</div>
                <div className="search-result-content">
                  <h4>{meeting.title}</h4>
                  <span className="search-result-date">
                    {meeting.date} · {meeting.duration}
                  </span>
                  <p>{meeting.summary}</p>
                  <div className="search-keywords">
                    {meeting.keywords.slice(0, 3).map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <span>⌕</span>
            <h3>No matching meetings</h3>
            <p>Try a shorter keyword, such as “team” or “project”.</p>
          </div>
        )}
      </div>
    )}
  </section>

  <div className="search-info-row">
    <span>✦</span>
    <p>
      Search currently uses sample meeting data. Connect your meeting
      database to search real notes and transcripts.
    </p>
  </div>
</section>

);
}
