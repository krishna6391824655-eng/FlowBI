import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* ========================================
          NAVBAR
      ======================================== */}

      <nav className="landing-navbar">

        <div className="landing-logo">
          FlowBI
        </div>

        <div className="landing-nav-links">

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            type="button"
            className="landing-register"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>

        </div>

      </nav>


      {/* ========================================
          MAIN
      ======================================== */}

      <main className="landing-main">

        {/* ========================================
            HERO
        ======================================== */}

        <section className="landing-hero">

          <div className="landing-hero-content">

            <p className="landing-eyebrow">
              DATA ANALYTICS PLATFORM
            </p>

            <h1>
              Turn your data into
              <span> meaningful insights.</span>
            </h1>

            <p className="landing-description">
              FlowBI helps you upload, clean, analyze and
              visualize your datasets through a simple
              data analytics workflow.
            </p>

            <div className="landing-actions">

              <button
                type="button"
                className="primary-action"
                onClick={() => navigate("/register")}
              >
                Get Started →
              </button>

              <button
                type="button"
                className="secondary-action"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

            </div>

          </div>

        </section>


        {/* ========================================
            WORKFLOW
        ======================================== */}

        <section className="landing-workflow">

          <div className="landing-section-header">

            <p className="landing-section-eyebrow">
              WORKFLOW
            </p>

            <h2>
              Everything you need to work with data
            </h2>

          </div>


          {/* ========================================
              FEATURES
          ======================================== */}

          <div className="landing-features">


            {/* Upload */}

            <div className="landing-feature">

              <div className="landing-feature-icon">
                ↑
              </div>

              <h3>
                Upload Data
              </h3>

              <p>
                Upload CSV or Excel files and preview
                your dataset before processing.
              </p>

            </div>


            {/* Clean */}

            <div className="landing-feature">

              <div className="landing-feature-icon">
                ✓
              </div>

              <h3>
                Clean Data
              </h3>

              <p>
                Handle missing values, duplicates and
                inconsistent data before analysis.
              </p>

            </div>


            {/* Analyze */}

            <div className="landing-feature">

              <div className="landing-feature-icon">
                #
              </div>

              <h3>
                Analyze
              </h3>

              <p>
                Generate statistics and discover
                important patterns in your datasets.
              </p>

            </div>


            {/* AI */}

            <div className="landing-feature">

              <div className="landing-feature-icon">
                ✦
              </div>

              <h3>
              Ask Your Data
              </h3>

              <p>
                Ask questions about row counts, missing values,
                distinct values and numeric columns.
              </p>

            </div>

          </div>

          <div className="landing-actions" style={{ justifyContent: "center", marginTop: 28 }}>
            <button type="button" className="primary-action" onClick={() => navigate(localStorage.getItem("userId") ? "/insights" : "/register")}>
              Explore data insights →
            </button>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Landing;
