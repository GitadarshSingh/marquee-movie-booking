import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <span className="profile-page-title">Profile</span>
      </div>

      <div className="profile-page-body">
        <div className="profile-identity-card">
          <div className="profile-avatar-large">{initials}</div>
          <div>
            <div className="profile-identity-name">{user?.name || "User"}</div>
            <div className="profile-identity-phone">
              {user?.phoneNumber || user?.email}
            </div>
          </div>
        </div>

        <div className="profile-pill-group">
          <button
            className="profile-pill-item"
            onClick={() => navigate("/my-bookings")}
          >
            <span className="pill-icon">🎟️</span>
            <span className="pill-label">View all bookings</span>
            <span className="pill-arrow">›</span>
          </button>
        </div>

        <div className="profile-section-label">Support</div>
        <div className="profile-pill-group">
          <button className="profile-pill-item">
            <span className="pill-icon">💬</span>
            <span className="pill-label">Chat with us</span>
            <span className="pill-arrow">›</span>
          </button>
        </div>

        <div className="profile-section-label">More</div>
        <div className="profile-pill-group">
          <button className="profile-pill-item">
            <span className="pill-icon">❓</span>
            <span className="pill-label">Terms &amp; Conditions</span>
            <span className="pill-arrow">›</span>
          </button>
          <div className="profile-pill-divider" />
          <button className="profile-pill-item">
            <span className="pill-icon">📄</span>
            <span className="pill-label">Privacy Policy</span>
            <span className="pill-arrow">›</span>
          </button>
        </div>

        <div className="profile-pill-group">
          <button className="profile-pill-item logout" onClick={handleLogout}>
            <span className="pill-icon">↪</span>
            <span className="pill-label">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;