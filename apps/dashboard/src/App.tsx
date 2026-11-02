import { useState } from "react";
import AppLayout from "./components/Applayout";
import Dashboard from "./pages/Dashboard";
import AllMeetings from "./pages/AllMeetings";
import Login from "./pages/Login";
import Account from "./pages/Account";

export type PageName =
  | "Overview"
  | "Meetings"
  | "Meeting Details"
  | "Search"
  | "Settings"
  | "Account"
  | "Login";

export default function App() {
  const [page, setPage] = useState<PageName>("Overview");
  const userName = "Ayush Uttam";

  if (page === "Login") {
    return <Login onLogin={() => setPage("Overview")} />;
  }

  function renderPage() {
    switch (page) {
      case "Meetings":
        return <AllMeetings />;
      case "Account":
        return <Account />;
      case "Overview":
      default:
        return <Dashboard onViewAllMeetings={() => setPage("Meetings")} />;
    }
  }

  return (
    <AppLayout
      active={page}
      onNavigate={setPage}
      userName={userName}
    >
      {renderPage()}
    </AppLayout>
  );
}