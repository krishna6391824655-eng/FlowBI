
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../api";
import PasswordField from "../components/PasswordField";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Login failed. Please check your credentials.");
        return;
      }

      // Make sure the backend returned a JWT token
      if (!data.access_token || !data.id) {
        alert("Login response is missing authentication information.");
        return;
      }

      // Save login information
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("userId", String(data.id));
      localStorage.setItem("userEmail", data.email || formData.email.trim());

      // Notify other components that the user has changed
      window.dispatchEvent(new Event("flowbi-user-changed"));

      alert("Login successful!");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      alert(
        "Unable to connect to the server. Please make sure your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    if (forgotLoading) return;
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(`${API_URL}/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not send a reset email.");
      setForgotMessage(data.message || "If an account exists, a reset link has been sent.");
    } catch (error) {
      setForgotMessage(error.message || "Could not send a reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SECTION */}
      <section className="login-info">
        <div className="login-brand">
          <div className="login-brand-icon">F</div>
          <span>FlowBI</span>
        </div>

        <div className="login-info-content">
          <p className="login-eyebrow">YOUR DATA. YOUR INSIGHTS.</p>

          <h1>
            Make your data
            <br />
            <span>work smarter.</span>
          </h1>

          <p className="login-description">
            Manage your datasets, clean your data and discover meaningful
            insights from one powerful platform.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span>✓</span>
              <p>Upload CSV and Excel files</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Clean and transform your data</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Analyze and visualize results</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SECTION */}
      <section className="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>{forgotMode ? "Reset your password" : "Welcome back"}</h2>
            <p>{forgotMode ? "We’ll email you a secure, one-time reset link." : "Login to continue to your FlowBI workspace."}</p>
          </div>

          {forgotMode ? (
            <form className="login-form" onSubmit={handleForgotPassword}>
              <div className="login-field">
                <label htmlFor="forgot-email">Account email</label>
                <input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} required />
              </div>
              {forgotMessage && <p className="auth-feedback" role="status">{forgotMessage}</p>}
              <button type="submit" className="login-submit" disabled={forgotLoading}>
                <span>{forgotLoading ? "Sending…" : "Send reset link"}</span><span>→</span>
              </button>
              <button type="button" className="auth-text-button" onClick={() => { setForgotMode(false); setForgotMessage(""); }}>Back to login</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" name="email" placeholder="you@example.com" autoComplete="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="login-field">
                <div className="login-password-header">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="auth-text-button" onClick={() => { setForgotEmail(formData.email); setForgotMode(true); setForgotMessage(""); }}>Forgot password?</button>
                </div>
                <div className="login-password-control">
                  <PasswordField id="password" label="" name="password" placeholder="Enter your password" autoComplete="current-password" value={formData.password} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="login-submit" disabled={loading}>
                <span>{loading ? "Logging in..." : "Login"}</span><span>→</span>
              </button>
            </form>
          )}

          {/* REGISTER */}
          <p className="login-register-text">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
