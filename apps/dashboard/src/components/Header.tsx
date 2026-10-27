import { Search, Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
  userName?: string;
  workspaceLabel?: string;
  hasNotifications?: boolean;
  onSearch?: (query: string) => void;
  page?: string;
  onNavigate?: (page: any) => void;
}

function initials(name: string = ""): string {
  if (!name.trim()) return "U";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Header({
  userName = "Ayush Uttam",
  workspaceLabel = "Local workspace",
  hasNotifications = false,
  onSearch,
}: HeaderProps) {
  return (
    <header className="mm-topbar">
      <label className="mm-search">
        <Search size={18} />
        <input
          placeholder="Search meetings, summaries, or keywords..."
          onChange={(event) => onSearch?.(event.target.value)}
        />
        <kbd>⌘ K</kbd>
      </label>

      <div className="mm-topbar-right">
        <button className="mm-bell" aria-label="Notifications">
          <Bell size={20} />
          {hasNotifications && <span />}
        </button>
        <div className="mm-user">
          <div className="mm-avatar">{initials(userName)}</div>
          <div>
            <strong>{userName}</strong>
            <p>{workspaceLabel}</p>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}