import { Link } from "react-router-dom";
import "./Login.css";
import {useState} from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate =useNavigate();
  // Store email and password
  const[formData ,setFormData] = useState({
    email : "",
    password :""
  });
  // Handle input changes
  const handleChange =(e)=>{
    setFormData({
      ...formData,[e.target.name]:e.target.value
    });
  };
  const handleSubmit =async(e)=>{
    e.preventDefault();
   
    const response = await fetch("http://127.0.0.1:8000/login",{ method : "POST" ,
      headers:{
        "content-type":"application/json"
      },
      body:JSON.stringify({
        email:formData.email,
        password:formData.password
      })

  }
);
console.log(response);
const data = await response.json();
console.log(data);
if (!response.ok) {
  alert(data.detail);
  return;
}
localStorage.setItem("userId" ,data.id);
alert("Login successful");

navigate("/");
  };
  return (
    <div className="login-page">

      {/* =========================
          LEFT SECTION
      ========================= */}

      <section className="login-info">

        <div className="login-brand">
          <div className="login-brand-icon">
            F
          </div>

          <span>FlowBI</span>
        </div>


        <div className="login-info-content">

          <p className="login-eyebrow">
            YOUR DATA. YOUR INSIGHTS.
          </p>

          <h1>
            Make your data
            <br />
            <span>work smarter.</span>
          </h1>

          <p className="login-description">
            Manage your datasets, clean your data and discover
            meaningful insights from one powerful platform.
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


      {/* =========================
          RIGHT SECTION
      ========================= */}

      <section className="login-section">

        <div className="login-card">

          <div className="login-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Login to continue to your FlowBI workspace.
            </p>

          </div>


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="login-field">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}

              />

            </div>


            {/* PASSWORD */}

            <div className="login-field">

              <div className="login-password-header">

                <label htmlFor="password">
                  Password
                </label>

                <a href="#">
                  Forgot password?
                </a>

              </div>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit"
            >
              <span>
                Login
              </span>

              <span>
                →
              </span>

            </button>

          </form>


          {/* REGISTER */}

          <p className="login-register-text">

            Don't have an account?

            <Link to="/register">
              Create an account
            </Link>

          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;