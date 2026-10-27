export default function Account() {
return (
<section style={{ padding: "32px", color: "#e8edf8" }}>
<span style={{ color: "#a69aff", fontSize: "11px", letterSpacing: "2px" }}>
YOUR PROFILE </span>

  <h2 style={{ marginTop: "12px" }}>Account Settings</h2>

  <p style={{ color: "#929bb3", lineHeight: 1.7 }}>
    Manage your MeetMind AI workspace and profile information.
  </p>

  <div
    style={{
      marginTop: "24px",
      padding: "24px",
      maxWidth: "500px",
      border: "1px solid #252b40",
      borderRadius: "16px",
      background: "#121827",
    }}
  >
    <div style={{ fontSize: "13px", color: "#929bb3" }}>Display name</div>
    <h3 style={{ marginBottom: "20px" }}>MeetMind User</h3>

    <div style={{ fontSize: "13px", color: "#929bb3" }}>Workspace</div>
    <h3 style={{ marginBottom: "20px" }}>Personal Workspace</h3>

    <div style={{ fontSize: "13px", color: "#929bb3" }}>Account status</div>
    <p style={{ color: "#77d9b0" }}>● Demo mode</p>
  </div>
</section>

);
}
