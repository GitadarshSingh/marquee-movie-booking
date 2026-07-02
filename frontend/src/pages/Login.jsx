import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../services/authService";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isSignup) {
        data = await signup(form.name, form.email, form.password, form.phoneNumber);
      } else {
        data = await login(form.email, form.password);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      );

      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setForm({ name: "", email: "", password: "", phoneNumber: "" });
  };

  return (
    <div className="auth-page">
      {/* LEFT BRAND PANEL */}
      <div className="auth-brand-panel">
        <div className="auth-brand-overlay" />
        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="logo-book">Book</span>
            <span className="logo-my">My</span>
            <span className="logo-show">Show</span>
          </div>
          <h1>India's biggest platform for movies, events &amp; more</h1>
          <p>
            Book tickets in seconds, get instant confirmations, and never miss
            the show you've been waiting for.
          </p>
          <div className="auth-stats">
            <div>
              <strong>10M+</strong>
              <span>Tickets booked</span>
            </div>
            <div>
              <strong>5000+</strong>
              <span>Screens &amp; venues</span>
            </div>
            <div>
              <strong>4.8★</strong>
              <span>App rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <span className="logo-book">Book</span>
            <span className="logo-my">My</span>
            <span className="logo-show">Show</span>
          </div>

          <h2 className="auth-title">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="auth-subtitle">
            {isSignup
              ? "Sign up to start booking tickets"
              : "Sign in to continue booking tickets"}
          </p>

          {error && (
            <div className="auth-error">
              <span className="auth-error-icon">!</span>
              {String(error)}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field">
                <label>Full name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {isSignup && (
              <div className="auth-field">
                <label>Phone number</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📱</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="98765 43210"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="auth-forgot">
                <span>Forgot password?</span>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : isSignup ? (
                "Create account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to BookMyShow?"}{" "}
            <span onClick={switchMode}>{isSignup ? "Sign In" : "Sign Up"}</span>
          </p>

          <p className="auth-terms">
            By continuing, you agree to BookMyShow's{" "}
            <span>Terms of Service</span> and <span>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;