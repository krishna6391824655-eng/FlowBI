import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL } from "../api";
import PasswordField from "../components/PasswordField";
import "./Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }
    if (!token) {
      setMessage("This reset link is missing its token. Request a new one.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Could not reset your password.");
      setComplete(true);
      setMessage(result.message || "Password reset successfully.");
    } catch (error) {
      setMessage(error.message || "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-password-page">
      <section className="login-card">
        <div className="login-header">
          <h2>Choose a new password</h2>
          <p>Use at least 6 characters. This reset link expires after 30 minutes.</p>
        </div>
        {complete ? (
          <div className="login-form">
            <p className="auth-feedback" role="status">{message}</p>
            <Link className="login-submit" to="/login">Go to login <span>→</span></Link>
          </div>
        ) : (
          <form className="login-form auth-password-form" onSubmit={handleSubmit}>
            <PasswordField className="login-field" id="new-password" label="New password" name="new_password" placeholder="Enter a new password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <PasswordField className="login-field" id="confirm-new-password" label="Confirm new password" name="confirm_password" placeholder="Enter it again" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            {message && <p className="auth-feedback" role="alert">{message}</p>}
            <button className="login-submit" type="submit" disabled={loading || !token}>
              <span>{loading ? "Updating…" : "Update password"}</span><span>→</span>
            </button>
            <Link to="/login" className="auth-text-button">Back to login</Link>
          </form>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
