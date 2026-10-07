import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    fatherName: "",
    motherName: "",
    address: "",
    course: "",
  });

  const [photo, setPhoto] = useState(null);
  const [aadhaar, setAadhaar] = useState(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [aadhaarPreview, setAadhaarPreview] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid student photo.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Student photo must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setPhoto(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleAadhaarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Aadhaar card must be JPG, PNG or PDF.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Aadhaar document must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setAadhaar(file);

    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setAadhaarPreview(previewUrl);
    } else {
      setAadhaarPreview("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const requiredFields = [
      "fullName",
      "mobile",
      "email",
      "password",
      "fatherName",
      "address",
    ];

    const missingField = requiredFields.some((field) => !form[field].trim());

    if (missingField) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!photo) {
      setError("Please upload your passport-size photo.");
      return;
    }

    if (!aadhaar) {
      setError("Please upload your Aadhaar card.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("fullName", form.fullName.trim());
      formData.append("mobile", form.mobile.trim());
      formData.append("email", form.email.trim());
      formData.append("password", form.password);

      formData.append("fatherName", form.fatherName.trim());

      formData.append("motherName", form.motherName.trim());

      formData.append("address", form.address.trim());
      formData.append("course", form.course.trim());

      formData.append("photo", photo);
      formData.append("aadhaarDocument", aadhaar);

      await register(formData);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="register-container">
        {/* ================= LEFT SIDE ================= */}

        <div className="register-visual">
          <div className="register-visual-overlay"></div>

          <div className="register-visual-content">
            <div className="register-brand">
              <div className="register-brand-icon">
                <img
                  src="/LibraryLogo.png"
                  alt="New Drishti Library logo"
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

            <div className="register-hero-content">
              <span className="register-badge">✦ START YOUR JOURNEY</span>

              <h1>
                Build Your
                <br />
                <span>Future Here.</span>
              </h1>

              <p>
                Create your library account and get access to a peaceful,
                focused and productive environment designed for your dreams.
              </p>

              <div className="register-motivation">
                <div className="motivation-item">
                  <span>📚</span>

                  <div>
                    <strong>Study With Focus</strong>

                    <small>
                      A peaceful environment for serious preparation.
                    </small>
                  </div>
                </div>

                <div className="motivation-item">
                  <span>🎯</span>

                  <div>
                    <strong>Stay Consistent</strong>

                    <small>Small daily efforts create big results.</small>
                  </div>
                </div>

                <div className="motivation-item">
                  <span>🚀</span>

                  <div>
                    <strong>Achieve Your Goals</strong>

                    <small>Your preparation today builds your tomorrow.</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="register-quote">
              <span>“</span>

              <p>
                Don't study only for an exam.
                <br />
                Study for the life you want to create.
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="register-form-side">
          <div className="register-card">
            <div className="register-mobile-brand">
              <div className="brand-icon">
                <img
                  src="/LibraryLogo.png"
                  alt="New Drishti Library logo"
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

            <div className="register-header">
              <span className="register-small-label">CREATE YOUR ACCOUNT</span>

              <h2>Student Registration</h2>

              <p>Enter your details and upload your documents</p>
            </div>

            {error && (
              <div className="error-message register-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* ================= PERSONAL DETAILS ================= */}

              <div className="registration-section-title">
                <span>01</span>

                <div>
                  <strong>Personal Information</strong>
                  <small>Tell us about yourself</small>
                </div>
              </div>

              <div className="form-grid">
                {/* FULL NAME */}

                <div className="form-group">
                  <label>
                    Full Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>

                {/* MOBILE */}

                <div className="form-group">
                  <label>
                    Mobile Number <span>*</span>
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>

                {/* EMAIL */}

                <div className="form-group">
                  <label>
                    Email Address <span>*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>

                {/* PASSWORD */}

                <div className="form-group">
                  <label>
                    Password <span>*</span>
                  </label>

                  <input
                    type="password"
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>

                {/* FATHER NAME */}

                <div className="form-group">
                  <label>
                    Father's Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="fatherName"
                    placeholder="Enter father's name"
                    value={form.fatherName}
                    onChange={handleChange}
                  />
                </div>

                {/* MOTHER NAME */}

                <div className="form-group">
                  <label>Mother's Name</label>

                  <input
                    type="text"
                    name="motherName"
                    placeholder="Enter mother's name"
                    value={form.motherName}
                    onChange={handleChange}
                  />
                </div>

                {/* COURSE */}

                <div className="form-group">
                  <label>Course</label>

                  <input
                    type="text"
                    name="course"
                    placeholder="e.g. B.Tech CSE"
                    value={form.course}
                    onChange={handleChange}
                  />
                </div>

                {/* ADDRESS */}

                <div className="form-group full-width">
                  <label>
                    Address <span>*</span>
                  </label>

                  <textarea
                    name="address"
                    placeholder="Enter your complete address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>

              {/* ================= DOCUMENTS ================= */}

              <div className="registration-section-title documents-title">
                <span>02</span>

                <div>
                  <strong>Identity & Documents</strong>

                  <small>Upload your photo and Aadhaar card</small>
                </div>
              </div>

              <div className="document-upload-grid">
                {/* ================= PHOTO ================= */}

                <div className="upload-card">
                  <div className="upload-card-header">
                    <div className="upload-icon photo-icon">📷</div>

                    <div>
                      <h3>Student Photo</h3>
                      <p>Passport-size photo</p>
                    </div>
                  </div>

                  {photoPreview ? (
                    <div className="photo-preview-box">
                      <img src={photoPreview} alt="Student preview" />

                      <button
                        type="button"
                        className="change-file-button"
                        onClick={() =>
                          document.getElementById("student-photo")?.click()
                        }
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="student-photo" className="upload-dropzone">
                      <div className="upload-cloud">☁️</div>

                      <strong>Click to upload photo</strong>

                      <span>JPG, JPEG or PNG • Max 2 MB</span>
                    </label>
                  )}

                  <input
                    id="student-photo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </div>

                {/* ================= AADHAAR DOCUMENT ================= */}

                <div className="upload-card">
                  <div className="upload-card-header">
                    <div className="upload-icon aadhaar-icon">🪪</div>

                    <div>
                      <h3>Aadhaar Card</h3>

                      <p>Identity verification document</p>
                    </div>
                  </div>

                  {aadhaar ? (
                    <div className="file-selected-box">
                      {aadhaarPreview ? (
                        <img
                          src={aadhaarPreview}
                          alt="Aadhaar preview"
                          className="aadhaar-preview"
                        />
                      ) : (
                        <div className="pdf-preview">
                          <span>📄</span>
                          <strong>PDF Document</strong>
                        </div>
                      )}

                      <div className="selected-file-info">
                        <strong>{aadhaar.name}</strong>

                        <small>
                          {(aadhaar.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </div>

                      <button
                        type="button"
                        className="change-file-button"
                        onClick={() =>
                          document.getElementById("aadhaar-document")?.click()
                        }
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="aadhaar-document"
                      className="upload-dropzone"
                    >
                      <div className="upload-cloud">🪪</div>

                      <strong>Click to upload Aadhaar</strong>

                      <span>JPG, PNG or PDF • Max 5 MB</span>
                    </label>
                  )}

                  <input
                    id="aadhaar-document"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleAadhaarChange}
                    hidden
                  />
                </div>
              </div>

              <div className="document-note">
                <span>🔒</span>

                <p>
                  Your documents are collected only for library verification and
                  account management.
                </p>
              </div>

              {/* ================= SUBMIT ================= */}

              <button
                type="submit"
                className="primary-button register-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    Create Library Account
                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>ALREADY REGISTERED?</span>
            </div>

            <div className="auth-footer">
              <span>Already have an account?</span>

              <Link to="/login">Login →</Link>
            </div>

            <div className="register-security">
              <span>🔐</span>
              <p>Your information is securely protected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
