import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await login(form.email, form.password);

      if (response.student?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT SIDE */}
        <div className="auth-visual">
          <div className="auth-visual-overlay"></div>

          <div className="auth-visual-content">
            <Link to="/" className="auth-home-link">
              ← Back to Home
            </Link>

            <div className="visual-brand">
              <div className="visual-brand-icon">
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
                <strong>New Drishti</strong>
                <span>LIBRARY</span>
              </div>
            </div>

            <div className="visual-main">
              <span className="visual-badge">✦ YOUR STUDY SPACE</span>

              <h1>
                Your Dreams
                <br />
                <span>Deserve Focus.</span>
              </h1>

              <p>
                A peaceful place to study, prepare and work towards the future
                you dream about.
              </p>

              <div className="visual-features">
                <div className="visual-feature">
                  <span>📚</span>
                  <div>
                    <strong>250+ Seats</strong>
                    <small>Dedicated study spaces</small>
                  </div>
                </div>

                <div className="visual-feature">
                  <span>⏰</span>
                  <div>
                    <strong>24×7 Access</strong>
                    <small>Study according to your routine</small>
                  </div>
                </div>

                <div className="visual-feature">
                  <span>💧</span>
                  <div>
                    <strong>Complete Facilities</strong>
                    <small>Water, refreshment, Wi-Fi & more</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-quote">
              <span>“</span>
              <p>
                One focused hour today can become the achievement you celebrate
                tomorrow.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-side">
          <div className="auth-card">
            <div className="auth-brand mobile-brand">
              <div className="brand-icon">
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
                <p>Smart Library Management System</p>
              </div>
            </div>

            <div className="auth-header">
              <span className="login-small-label">STUDENT / ADMIN LOGIN</span>

              <h2>Welcome Back 👋</h2>

              <p>Login to access your library account</p>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>

                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>NEW TO NEW DRISHTI?</span>
            </div>

            <div className="auth-footer">
              <span>Don't have an account?</span>

              <Link to="/register">Create Account →</Link>
            </div>

            <div className="login-security">
              <span>🔐</span>
              <p>Your account information is securely protected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
