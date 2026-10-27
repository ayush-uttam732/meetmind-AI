type LoginProps = {
onLogin: () => void;
};

export default function Login({ onLogin }: LoginProps) {
return ( <main className="login-page"> <section className="login-brand-panel"> <div className="login-brand"> <span className="login-brand-icon">✦</span> <span>
MeetMind <small>AI WORKSPACE</small> </span> </div>

    <div className="login-hero">
      <span className="login-eyebrow">MEETINGS, REIMAGINED</span>
      <h1>
        Less meeting
        <br />
        admin.
        <br />
        <span>More meaningful work.</span>
      </h1>
      <p>
        Turn conversations into summaries, decisions and action items
        with your AI meeting companion.
      </p>

      <div className="login-feature-list">
        <div><span>✓</span> AI-generated meeting notes</div>
        <div><span>✓</span> Clear action items and decisions</div>
        <div><span>✓</span> One workspace for your meetings</div>
      </div>
    </div>

    <p className="login-footer">
      Your conversations. Your workspace. Your clarity.
    </p>
  </section>

  <section className="login-form-panel">
    <div className="login-form-card">
      <div className="login-mobile-brand">
        <span className="login-brand-icon">✦</span> MeetMind AI
      </div>

      <span className="login-eyebrow">WELCOME TO MEETMIND</span>
      <h2>Your workspace awaits.</h2>
      <p className="login-description">
        Sign-in integration can be connected when authentication is
        configured for your project.
      </p>

      <button
        type="button"
        className="login-submit"
        onClick={onLogin}
      >
        Continue to demo workspace <span>→</span>
      </button>

      <div className="login-divider">
        <span>DEMO ACCESS</span>
      </div>

      <div className="demo-notice">
        <span className="demo-notice-icon">✦</span>
        <div>
          <strong>Explore MeetMind AI</strong>
          <p>
            Open the workspace to explore the dashboard and test
            meeting-note generation.
          </p>
        </div>
      </div>

      <p className="login-terms">
        Demo mode · No account required
      </p>
    </div>
  </section>
</main>

);
}
