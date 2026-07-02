import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";

const THEME_META = {
  dark: { label: "Dark", swatch: "#1a1a2e" },
  midnight: { label: "Midnight Blue", swatch: "#0b1a33" },
  crimson: { label: "Crimson", swatch: "#2b0a14" },
  light: { label: "Light", swatch: "#f4f4f8" },
};

function Settings() {
  const { theme, setTheme, THEMES } = useTheme();
  const { user } = useAuth();

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        <section className="settings-section">
          <h2>Account</h2>
          <div className="settings-account-card">
            <span className="settings-avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
            <div>
              <div className="settings-account-name">{user?.name}</div>
              <div className="settings-account-email">{user?.email}</div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Appearance</h2>
          <p className="settings-desc">Choose how BookMyShow looks to you.</p>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`theme-option ${theme === t ? "active" : ""}`}
                onClick={() => setTheme(t)}
              >
                <span
                  className="theme-swatch"
                  style={{ background: THEME_META[t].swatch }}
                />
                <span>{THEME_META[t].label}</span>
                {theme === t && <span className="theme-check">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Notifications</h2>
          <ToggleRow label="Email me about new releases" defaultOn />
          <ToggleRow label="Booking reminders" defaultOn />
          <ToggleRow label="Offers & promotions" />
        </section>
      </div>
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} />
      <span className="toggle-slider" />
    </label>
  );
}

export default Settings;