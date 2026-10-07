import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

import api from "../../services/api";

export default function Profile() {
  const navigate = useNavigate();

  const { student } = useAuth();

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(student || null);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [preview, setPreview] = useState("");

  const [failedPhotoUrl, setFailedPhotoUrl] = useState("");

  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // RESOLVE SERVER FILE URL
  // =====================================================

  const resolveFileUrl = (file) => {
    if (!file) {
      return "";
    }

    /*
     * IMPORTANT:
     * Always prefer backend's actual URL first.
     *
     * Backend already returns:
     * http://localhost:5000/uploads/filename.jpg
     *
     * publicId is only a fallback.
     */

    const rawUrl =
      typeof file === "string" ? file : file?.url || file?.secure_url || "";

    const publicId = typeof file === "object" ? file?.publicId || "" : "";

    /*
     * If backend already gave us a complete URL,
     * use it directly.
     */

    if (rawUrl && /^https?:\/\//i.test(String(rawUrl).trim())) {
      return String(rawUrl).trim();
    }

    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const serverBaseUrl = apiBaseUrl
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

    /*
     * Backend may return:
     * /uploads/file.jpg
     */

    if (rawUrl && String(rawUrl).startsWith("/uploads/")) {
      return `${serverBaseUrl}${rawUrl}`;
    }

    /*
     * If only filename/publicId exists,
     * construct uploads URL.
     */

    if (publicId) {
      return `${serverBaseUrl}/uploads/${String(publicId).replace(/^\/+/, "")}`;
    }

    /*
     * Last fallback.
     */

    if (rawUrl) {
      return `${serverBaseUrl}/${String(rawUrl).replace(/^\/+/, "")}`;
    }

    return "";
  };

  // =====================================================
  // LOAD LATEST PROFILE
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await api.get("/students/profile");

        if (!mounted) {
          return;
        }

        if (response.data?.success && response.data?.student) {
          const latestStudent = response.data.student;

          setProfile(latestStudent);

          const latestPhotoUrl = resolveFileUrl(latestStudent?.photo);

          setPreview(latestPhotoUrl);

          setFailedPhotoUrl("");
        }
      } catch (profileError) {
        console.error(
          "Profile loading error:",
          profileError.response?.data?.message || profileError.message,
        );

        if (mounted) {
          setError(
            profileError.response?.data?.message || "Unable to load profile.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // SELECT PHOTO
  // =====================================================

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");

    setError("");

    /*
     * Only image files.
     */

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");

      event.target.value = "";

      return;
    }

    /*
     * Maximum 2 MB.
     */

    if (file.size > 2 * 1024 * 1024) {
      setError("Photo size must be less than 2 MB.");

      event.target.value = "";

      return;
    }

    setSelectedPhoto(file);

    /*
     * Temporary preview.
     */

    const previewUrl = URL.createObjectURL(file);

    setPreview(previewUrl);

    setFailedPhotoUrl("");
  };

  // =====================================================
  // CHANGE PHOTO
  // =====================================================

  const handleChangePhoto = async () => {
    if (!selectedPhoto) {
      setError("Please select a new photo first.");

      return;
    }

    try {
      setSaving(true);

      setMessage("");

      setError("");

      const formData = new FormData();

      formData.append("photo", selectedPhoto);

      /*
       * Upload photo.
       */

      const response = await api.put("/students/profile/photo", formData);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update profile photo.",
        );
      }

      /*
       * Backend has successfully saved
       * the new photo.
       */

      const updatedStudent = response.data.student || response.data.profile;

      if (updatedStudent) {
        setProfile(updatedStudent);

        /*
         * IMPORTANT:
         * Use backend's URL first.
         */

        const serverPhotoUrl = resolveFileUrl(updatedStudent.photo);

        if (serverPhotoUrl) {
          setPreview(serverPhotoUrl);
        }

        setFailedPhotoUrl("");

        /*
         * Update local student data.
         */

        try {
          localStorage.setItem(
            "library_student",
            JSON.stringify(updatedStudent),
          );
        } catch (storageError) {
          console.warn("Unable to update local student data:", storageError);
        }

        /*
         * Notify other components.
         */

        window.dispatchEvent(new Event("auth-changed"));
      }

      /*
       * IMPORTANT:
       * Fetch profile again from MongoDB.
       *
       * This guarantees that the UI shows
       * the photo actually saved in DB.
       */

      try {
        const latestResponse = await api.get("/students/profile");

        if (latestResponse.data?.success && latestResponse.data?.student) {
          const latestStudent = latestResponse.data.student;

          setProfile(latestStudent);

          const latestPhotoUrl = resolveFileUrl(latestStudent.photo);

          setPreview(latestPhotoUrl);

          setFailedPhotoUrl("");

          try {
            localStorage.setItem(
              "library_student",
              JSON.stringify(latestStudent),
            );
          } catch (storageError) {
            console.warn("Unable to update local student data:", storageError);
          }

          window.dispatchEvent(new Event("auth-changed"));
        }
      } catch (refreshError) {
        console.warn(
          "Profile refresh after photo upload failed:",
          refreshError.response?.data?.message || refreshError.message,
        );
      }

      /*
       * Clear selected file.
       */

      setSelectedPhoto(null);

      /*
       * Success message.
       */

      setMessage("Profile photo updated successfully.");

      /*
       * Reset file input.
       */

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (photoError) {
      console.error(
        "Photo update error:",
        photoError.response?.data?.message || photoError.message,
      );

      setError(
        photoError.response?.data?.message ||
          photoError.message ||
          "Unable to update profile photo.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CANCEL PHOTO CHANGE
  // =====================================================

  const handleCancelPhoto = () => {
    setSelectedPhoto(null);

    const existingPhotoUrl = resolveFileUrl(profile?.photo);

    setPreview(existingPhotoUrl);

    setFailedPhotoUrl("");

    setMessage("");

    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // PROFILE PHOTO
  // =====================================================

  const profilePhoto = resolveFileUrl(profile?.photo);

  const avatarLetter = profile?.fullName?.charAt(0)?.toUpperCase() || "S";

  // =====================================================
  // AADHAAR DOCUMENT
  // =====================================================

  const aadhaarUrl = resolveFileUrl(profile?.aadhaarDocument);

  const isAadhaarPdf = /\.pdf(?:$|\?)/i.test(aadhaarUrl);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>

          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="profile-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="profile-header">
        <div className="profile-header-brand">
          <div className="profile-library-logo">
            <div className="profile-library-logo-mark">
              {/* LIBRARY LOGO ONLY */}

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

            <div className="profile-library-logo-text">
              <h1>New Drishti Library</h1>

              <span>My Profile</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="profile-dashboard-button"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard →
        </button>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="profile-content">
        {/* PAGE HEADING */}

        <div className="profile-page-heading">
          <div>
            <span className="profile-small-label">ACCOUNT</span>

            <h2>My Profile</h2>

            <p>View and manage your library account information.</p>
          </div>

          <div
            className={`profile-status ${
              profile?.accountStatus === "active" ? "active" : ""
            }`}
          >
            <span></span>

            {profile?.accountStatus || "pending"}
          </div>
        </div>

        {/* SUCCESS */}

        {message && (
          <div className="profile-success">
            <span>✓</span>

            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="profile-error">
            <span>!</span>

            {error}
          </div>
        )}

        {/* =================================================
            PROFILE PHOTO
        ================================================= */}

        <section className="profile-hero-card">
          <div className="profile-photo-section">
            <div className="profile-main-avatar">
              {preview && failedPhotoUrl !== preview ? (
                <img
                  src={preview}
                  alt={profile?.fullName || "Student"}
                  onError={() => setFailedPhotoUrl(preview)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                    display: "block",
                  }}
                />
              ) : profilePhoto && failedPhotoUrl !== profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profile?.fullName || "Student"}
                  onError={() => setFailedPhotoUrl(profilePhoto)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                    display: "block",
                  }}
                />
              ) : (
                <span>{avatarLetter}</span>
              )}
            </div>

            <div className="profile-photo-info">
              <span className="profile-photo-label">PROFILE PHOTO</span>

              <h3>{profile?.fullName || "Student"}</h3>

              <p>{profile?.studentId || "Student ID"}</p>

              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                hidden
              />

              <div className="profile-photo-actions">
                <button
                  type="button"
                  className="choose-photo-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  📷 Change Photo
                </button>

                {selectedPhoto && (
                  <>
                    <button
                      type="button"
                      className="save-photo-button"
                      onClick={handleChangePhoto}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Photo"}
                    </button>

                    <button
                      type="button"
                      className="cancel-photo-button"
                      onClick={handleCancelPhoto}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              <small>JPG, PNG or WEBP • Maximum 2 MB</small>
            </div>
          </div>
        </section>

        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-section-number">01</div>

            <div>
              <h3>Personal Information</h3>

              <p>Your basic account information</p>
            </div>
          </div>

          <div className="profile-details-grid">
            <ProfileField label="Full Name" value={profile?.fullName} />

            <ProfileField label="Student ID" value={profile?.studentId} />

            <ProfileField label="Mobile Number" value={profile?.mobile} />

            <ProfileField label="Email Address" value={profile?.email} />

            <ProfileField label="Father's Name" value={profile?.fatherName} />

            <ProfileField label="Mother's Name" value={profile?.motherName} />

            <ProfileField label="Course" value={profile?.course} />

            <ProfileField
              label="Account Status"
              value={profile?.accountStatus}
              status
            />

            <div className="profile-detail-item full">
              <span>Address</span>

              <strong>{profile?.address || "Not provided"}</strong>
            </div>
          </div>
        </section>

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-section-number">02</div>

            <div>
              <h3>Documents</h3>

              <p>Verification information</p>
            </div>
          </div>

          <div className="document-status-grid">
            {/* =================================================
                AADHAAR DOCUMENT
            ================================================= */}

            <div
              className="document-status-card"
              style={{
                alignItems: "flex-start",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  width: "100%",
                }}
              >
                <div className="document-status-icon">🪪</div>

                <div>
                  <span>Aadhaar Document</span>

                  <strong className={aadhaarUrl ? "verified" : "pending"}>
                    {aadhaarUrl
                      ? profile?.aadhaarDocument?.verified
                        ? "Uploaded • Verified"
                        : "Uploaded • Verification Pending"
                      : "Not Uploaded"}
                  </strong>
                </div>
              </div>

              {aadhaarUrl && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "12px",
                  }}
                >
                  {isAadhaarPdf ? (
                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "10px",
                        background: "#f4f7fa",
                        border: "1px solid #e2e8ee",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "34px",
                        }}
                      >
                        📄
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "6px",
                        }}
                      >
                        Aadhaar PDF Document
                      </strong>
                    </div>
                  ) : (
                    <img
                      src={aadhaarUrl}
                      alt="Aadhaar document"
                      style={{
                        width: "100%",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "10px",
                        border: "1px solid #e2e8ee",
                        background: "#fff",
                        display: "block",
                      }}
                    />
                  )}

                  <a
                    href={aadhaarUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginTop: "10px",
                      padding: "9px 14px",
                      borderRadius: "8px",
                      background: "#173a63",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    Open Aadhaar Document ↗
                  </a>
                </div>
              )}
            </div>

            {/* =================================================
                PROFILE PHOTO DOCUMENT
            ================================================= */}

            <div
              className="document-status-card"
              style={{
                alignItems: "flex-start",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  width: "100%",
                }}
              >
                <div className="document-status-icon">👤</div>

                <div>
                  <span>Profile Photo</span>

                  <strong className={profilePhoto ? "verified" : "pending"}>
                    {profilePhoto ? "Uploaded" : "Not Uploaded"}
                  </strong>
                </div>
              </div>

              {profilePhoto && (
                <img
                  src={profilePhoto}
                  alt={profile?.fullName || "Student"}
                  onError={() => setFailedPhotoUrl(profilePhoto)}
                  style={{
                    width: "110px",
                    height: "110px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginTop: "12px",
                    border: "3px solid #fff",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                  }}
                />
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            SECURITY
        ================================================= */}

        <div className="profile-security-note">
          <span>🔐</span>

          <div>
            <strong>Your information is secure</strong>

            <p>
              Your personal information and documents are protected by the
              library management system.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({ label, value, status = false }) {
  return (
    <div className="profile-detail-item">
      <span>{label}</span>

      <strong
        className={
          status
            ? value === "active"
              ? "profile-value-active"
              : "profile-value-pending"
            : ""
        }
      >
        {value || "Not provided"}
      </strong>
    </div>
  );
}
