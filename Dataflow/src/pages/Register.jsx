import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import PasswordField from "../components/PasswordField";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      alert("Registration successful!");

      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

    } catch (error) {
      console.error(error);
      alert("Backend server is not connected");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-info">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>FlowBI</span>
        </div>

        <div className="info-content">
          <p className="small-title">DATA • CLEAN • ANALYZE</p>

          <h1>
            Turn your raw data
            <br />
            into <span>meaningful insights.</span>
          </h1>

          <p className="description">
            Upload your datasets, clean messy data, perform analysis
            and understand your data — all in one platform.
          </p>

          <div className="features">
            <div>
              <span>✓</span>
              <p>Clean and validate your datasets</p>
            </div>

            <div>
              <span>✓</span>
              <p>Generate instant statistics</p>
            </div>

            <div>
              <span>✓</span>
              <p>Visualize your data easily</p>
            </div>
          </div>
        </div>
      </div>

      <div className="register-section">
        <div className="register-card">

          <div className="form-header">
            <h2>Create your account</h2>
            <p>Start your data journey with FlowBI.</p>
          </div>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <PasswordField className="input-group" id="register-password" label="Password" name="password" placeholder="Create a password" autoComplete="new-password" value={formData.password} onChange={handleChange} />
            <PasswordField className="input-group" id="confirm-password" label="Confirm Password" name="confirmPassword" placeholder="Confirm your password" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} />

            <button type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create Account"}
              <span>→</span>
            </button>

          </form>

          <p className="login-text">
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Register;
