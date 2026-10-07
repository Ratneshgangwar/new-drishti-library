import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

import api from "../../services/api";

import SeatMap from "../../components/SeatMap";

export default function Dashboard() {
  const navigate = useNavigate();

  const { student, logout } = useAuth();

  const [profile, setProfile] = useState(student || null);

  /*
   * IMPORTANT:
   * We track the URL of the photo that failed to load.
   *
   * This avoids calling setState() directly inside an effect
   * and therefore removes the React 19 set-state-in-effect ESLint error.
   */
  const [failedProfilePhoto, setFailedProfilePhoto] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadLatestProfile = async () => {
      try {
        const response = await api.get("/students/profile");

        if (!mounted) {
          return;
        }

        if (response.data?.success && response.data?.student) {
          setProfile(response.data.student);
        }
      } catch (profileError) {
        console.error(
          "Dashboard profile loading error:",
          profileError.response?.data?.message || profileError.message,
        );

        if (mounted) {
          setProfile(student || null);
        }
      }
    };

    if (student?._id) {
      loadLatestProfile();
    }

    return () => {
      mounted = false;
    };
  }, [student]);

  const [seats, setSeats] = useState([]);

  const [loading, setLoading] = useState(() => !student?._id);

  const [requestingSeatId, setRequestingSeatId] = useState(null);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  /* =====================================================
     LOAD SEATS
  ===================================================== */

  useEffect(() => {
    if (!student?._id) {
      return;
    }

    let cancelled = false;

    const loadSeats = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await api.get("/seats");

        if (cancelled) {
          return;
        }

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to load seats");
        }

        const seatList = Array.isArray(response.data.seats)
          ? response.data.seats
          : [];

        setSeats(seatList);
      } catch (seatError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Seat loading error:",
          seatError.response?.data?.message || seatError.message,
        );

        setError(
          seatError.response?.data?.message || "Unable to load library seats.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSeats();

    return () => {
      cancelled = true;
    };
  }, [student]);

  /* =====================================================
     CURRENT SEAT
  ===================================================== */

  let currentSeat = null;

  if (
    student?.seat &&
    typeof student.seat === "object" &&
    student.seat.seatNumber
  ) {
    currentSeat = student.seat;
  }

  if (!currentSeat && seats.length > 0) {
    currentSeat = seats.find((seat) => {
      if (!seat?.student) {
        return false;
      }

      if (typeof seat.student === "object") {
        if (
          seat.student._id &&
          String(seat.student._id) === String(student?._id)
        ) {
          return true;
        }

        if (
          seat.student.studentId &&
          student?.studentId &&
          String(seat.student.studentId) === String(student.studentId)
        ) {
          return true;
        }

        return false;
      }

      return String(seat.student) === String(student?._id);
    });
  }

  /* =====================================================
     SEAT STATISTICS
  ===================================================== */

  const normalSeats = seats.filter((seat) => seat.seatType === "NORMAL");

  const specialSeats = seats.filter((seat) => seat.seatType === "SPECIAL");

  const availableSeats = seats.filter((seat) => seat.status === "AVAILABLE");

  const occupiedSeats = seats.filter((seat) => seat.status === "OCCUPIED");

  const reservedSeats = seats.filter((seat) => seat.status === "RESERVED");

  const blockedSeats = seats.filter((seat) => seat.status === "BLOCKED");

  /* =====================================================
     REFRESH SEATS
  ===================================================== */

  const refreshSeats = async () => {
    try {
      const response = await api.get("/seats");

      if (response.data?.success) {
        const seatList = Array.isArray(response.data.seats)
          ? response.data.seats
          : [];

        setSeats(seatList);
      }
    } catch (refreshError) {
      console.error(
        "Seat refresh error:",
        refreshError.response?.data?.message || refreshError.message,
      );
    }
  };

  /* =====================================================
     REQUEST SEAT
  ===================================================== */

  const handleRequestSeat = async (seat) => {
    if (!seat || seat.status !== "AVAILABLE") {
      return;
    }

    if (currentSeat) {
      setError(`You already have seat ${currentSeat.seatNumber} allocated.`);

      return;
    }

    const confirmed = window.confirm(
      `Do you want to request seat ${seat.seatNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRequestingSeatId(seat._id);

      setMessage("");

      setError("");

      const response = await api.post("/seat-requests", {
        seatId: seat._id,
        reason: `Requesting seat ${seat.seatNumber}`,
      });

      if (response.data?.success) {
        setMessage(`Seat ${seat.seatNumber} request submitted successfully.`);

        await refreshSeats();
      }
    } catch (requestError) {
      console.error(
        "Seat request error:",
        requestError.response?.data?.message || requestError.message,
      );

      setError(
        requestError.response?.data?.message || "Unable to request this seat.",
      );
    } finally {
      setRequestingSeatId(null);
    }
  };

  const currentSeatNumber = currentSeat?.seatNumber || null;

  const currentSeatId = currentSeat?._id || null;

  /* =====================================================
     PROFILE PHOTO
  ===================================================== */

  const resolvePhotoUrl = (value) => {
    if (!value) {
      return "";
    }

    const rawValue = String(value).trim();

    if (!rawValue) {
      return "";
    }

    if (/^https?:\/\//i.test(rawValue)) {
      return rawValue;
    }

    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const serverBaseUrl = apiBaseUrl
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

    if (rawValue.startsWith("/uploads/")) {
      return `${serverBaseUrl}${rawValue}`;
    }

    return `${serverBaseUrl}/${rawValue.replace(/^\/+/, "")}`;
  };

  const profilePhoto = resolvePhotoUrl(
    profile?.photo?.url || profile?.photo?.secure_url || "",
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="dashboard-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="admin-brand-logo" title="New Drishti Library">
            {/* LIBRARY LOGO — PATH UNCHANGED */}

            <img
              src="LibraryLogo.png"
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

            <span>Student Dashboard</span>
          </div>
        </div>

        <div className="header-right">
          {/* PROFILE MINI CARD */}

          <button
            type="button"
            className="student-profile-button"
            onClick={() => navigate("/profile")}
          >
            <div className="student-avatar">
              {profilePhoto && failedProfilePhoto !== profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profile?.fullName || "Student"}
                  onError={() => setFailedProfilePhoto(profilePhoto)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                    display: "block",
                  }}
                />
              ) : (
                <span>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || "S"}
                </span>
              )}
            </div>

            <div className="header-student">
              <strong>{profile?.fullName || "Student"}</strong>

              <span>{profile?.studentId || ""}</span>
            </div>

            <span className="profile-arrow">→</span>
          </button>

          <button type="button" className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-content">
        {/* WELCOME */}

        <section className="welcome-section">
          <div>
            <p className="small-label">Welcome back</p>

            <h2>{profile?.fullName || "Student"}</h2>

            <p>Manage your library account and seat from one place.</p>
          </div>

          <div
            className={`account-badge ${
              profile?.accountStatus === "active" ? "active" : ""
            }`}
          >
            {profile?.accountStatus || "pending"}
          </div>
        </section>

        {/* SUCCESS */}

        {message && (
          <div className="success-message">
            <span>✓</span>

            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="error-message dashboard-error">
            <span>!</span>

            {error}
          </div>
        )}

        {/* =================================================
            PROFILE QUICK CARD
        ================================================= */}

        <section className="dashboard-profile-card">
          <div className="dashboard-profile-left">
            <div className="dashboard-large-avatar">
              {profilePhoto && failedProfilePhoto !== profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profile?.fullName || "Student"}
                  onError={() => setFailedProfilePhoto(profilePhoto)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                    display: "block",
                  }}
                />
              ) : (
                <span>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || "S"}
                </span>
              )}
            </div>

            <div className="dashboard-profile-info">
              <span className="profile-card-label">MY PROFILE</span>

              <h3>{profile?.fullName || "Student"}</h3>

              <p>{profile?.email || "No email available"}</p>

              <span className="profile-student-id">
                {profile?.studentId || "Student"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="profile-view-button"
            onClick={() => navigate("/profile")}
          >
            View Profile
            <span>→</span>
          </button>
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">ID</div>

            <div>
              <span className="stat-label">Student ID</span>

              <strong>{profile?.studentId || "—"}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">💺</div>

            <div>
              <span className="stat-label">My Seat</span>

              <strong>
                {loading ? "..." : currentSeatNumber || "Not Allocated"}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon teal">✓</div>

            <div>
              <span className="stat-label">Available</span>

              <strong>{loading ? "..." : availableSeats.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">250</div>

            <div>
              <span className="stat-label">Total Seats</span>

              <strong>{seats.length || 250}</strong>
            </div>
          </div>
        </section>

        {/* =================================================
            CURRENT SEAT
        ================================================= */}

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>My Current Seat</h3>

              <p>Your currently allocated library seat</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">💺</div>

              <h3>Loading Seat...</h3>

              <p>Fetching your current seat.</p>
            </div>
          ) : currentSeat ? (
            <div className="current-seat">
              <div className="seat-icon">{currentSeat.seatNumber}</div>

              <div className="current-seat-info">
                <h3>Seat {currentSeat.seatNumber}</h3>

                <p>
                  Type: <strong>{currentSeat.seatType || "NORMAL"}</strong>
                </p>

                <span className="status-occupied">
                  {currentSeat.status || "OCCUPIED"}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💺</div>

              <h3>No Seat Allocated</h3>

              <p>No seat is currently allocated to your account.</p>
            </div>
          )}
        </section>

        {/* =================================================
            LIVE SEAT MAP
        ================================================= */}

        <section className="dashboard-card seat-map-card">
          <div className="card-header">
            <div>
              <h3>Library Seat Map</h3>

              <p>Select an available seat to request it.</p>
            </div>

            <div className="live-badge">
              <span></span>
              LIVE
            </div>
          </div>

          {/* SEAT SUMMARY */}

          <div className="seat-summary">
            <div>
              <strong>{normalSeats.length}</strong>

              <span>Normal Seats</span>
            </div>

            <div>
              <strong>{specialSeats.length}</strong>

              <span>Special Seats</span>
            </div>

            <div className="available-summary">
              <strong>{availableSeats.length}</strong>

              <span>Available</span>
            </div>

            <div className="occupied-summary">
              <strong>{occupiedSeats.length}</strong>

              <span>Occupied</span>
            </div>

            <div className="reserved-summary">
              <strong>{reservedSeats.length}</strong>

              <span>Reserved</span>
            </div>

            <div className="blocked-summary">
              <strong>{blockedSeats.length}</strong>

              <span>Blocked</span>
            </div>
          </div>

          {/* SEAT MAP */}

          {loading ? (
            <div className="seat-loading">
              <div className="loading-spinner"></div>

              <p>Loading live seat map...</p>
            </div>
          ) : seats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🪑</div>

              <h3>No Seats Found</h3>

              <p>Unable to load library seats.</p>
            </div>
          ) : (
            <SeatMap
              seats={seats}
              currentSeatId={currentSeatId}
              onRequestSeat={handleRequestSeat}
              requestingSeatId={requestingSeatId}
            />
          )}
        </section>

        <p className="seat-map-help">
          Click an <strong>AVAILABLE</strong> seat to submit a seat request.
          Admin approval is required before the seat is allocated.
        </p>
      </main>
    </div>
  );
}
