import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="navbar-logo">
        <div className="logo-icon">
          F
        </div>

        <div className="logo-text">
          <span>Flow</span>BI
        </div>
      </Link>


      <div className="navbar-links">

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/history"
          className="nav-link"
        >
          History
        </NavLink>

      </div>


      <div className="navbar-actions">

        <Link to="/login" className="login-link">
          Login
        </Link>

        <Link to="/register" className="register-btn">
          Get Started
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;