import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <h2>FlowBI</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className="sidebar-link">
          🏠 Dashboard
        </Link>

        <Link to="/datasets" className="sidebar-link">
          📁 Datasets
        </Link>

        <Link to="/pipeline" className="sidebar-link">
          ⚙️ Pipeline
        </Link>

        <Link to="/analytics" className="sidebar-link">
          📊 Analytics
        </Link>

        <Link to="/history" className="sidebar-link">
          📜 History
        </Link>

        <Link to="/settings" className="sidebar-link">
          ⚙️ Settings
        </Link>
      </nav>

      <div className="sidebar-bottom">

        <div className="sidebar-user">
          <div className="user-avatar">
            K
          </div>

          <div>
            <strong>Account</strong>
            <small>Profile & Settings</small>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;