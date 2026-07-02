import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <nav className="navbar">
      {/* Left: Logo + Location */}
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-main">Marquee</span>
        </div>

        <div className="navbar-location">
          <span className="location-icon">📍</span>
          <div className="location-info">
            <span className="location-name">Delhi NCR</span>
            <span className="location-sub">New Delhi, India</span>
          </div>
          <span className="location-arrow">▾</span>
        </div>
      </div>

      {/* Right: Search + Profile */}
      <div className="navbar-right">
        <div className="navbar-search-wrapper" ref={searchRef}>
          <button
            className="icon-circle-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {searchOpen && (
            <div className="navbar-search-popover">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search for Movies, Events..."
                className="navbar-search-input"
              />
            </div>
          )}
        </div>

        {!user ? (
          <button className="nav-signin-btn" onClick={() => navigate("/login")}>
            Sign in
          </button>
        ) : (
          <div className="navbar-profile" ref={profileRef}>
            <button
              className="profile-avatar-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile"
            >
              <span className="profile-avatar has-user">{initials}</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <span className="profile-avatar has-user"
                    style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>
                    {initials}
                  </span>
                  <div className="profile-dropdown-text">
                    <div className="profile-dropdown-name">{user.name}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item"
                  onClick={() => { navigate("/profile"); setProfileOpen(false); }}>
                  <span className="item-icon">👤</span> My Profile
                </button>
                <button className="profile-dropdown-item"
                  onClick={() => { navigate("/my-bookings"); setProfileOpen(false); }}>
                  <span className="item-icon">🎟️</span> My Bookings
                </button>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item logout"
                  onClick={() => { logout?.(); setProfileOpen(false); }}>
                  <span className="item-icon">🚪</span> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;