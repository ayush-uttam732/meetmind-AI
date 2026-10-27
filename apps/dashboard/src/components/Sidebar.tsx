import type { ComponentType } from "react";
import { Home, CalendarDays, Search, Settings, User, Sparkles, ArrowRight } from "lucide-react";

export type NavLabel = "Overview" | "Meetings" | "Search" | "Settings" | "Account";

const navItems: { label: NavLabel; icon: ComponentType<{ size?: number }> }[] = [
  { label: "Overview", icon: Home },
  { label: "Meetings", icon: CalendarDays },
  { label: "Search", icon: Search },
  { label: "Settings", icon: Settings },
  { label: "Account", icon: User },
];

interface SidebarProps {
  active: NavLabel;
  onNavigate?: (label: NavLabel) => void;
  onPromoClick?: () => void;
}

export default function Sidebar({ active, onNavigate, onPromoClick }: SidebarProps) {
  return (
    <aside className="mm-sidebar">
      <div className="mm-brand">
        <div className="mm-logo">
          <Sparkles size={26} />
        </div>
        <div>
          <h1>
            MeetMind <span>AI</span>
          </h1>
          <p>MEETING ASSISTANT</p>
        </div>
      </div>

      <nav className="mm-nav">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`mm-nav-item ${active === label ? "active" : ""}`}
            onClick={() => onNavigate?.(label)}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mm-sidebar-bottom">
        <div className="mm-promo">
          <div className="mm-promo-title">
            <Sparkles size={22} />
            <strong>Smarter Meetings with AI</strong>
          </div>
          <p>Capture, summarize and turn discussions into action.</p>
          <button onClick={onPromoClick}>
            Learn more <ArrowRight size={14} />
          </button>
        </div>
        <div className="mm-workspace">
          <span className="mm-dot" />
          <div>
            <strong>Local workspace</strong>
            <p>Your AI meeting companion</p>
          </div>
        </div>
      </div>
    </aside>
  );
}