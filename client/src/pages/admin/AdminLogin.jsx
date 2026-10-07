import { useState } from "react";
import { useNavigate } from "react-router-dom";

import adminApi from "../../services/adminApi";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      console.log("=================================");
      console.log("ADMIN LOGIN REQUEST");
      console.log("EMAIL:", email);

      const response = await adminApi.post("/admin/login", {
        email,
        password,
      });

      console.log("ADMIN LOGIN RESPONSE:", response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Admin login failed.");
      }

      const token = response.data?.token;
      const admin = response.data?.admin;

      if (!token) {
        throw new Error("Admin login succeeded but token was not received.");
      }

      /*
       * ADMIN AUTHENTICATION
       *
       * Keep admin authentication completely
       * separate from student authentication.
       */

      localStorage.setItem("library_admin_token", token);

      localStorage.setItem("library_admin", JSON.stringify(admin || {}));

      console.log("ADMIN TOKEN SAVED SUCCESSFULLY");

      /*
       * Go directly to admin dashboard.
       */

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("=================================");

      console.error("ADMIN LOGIN ERROR:", err);

      console.error("ADMIN LOGIN RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to login as administrator.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      {/* =====================================================
          LEFT VISUAL
      ====================================================== */}

      <section className="admin-login-visual">
        <div className="admin-login-overlay" />

        <div className="admin-login-brand">
          <div className="admin-brand-logo">
            <img
              src="/LibraryLogo.png"
              alt="New Drishti Library"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "inherit",
                display: "block",
              }}
            />
          </div>

          <div>
            <h1>New Drishti Library</h1>

            <p>Library Administration Portal</p>
          </div>
        </div>

        <div className="admin-login-visual-content">
          <span className="admin-login-badge">ADMIN PORTAL</span>

          <h2>
            Manage your library.
            <br />
            <span>Empower every learner.</span>
          </h2>

          <p>
            Manage students, seats, requests and library operations from one
            secure administration dashboard.
          </p>

          <div className="admin-login-highlights">
            <div>
              <strong>250+</strong>
              <span>Seats</span>
            </div>

            <div>
              <strong>24×7</strong>
              <span>Library</span>
            </div>

            <div>
              <strong>Secure</strong>
              <span>Management</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOGIN FORM
      ====================================================== */}

      <section className="admin-login-form-section">
        <div className="admin-login-card">
          <div className="admin-login-mobile-logo">
            <div className="admin-brand-logo">
              <img
                src="/LibraryLogo.png"
                alt="New Drishti Library"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "inherit",
                  display: "block",
                }}
              />
            </div>
          </div>

          <div className="admin-login-heading">
            <span>Welcome back</span>

            <h2>Admin Login</h2>

            <p>Sign in to manage New Drishti Library.</p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="admin-login-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}

            <div className="admin-form-group">
              <label htmlFor="admin-email">Email Address</label>

              <div className="admin-input-wrapper">
                <span className="admin-input-icon">@</span>

                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter admin email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="admin-form-group">
              <label htmlFor="admin-password">Password</label>

              <div className="admin-input-wrapper">
                <span className="admin-input-icon">•</span>

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* LOGIN */}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* HOME */}

          <button
            type="button"
            className="admin-back-home"
            onClick={() => navigate("/")}
          >
            ← Back to New Drishti Library
          </button>

          {/* SECURITY */}

          <div className="admin-security-note">
            <span>✓</span>

            <p>
              Secure administrator access. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
