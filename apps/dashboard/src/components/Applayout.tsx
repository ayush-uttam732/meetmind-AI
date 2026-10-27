import type { ReactNode } from "react";
import Sidebar, { type NavLabel } from "./Sidebar";
import Header from "./Header";
import "../styles/layout.css";

interface AppLayoutProps {
  active: NavLabel;
  userName: string;
  onNavigate?: (label: NavLabel) => void;
  onPromoClick?: () => void;
  children: ReactNode;
}

/** Shared shell: sidebar + header. Every page (Dashboard, Meetings, Search, ...) renders inside this. */
export default function AppLayout({ active, userName, onNavigate, onPromoClick, children }: AppLayoutProps) {
  return (
    <div className="mm-shell">
      <Sidebar active={active} onNavigate={onNavigate} onPromoClick={onPromoClick} />
      <div className="mm-main">
        <Header userName={userName} />
        {children}
      </div>
    </div>
  );
}