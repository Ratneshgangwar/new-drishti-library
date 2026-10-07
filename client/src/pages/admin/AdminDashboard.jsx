import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import adminApi from "../../services/adminApi";

// Change this single path to your actual New Drishti Library logo.
const LIBRARY_LOGO_PATH = "/LibraryLogo.png";

// Convert stored/relative upload URLs to the currently configured backend.
const getServerBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

const resolveFileUrl = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  if (!raw) return "";

  const serverBase = getServerBaseUrl();

  const uploadIndex = raw.indexOf("/uploads/");
  if (uploadIndex >= 0) {
    return `${serverBase}${raw.slice(uploadIndex)}`;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `${serverBase}/${raw.replace(/^\/+/, "")}`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [requestsList, setRequestsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  /* =========================================================
     SEAT MANAGEMENT
  ========================================================= */

  const [seatsList, setSeatsList] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatActionLoading, setSeatActionLoading] = useState(false);
  const [seatSearch, setSeatSearch] = useState("");
  const [seatStatusFilter, setSeatStatusFilter] = useState("all");
  const [seatTypeFilter, setSeatTypeFilter] = useState("all");
  const [seatMessage, setSeatMessage] = useState("");

  /* =========================================================
     STUDENT DETAIL MODAL
  ========================================================= */

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentDetailError, setStudentDetailError] = useState("");

  /* =========================================================
     ADMIN TOKEN
  ========================================================= */

  const getAdminToken = () => localStorage.getItem("library_admin_token");

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = useCallback(() => {
    localStorage.removeItem("library_admin_token");
    localStorage.removeItem("library_admin");

    navigate("/admin/login", {
      replace: true,
    });
  }, [navigate]);

  /* =========================================================
     AUTH ERROR
  ========================================================= */

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        return true;
      }

      return false;
    },
    [logout],
  );

  /* =========================================================
     ADMIN PROFILE
  ========================================================= */

  const loadAdminProfile = useCallback(async () => {
    try {
      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.get("/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setAdmin(response.data.admin);

        localStorage.setItem(
          "library_admin",
          JSON.stringify(response.data.admin),
        );
      }
    } catch (err) {
      console.error("Admin Profile Error:", err);

      if (!handleAuthError(err)) {
        const cachedAdmin = localStorage.getItem("library_admin");

        if (cachedAdmin) {
          try {
            setAdmin(JSON.parse(cachedAdmin));
          } catch {
            localStorage.removeItem("library_admin");
          }
        }
      }
    }
  }, [navigate, handleAuthError]);

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const loadDashboard = useCallback(async () => {
    try {
      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.get("/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load dashboard.");
      }

      setDashboard(response.data);
      setError("");
    } catch (err) {
      console.error("Admin Dashboard Error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.message || "Unable to load dashboard data.",
        );
      }
    }
  }, [navigate, handleAuthError]);

  /* =========================================================
     STUDENTS
  ========================================================= */

  const loadStudents = useCallback(
    async (selectedSearch = search, selectedStatus = statusFilter) => {
      try {
        setStudentsLoading(true);

        const token = getAdminToken();

        if (!token) {
          navigate("/admin/login", {
            replace: true,
          });
          return;
        }

        const params = {};

        if (selectedStatus && selectedStatus !== "all") {
          params.status = selectedStatus;
        }

        if (selectedSearch.trim()) {
          params.search = selectedSearch.trim();
        }

        const response = await adminApi.get("/admin/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to load students.");
        }

        setStudents(response.data.students || []);
        setError("");
      } catch (err) {
        console.error("Students Error:", err);

        if (!handleAuthError(err)) {
          setError(err.response?.data?.message || "Unable to load students.");
        }
      } finally {
        setStudentsLoading(false);
      }
    },
    [navigate, search, statusFilter, handleAuthError],
  );

  /* =========================================================
     SEAT REQUESTS
  ========================================================= */

  const loadRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      setRequestMessage("");

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.get("/seat-requests/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load seat requests.",
        );
      }

      setRequestsList(response.data.requests || []);
      setError("");
    } catch (err) {
      console.error("Seat Requests Error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.message || "Unable to load seat requests.",
        );
      }
    } finally {
      setRequestsLoading(false);
    }
  }, [navigate, handleAuthError]);

  /* =========================================================
     OPEN STUDENTS
  ========================================================= */

  const openStudents = () => {
    setActiveMenu("students");
    setMobileSidebar(false);
    loadStudents(search, statusFilter);
  };

  /* =========================================================
     OPEN REQUESTS
  ========================================================= */

  const openRequests = () => {
    setActiveMenu("requests");
    setMobileSidebar(false);
    loadRequests();
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const initialise = async () => {
      setLoading(true);

      await Promise.all([loadAdminProfile(), loadDashboard(), loadRequests()]);

      setLoading(false);
    };

    initialise();
  }, [loadAdminProfile, loadDashboard, loadRequests]);

  /* =========================================================
     VIEW STUDENT
  ========================================================= */

  const handleViewStudent = async (studentId) => {
    if (!studentId) return;

    try {
      setStudentDetailLoading(true);
      setStudentDetailError("");
      setSelectedStudent(null);

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.get(`/admin/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load student details.",
        );
      }

      setSelectedStudent(response.data);
    } catch (err) {
      console.error("Student Detail Error:", err);

      if (!handleAuthError(err)) {
        setStudentDetailError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load student details.",
        );
      }
    } finally {
      setStudentDetailLoading(false);
    }
  };

  /* =========================================================
     STUDENT STATUS
  ========================================================= */

  const handleStudentStatus = async (studentId, accountStatus) => {
    try {
      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.patch(
        `/admin/students/${studentId}/status`,
        {
          accountStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update student status.",
        );
      }

      await Promise.all([loadDashboard(), loadStudents(search, statusFilter)]);

      /* Update currently opened student also */
      if (selectedStudent?.student?._id === studentId) {
        setSelectedStudent((previous) => ({
          ...previous,
          student: {
            ...previous.student,
            accountStatus,
          },
        }));
      }
    } catch (err) {
      console.error("Update Student Status Error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.message || "Unable to update student status.",
        );
      }
    }
  };

  /* =========================================================
     APPROVE REQUEST
  ========================================================= */

  const handleApproveRequest = async (request) => {
    if (!request?._id) return;

    const seatNumber = request.seat?.seatNumber || "selected seat";

    const studentName = request.student?.fullName || "this student";

    const confirmed = window.confirm(
      `Approve ${studentName}'s request for seat ${seatNumber}?`,
    );

    if (!confirmed) return;

    try {
      setRequestActionLoading(request._id);
      setError("");
      setRequestMessage("");

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.patch(
        `/seat-requests/${request._id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to approve seat request.",
        );
      }

      setRequestMessage(
        response.data.message || `Seat ${seatNumber} approved successfully.`,
      );

      await Promise.all([loadRequests(), loadDashboard()]);
    } catch (err) {
      console.error("Approve Seat Request Error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.message || "Unable to approve seat request.",
        );
      }
    } finally {
      setRequestActionLoading(null);
    }
  };

  /* =========================================================
     REJECT REQUEST
  ========================================================= */

  const handleRejectRequest = async (request) => {
    if (!request?._id) return;

    const seatNumber = request.seat?.seatNumber || "selected seat";

    const studentName = request.student?.fullName || "this student";

    const adminRemark = window.prompt(
      `Reason for rejecting ${studentName}'s request for ${seatNumber} (optional):`,
      "",
    );

    if (adminRemark === null) return;

    const confirmed = window.confirm(
      `Reject ${studentName}'s request for seat ${seatNumber}?`,
    );

    if (!confirmed) return;

    try {
      setRequestActionLoading(request._id);
      setError("");
      setRequestMessage("");

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      const response = await adminApi.patch(
        `/seat-requests/${request._id}/reject`,
        {
          adminRemark: adminRemark.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to reject seat request.",
        );
      }

      setRequestMessage(
        response.data.message ||
          `Seat request for ${seatNumber} rejected successfully.`,
      );

      await Promise.all([loadRequests(), loadDashboard()]);
    } catch (err) {
      console.error("Reject Seat Request Error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.message || "Unable to reject seat request.",
        );
      }
    } finally {
      setRequestActionLoading(null);
    }
  };

  /* =========================================================
     SEAT MANAGEMENT
  ========================================================= */

  const loadSeats = useCallback(async () => {
    try {
      setSeatLoading(true);
      setSeatMessage("");

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await adminApi.get("/seats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load seats.");
      }

      setSeatsList(
        Array.isArray(response.data?.seats)
          ? response.data.seats
          : Array.isArray(response.data?.data?.seats)
            ? response.data.data.seats
            : [],
      );
    } catch (err) {
      console.error("Load Seats Error:", err);

      if (!handleAuthError(err)) {
        setSeatMessage(
          err.response?.data?.message || err.message || "Unable to load seats.",
        );
      }
    } finally {
      setSeatLoading(false);
    }
  }, [navigate, handleAuthError]);

  const openSeats = () => {
    setActiveMenu("seats");
    setMobileSidebar(false);
    loadSeats();
  };

  const runSeatAction = async (method, url, data = {}, successMessage) => {
    try {
      setSeatActionLoading(true);
      setSeatMessage("");

      const token = getAdminToken();

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await adminApi.patch(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to update seat.");
      }

      setSeatMessage(
        response.data?.message ||
          successMessage ||
          "Seat updated successfully.",
      );

      await Promise.all([
        loadSeats(),
        loadDashboard(),
        loadStudents(search, statusFilter),
      ]);

      return response.data;
    } catch (err) {
      console.error("Seat Action Error:", err);

      if (!handleAuthError(err)) {
        setSeatMessage(
          err.response?.data?.message ||
            err.message ||
            "Unable to update seat.",
        );
      }

      return null;
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleSeatBlock = async (seat) => {
    if (!seat?._id) return;

    const reason = window.prompt(
      `Block seat ${seat.seatNumber}. Enter a reason (optional):`,
      seat.blockedReason || "",
    );

    if (reason === null) return;

    const confirmed = window.confirm(`Block seat ${seat.seatNumber}?`);

    if (!confirmed) return;

    const result = await runSeatAction(
      "patch",
      `/seats/${seat._id}/block`,
      { blockedReason: reason.trim() },
      `Seat ${seat.seatNumber} blocked successfully.`,
    );

    if (result) {
      setSelectedSeat((previous) =>
        previous?._id === seat._id
          ? { ...previous, status: "BLOCKED", blockedReason: reason.trim() }
          : previous,
      );
    }
  };

  const handleSeatUnblock = async (seat) => {
    if (!seat?._id) return;

    const confirmed = window.confirm(`Unblock seat ${seat.seatNumber}?`);

    if (!confirmed) return;

    const result = await runSeatAction(
      "patch",
      `/seats/${seat._id}/unblock`,
      {},
      `Seat ${seat.seatNumber} unblocked successfully.`,
    );

    if (result) {
      setSelectedSeat((previous) =>
        previous?._id === seat._id
          ? { ...previous, status: "AVAILABLE", blockedReason: "" }
          : previous,
      );
    }
  };

  const handleSeatReserve = async (seat) => {
    if (!seat?._id) return;

    const confirmed = window.confirm(`Reserve seat ${seat.seatNumber}?`);

    if (!confirmed) return;

    const result = await runSeatAction(
      "patch",
      `/seats/${seat._id}/reserve`,
      {},
      `Seat ${seat.seatNumber} reserved successfully.`,
    );

    if (result) {
      setSelectedSeat((previous) =>
        previous?._id === seat._id
          ? { ...previous, status: "RESERVED" }
          : previous,
      );
    }
  };

  const handleSeatUnreserve = async (seat) => {
    if (!seat?._id) return;

    const confirmed = window.confirm(
      `Remove reservation from seat ${seat.seatNumber}?`,
    );

    if (!confirmed) return;

    const result = await runSeatAction(
      "patch",
      `/seats/${seat._id}/unreserve`,
      {},
      `Reservation removed from ${seat.seatNumber}.`,
    );

    if (result) {
      setSelectedSeat((previous) =>
        previous?._id === seat._id
          ? { ...previous, status: "AVAILABLE", reservedFor: null }
          : previous,
      );
    }
  };

  const handleSeatVacate = async (seat) => {
    if (!seat?._id) return;

    const confirmed = window.confirm(
      `Vacate seat ${seat.seatNumber}? This will remove its current student assignment.`,
    );

    if (!confirmed) return;

    const result = await runSeatAction(
      "patch",
      `/seats/${seat._id}/vacate`,
      {},
      `Seat ${seat.seatNumber} vacated successfully.`,
    );

    if (result) {
      setSelectedSeat((previous) =>
        previous?._id === seat._id
          ? { ...previous, status: "AVAILABLE", student: null }
          : previous,
      );
    }
  };

  /* =========================================================
     CLOSE MOBILE SIDEBAR
  ========================================================= */

  const closeMobileSidebar = () => {
    setMobileSidebar(false);
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "status-active";

      case "blocked":
        return "status-blocked";

      case "inactive":
        return "status-inactive";

      case "pending":
      default:
        return "status-pending";
    }
  };

  const getRequestStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "status-active";

      case "REJECTED":
        return "status-blocked";

      case "CANCELLED":
        return "status-inactive";

      case "PENDING":
      default:
        return "status-pending";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initials = (name) => {
    if (!name) return "AD";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const stats = dashboard?.students || {};
  const seats = dashboard?.seats || {};
  const requests = dashboard?.seatRequests || {};
  const recentSeatRequests = dashboard?.recentSeatRequests || [];

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="admin-loading-page">
        <div className="admin-loading-card">
          <div className="admin-large-spinner" />
          <h2>Loading Admin Dashboard</h2>
          <p>Please wait while we prepare your dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}

      {mobileSidebar && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={closeMobileSidebar}
          aria-label="Close menu"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`admin-sidebar ${mobileSidebar ? "admin-sidebar-open" : ""}`}
      >
        <div className="admin-sidebar-brand">
          <div
            className="admin-brand-logo"
            title="New Drishti Library"
            style={{
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={LIBRARY_LOGO_PATH}
              alt="New Drishti Library"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <div>
            <strong>New Drishti</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={
              activeMenu === "dashboard"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => {
              setActiveMenu("dashboard");
              closeMobileSidebar();
            }}
          >
            <span className="admin-nav-icon">◈</span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              activeMenu === "students"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={openStudents}
          >
            <span className="admin-nav-icon">◉</span>
            Students
            {stats.pending > 0 && (
              <span className="admin-nav-count">{stats.pending}</span>
            )}
          </button>

          <button
            type="button"
            className={
              activeMenu === "requests"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={openRequests}
          >
            <span className="admin-nav-icon">◆</span>
            Seat Requests
            {requests.pending > 0 && (
              <span className="admin-nav-count">{requests.pending}</span>
            )}
          </button>

          <button
            type="button"
            className={
              activeMenu === "seats"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={openSeats}
          >
            <span className="admin-nav-icon">▦</span>
            Seats
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-help">
            <strong>Library Status</strong>

            <span>
              <i />
              Operational 24×7
            </span>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="admin-main">
        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setMobileSidebar((previous) => !previous)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>
              <span className="admin-page-label">ADMINISTRATION</span>

              <h1>
                {activeMenu === "students"
                  ? "Student Management"
                  : activeMenu === "requests"
                    ? "Seat Requests"
                    : activeMenu === "seats"
                      ? "Seat Management"
                      : "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-home-button"
              onClick={() => navigate("/")}
              title="Go to Home"
            >
              <span>⌂</span>
              <span>Home</span>
            </button>

            <div className="admin-user-info">
              <strong>{admin?.fullName || "Administrator"}</strong>

              <span>{admin?.email || "Administrator"}</span>
            </div>

            <div className="admin-user-avatar">{initials(admin?.fullName)}</div>
          </div>
        </header>

        {/* ===================================================
            GLOBAL ERROR
        =================================================== */}

        {error && (
          <div className="admin-global-error">
            <span>!</span>

            <p>{error}</p>

            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <div className="admin-content">
          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activeMenu === "dashboard" && (
            <>
              <section className="admin-welcome">
                <div>
                  <span>Good day, Administrator</span>

                  <h2>Here's what's happening at your library.</h2>
                </div>

                <button
                  type="button"
                  className="admin-refresh-button"
                  onClick={() => {
                    loadDashboard();
                    loadRequests();
                  }}
                >
                  ↻ Refresh
                </button>
              </section>

              <section className="admin-stat-grid">
                <article className="admin-stat-card">
                  <div className="admin-stat-icon blue">◉</div>

                  <div>
                    <span>Total Students</span>
                    <strong>{stats.total ?? 0}</strong>
                    <small>Registered students</small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon orange">◷</div>

                  <div>
                    <span>Pending Students</span>
                    <strong>{stats.pending ?? 0}</strong>
                    <small>Awaiting approval</small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon green">✓</div>

                  <div>
                    <span>Active Students</span>
                    <strong>{stats.active ?? 0}</strong>
                    <small>Active accounts</small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon red">!</div>

                  <div>
                    <span>Blocked Students</span>
                    <strong>{stats.blocked ?? 0}</strong>
                    <small>Blocked accounts</small>
                  </div>
                </article>
              </section>

              <section className="admin-section-grid">
                <article className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span>SEAT OVERVIEW</span>
                      <h3>Library Seats</h3>
                    </div>

                    <div className="admin-panel-number">
                      {seats.total ?? 0}
                      <small>total</small>
                    </div>
                  </div>

                  <div className="admin-seat-overview">
                    <div className="admin-seat-progress">
                      <div
                        className="admin-seat-progress-fill"
                        style={{
                          width: `${
                            seats.total
                              ? Math.min(
                                  100,
                                  (seats.occupied / seats.total) * 100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="admin-seat-summary">
                      <div>
                        <span>
                          <i className="available" />
                          Available
                        </span>
                        <strong>{seats.available ?? 0}</strong>
                      </div>

                      <div>
                        <span>
                          <i className="occupied" />
                          Occupied
                        </span>
                        <strong>{seats.occupied ?? 0}</strong>
                      </div>

                      <div>
                        <span>
                          <i className="reserved" />
                          Reserved
                        </span>
                        <strong>{seats.reserved ?? 0}</strong>
                      </div>

                      <div>
                        <span>
                          <i className="blocked" />
                          Blocked
                        </span>
                        <strong>{seats.blocked ?? 0}</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="admin-panel admin-request-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span>REQUESTS</span>
                      <h3>Seat Requests</h3>
                    </div>

                    <button
                      type="button"
                      className="admin-view-all"
                      onClick={openRequests}
                    >
                      Manage →
                    </button>
                  </div>

                  <div className="admin-request-stats">
                    <div>
                      <strong>{requests.pending ?? 0}</strong>
                      <span>Pending</span>
                    </div>

                    <div>
                      <strong>{requests.approved ?? 0}</strong>
                      <span>Approved</span>
                    </div>

                    <div>
                      <strong>{requests.rejected ?? 0}</strong>
                      <span>Rejected</span>
                    </div>
                  </div>
                </article>
              </section>

              <section className="admin-panel admin-recent-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span>RECENT ACTIVITY</span>
                    <h3>Recently Registered Students</h3>
                  </div>

                  <button
                    type="button"
                    className="admin-view-all"
                    onClick={openStudents}
                  >
                    View all →
                  </button>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Student ID</th>
                        <th>Seat</th>
                        <th>Status</th>
                        <th>Registered</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(dashboard?.recentStudents || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="admin-empty-cell">
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        dashboard.recentStudents.map((student) => (
                          <tr key={student._id}>
                            <td>
                              <div className="admin-student-cell">
                                <div className="admin-student-avatar">
                                  {initials(student.fullName)}
                                </div>

                                <div>
                                  <strong>{student.fullName}</strong>
                                  <span>{student.email}</span>
                                </div>
                              </div>
                            </td>

                            <td>{student.studentId}</td>

                            <td>
                              {student.seat?.seatNumber || "Not assigned"}
                            </td>

                            <td>
                              <span
                                className={`admin-status ${getStatusClass(
                                  student.accountStatus,
                                )}`}
                              >
                                {student.accountStatus}
                              </span>
                            </td>

                            <td>{formatDate(student.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* =================================================
              STUDENTS
          ================================================= */}

          {activeMenu === "students" && (
            <section className="admin-panel admin-students-page">
              <div className="admin-students-toolbar">
                <div>
                  <span>STUDENT MANAGEMENT</span>
                  <h2>All Students</h2>
                </div>

                <button
                  type="button"
                  className="admin-refresh-button"
                  onClick={() => loadStudents(search, statusFilter)}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="admin-student-filters">
                <div className="admin-search-box">
                  <span>⌕</span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        loadStudents(event.target.value, statusFilter);
                      }
                    }}
                    placeholder="Search by name, ID, email or mobile..."
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    const value = event.target.value;

                    setStatusFilter(value);

                    loadStudents(search, value);
                  }}
                  className="admin-status-filter"
                >
                  <option value="all">All Status</option>

                  <option value="pending">Pending</option>

                  <option value="active">Active</option>

                  <option value="blocked">Blocked</option>

                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="admin-table-wrapper">
                {studentsLoading ? (
                  <div className="admin-table-loading">
                    <div className="admin-spinner dark" />
                    <span>Loading students...</span>
                  </div>
                ) : (
                  <table className="admin-table admin-students-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>ID</th>
                        <th>Mobile</th>
                        <th>Seat</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="admin-empty-cell">
                            No students match your filters.
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr key={student._id}>
                            <td>
                              <div className="admin-student-cell">
                                <div className="admin-student-avatar">
                                  {initials(student.fullName)}
                                </div>

                                <div>
                                  <strong>{student.fullName}</strong>

                                  <span>{student.email}</span>
                                </div>
                              </div>
                            </td>

                            <td>{student.studentId}</td>

                            <td>{student.mobile}</td>

                            <td>{student.seat?.seatNumber || "—"}</td>

                            <td>
                              <span
                                className={`admin-status ${getStatusClass(
                                  student.accountStatus,
                                )}`}
                              >
                                {student.accountStatus}
                              </span>
                            </td>

                            <td>{formatDate(student.createdAt)}</td>

                            <td>
                              <div className="admin-student-action-group">
                                <button
                                  type="button"
                                  className="admin-view-student-button"
                                  onClick={() => handleViewStudent(student._id)}
                                >
                                  👁 View
                                </button>

                                <select
                                  className="admin-inline-status"
                                  value={student.accountStatus}
                                  onChange={(event) =>
                                    handleStudentStatus(
                                      student._id,
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="pending">Pending</option>

                                  <option value="active">Active</option>

                                  <option value="blocked">Blocked</option>

                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* =================================================
              REQUESTS
          ================================================= */}

          {activeMenu === "requests" && (
            <>
              <section className="admin-panel">
                <div className="admin-students-toolbar">
                  <div>
                    <span>SEAT REQUEST MANAGEMENT</span>

                    <h2>Pending Seat Requests</h2>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#718198",
                        fontSize: "14px",
                      }}
                    >
                      Review student requests and approve or reject seat
                      allocation.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-refresh-button"
                    onClick={() => {
                      loadRequests();
                      loadDashboard();
                    }}
                  >
                    ↻ Refresh
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    margin: "20px 0",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      border: "1px solid #e1e8ef",
                      borderRadius: "12px",
                      background: "#f8fbfd",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#718198",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      Pending
                    </span>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "26px",
                        color: "#123b61",
                      }}
                    >
                      {requests.pending ?? 0}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      border: "1px solid #e1e8ef",
                      borderRadius: "12px",
                      background: "#f8fbfd",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#718198",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      Approved
                    </span>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "26px",
                        color: "#168253",
                      }}
                    >
                      {requests.approved ?? 0}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      border: "1px solid #e1e8ef",
                      borderRadius: "12px",
                      background: "#f8fbfd",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#718198",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      Rejected
                    </span>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "26px",
                        color: "#b33838",
                      }}
                    >
                      {requests.rejected ?? 0}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      border: "1px solid #e1e8ef",
                      borderRadius: "12px",
                      background: "#f8fbfd",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#718198",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      Total
                    </span>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "6px",
                        fontSize: "26px",
                        color: "#123b61",
                      }}
                    >
                      {requests.total ?? 0}
                    </strong>
                  </div>
                </div>

                {requestMessage && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#eaf8f1",
                      border: "1px solid #ccefe0",
                      color: "#166b47",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {requestMessage}
                  </div>
                )}

                <div className="admin-table-wrapper">
                  {requestsLoading ? (
                    <div className="admin-table-loading">
                      <div className="admin-spinner dark" />
                      <span>Loading seat requests...</span>
                    </div>
                  ) : requestsList.length === 0 ? (
                    <div
                      className="admin-empty-cell"
                      style={{
                        padding: "50px 20px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "40px",
                          marginBottom: "10px",
                        }}
                      >
                        ✓
                      </div>

                      <h3
                        style={{
                          margin: "0 0 6px",
                          color: "#123b61",
                        }}
                      >
                        No Pending Seat Requests
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: "#718198",
                        }}
                      >
                        There are currently no seat requests waiting for admin
                        approval.
                      </p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student ID</th>
                          <th>Seat</th>
                          <th>Type</th>
                          <th>Requested</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {requestsList.map((request) => {
                          const student = request.student || {};

                          const seat = request.seat || {};

                          const isBusy = requestActionLoading === request._id;

                          return (
                            <tr key={request._id}>
                              <td>
                                <div className="admin-student-cell">
                                  <div className="admin-student-avatar">
                                    {initials(student.fullName)}
                                  </div>

                                  <div>
                                    <strong>
                                      {student.fullName || "Unknown Student"}
                                    </strong>

                                    <span>
                                      {student.email ||
                                        student.mobile ||
                                        "No contact"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>{student.studentId || "—"}</td>

                              <td>
                                <strong>{seat.seatNumber || "—"}</strong>
                              </td>

                              <td>{seat.seatType || "—"}</td>

                              <td>{formatDateTime(request.createdAt)}</td>

                              <td>
                                <span
                                  className={`admin-status ${getRequestStatusClass(
                                    request.status,
                                  )}`}
                                >
                                  {request.status || "PENDING"}
                                </span>
                              </td>

                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      handleApproveRequest(request)
                                    }
                                    style={{
                                      border: "0",
                                      borderRadius: "9px",
                                      padding: "9px 12px",
                                      background: isBusy
                                        ? "#cbd5df"
                                        : "#168253",
                                      color: "#ffffff",
                                      fontWeight: 700,
                                      cursor: isBusy
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                  >
                                    {isBusy ? "Processing..." : "Approve"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleRejectRequest(request)}
                                    style={{
                                      border: "1px solid #efcaca",
                                      borderRadius: "9px",
                                      padding: "9px 12px",
                                      background: "#fff0f0",
                                      color: "#b33838",
                                      fontWeight: 700,
                                      cursor: isBusy
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="admin-panel" style={{ marginTop: "18px" }}>
                <div className="admin-panel-heading">
                  <div>
                    <span>RECENT REQUEST HISTORY</span>
                    <h3>Latest Seat Requests</h3>
                  </div>
                </div>

                <div className="admin-table-wrapper">
                  {recentSeatRequests.length === 0 ? (
                    <div className="admin-empty-cell">
                      No seat request history available.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Seat</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentSeatRequests.map((request) => (
                          <tr key={request._id}>
                            <td>
                              <div className="admin-student-cell">
                                <div className="admin-student-avatar">
                                  {initials(request.student?.fullName)}
                                </div>

                                <div>
                                  <strong>
                                    {request.student?.fullName ||
                                      "Unknown Student"}
                                  </strong>

                                  <span>
                                    {request.student?.studentId ||
                                      request.student?.email ||
                                      "—"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>{request.seat?.seatNumber || "—"}</td>

                            <td>{request.seat?.seatType || "—"}</td>

                            <td>
                              <span
                                className={`admin-status ${getRequestStatusClass(
                                  request.status,
                                )}`}
                              >
                                {request.status || "—"}
                              </span>
                            </td>

                            <td>{formatDateTime(request.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* =================================================
              SEATS
          ================================================= */}

          {activeMenu === "seats" && (
            <section className="admin-seat-management-page">
              <section className="admin-panel">
                <div className="admin-students-toolbar">
                  <div>
                    <span>SEAT MANAGEMENT</span>
                    <h2>Library Seats</h2>
                    <p className="admin-seat-management-subtitle">
                      Manage all 225 library seats without changing your
                      existing seat allocation system.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-refresh-button"
                    onClick={loadSeats}
                    disabled={seatLoading}
                  >
                    {seatLoading ? "Loading..." : "↻ Refresh"}
                  </button>
                </div>

                {seatMessage && (
                  <div className="admin-seat-message">
                    <span>●</span>
                    <p>{seatMessage}</p>
                    <button type="button" onClick={() => setSeatMessage("")}>
                      ×
                    </button>
                  </div>
                )}

                <div className="admin-seat-management-stats">
                  <div>
                    <span>Total</span>
                    <strong>{seatsList.length}</strong>
                  </div>
                  <div>
                    <span>Available</span>
                    <strong>
                      {
                        seatsList.filter((seat) => seat.status === "AVAILABLE")
                          .length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Occupied</span>
                    <strong>
                      {
                        seatsList.filter((seat) => seat.status === "OCCUPIED")
                          .length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Reserved</span>
                    <strong>
                      {
                        seatsList.filter((seat) => seat.status === "RESERVED")
                          .length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Blocked</span>
                    <strong>
                      {
                        seatsList.filter((seat) => seat.status === "BLOCKED")
                          .length
                      }
                    </strong>
                  </div>
                </div>

                <div className="admin-seat-filters">
                  <div className="admin-search-box">
                    <span>⌕</span>
                    <input
                      type="search"
                      value={seatSearch}
                      onChange={(event) => setSeatSearch(event.target.value)}
                      placeholder="Search seat number or student..."
                    />
                  </div>

                  <select
                    value={seatStatusFilter}
                    onChange={(event) =>
                      setSeatStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>

                  <select
                    value={seatTypeFilter}
                    onChange={(event) => setSeatTypeFilter(event.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="NORMAL">Normal</option>
                    <option value="SPECIAL">Special</option>
                  </select>
                </div>

                {seatLoading ? (
                  <div className="admin-table-loading">
                    <div className="admin-spinner dark" />
                    <span>Loading 225 seats...</span>
                  </div>
                ) : (
                  (() => {
                    const filteredSeats = seatsList.filter((seat) => {
                      const query = seatSearch.trim().toLowerCase();

                      const matchesSearch =
                        !query ||
                        String(seat.seatNumber || "")
                          .toLowerCase()
                          .includes(query) ||
                        String(seat.student?.fullName || "")
                          .toLowerCase()
                          .includes(query) ||
                        String(seat.student?.studentId || "")
                          .toLowerCase()
                          .includes(query);

                      const matchesStatus =
                        seatStatusFilter === "all" ||
                        seat.status === seatStatusFilter;

                      const matchesType =
                        seatTypeFilter === "all" ||
                        seat.seatType === seatTypeFilter;

                      return matchesSearch && matchesStatus && matchesType;
                    });

                    const normalSeats = filteredSeats.filter(
                      (seat) => seat.seatType === "NORMAL",
                    );

                    const specialSeats = filteredSeats.filter(
                      (seat) => seat.seatType === "SPECIAL",
                    );

                    const renderSeatCard = (seat) => {
                      const isSelected = selectedSeat?._id === seat._id;

                      const statusClass = String(
                        seat.status || "AVAILABLE",
                      ).toLowerCase();

                      return (
                        <button
                          type="button"
                          key={seat._id}
                          className={`admin-seat-card ${statusClass} ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => setSelectedSeat(seat)}
                          title={`Seat ${seat.seatNumber}`}
                        >
                          <strong>{seat.seatNumber}</strong>
                          <span>{seat.status || "AVAILABLE"}</span>
                          {seat.student?.fullName && (
                            <small>{seat.student.fullName}</small>
                          )}
                        </button>
                      );
                    };

                    return (
                      <>
                        <div className="admin-seat-layout">
                          <div className="admin-seat-grid-panel">
                            <div className="admin-seat-grid-heading">
                              <div>
                                <span>NORMAL SEATS</span>
                                <h3>A001 – A208</h3>
                              </div>
                              <strong>{normalSeats.length} shown</strong>
                            </div>

                            {normalSeats.length === 0 ? (
                              <div className="admin-seat-empty">
                                No normal seats match your filters.
                              </div>
                            ) : (
                              <div className="admin-seat-grid">
                                {normalSeats.map(renderSeatCard)}
                              </div>
                            )}
                          </div>

                          <div className="admin-seat-grid-panel">
                            <div className="admin-seat-grid-heading">
                              <div>
                                <span>SPECIAL SEATS</span>
                                <h3>S01 – S42</h3>
                              </div>
                              <strong>{specialSeats.length} shown</strong>
                            </div>

                            {specialSeats.length === 0 ? (
                              <div className="admin-seat-empty">
                                No special seats match your filters.
                              </div>
                            ) : (
                              <div className="admin-seat-grid special">
                                {specialSeats.map(renderSeatCard)}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedSeat && (
                          <aside className="admin-selected-seat-panel">
                            <div className="admin-selected-seat-header">
                              <div>
                                <span>SELECTED SEAT</span>
                                <h3>{selectedSeat.seatNumber}</h3>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedSeat(null)}
                                aria-label="Close seat details"
                              >
                                ×
                              </button>
                            </div>

                            <div className="admin-selected-seat-info">
                              <div>
                                <span>Seat Type</span>
                                <strong>{selectedSeat.seatType || "—"}</strong>
                              </div>
                              <div>
                                <span>Status</span>
                                <strong>{selectedSeat.status || "—"}</strong>
                              </div>
                              <div>
                                <span>Section</span>
                                <strong>{selectedSeat.section || "—"}</strong>
                              </div>
                              <div>
                                <span>Floor</span>
                                <strong>{selectedSeat.floor || "—"}</strong>
                              </div>
                            </div>

                            <div className="admin-selected-seat-student">
                              <span>ASSIGNED STUDENT</span>

                              {selectedSeat.student ? (
                                <div>
                                  <strong>
                                    {selectedSeat.student.fullName || "—"}
                                  </strong>
                                  <small>
                                    {selectedSeat.student.studentId ||
                                      selectedSeat.student.email ||
                                      "—"}
                                  </small>
                                </div>
                              ) : (
                                <p>No student assigned.</p>
                              )}
                            </div>

                            {selectedSeat.blockedReason && (
                              <div className="admin-seat-reason">
                                <span>BLOCK REASON</span>
                                <p>{selectedSeat.blockedReason}</p>
                              </div>
                            )}

                            <div className="admin-selected-seat-actions">
                              {selectedSeat.status === "BLOCKED" ? (
                                <button
                                  type="button"
                                  className="seat-action-primary"
                                  disabled={seatActionLoading}
                                  onClick={() =>
                                    handleSeatUnblock(selectedSeat)
                                  }
                                >
                                  Unblock Seat
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="seat-action-danger"
                                  disabled={
                                    seatActionLoading ||
                                    selectedSeat.status === "OCCUPIED"
                                  }
                                  onClick={() => handleSeatBlock(selectedSeat)}
                                >
                                  Block Seat
                                </button>
                              )}

                              {selectedSeat.status === "RESERVED" ? (
                                <button
                                  type="button"
                                  className="seat-action-secondary"
                                  disabled={seatActionLoading}
                                  onClick={() =>
                                    handleSeatUnreserve(selectedSeat)
                                  }
                                >
                                  Unreserve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="seat-action-secondary"
                                  disabled={
                                    seatActionLoading ||
                                    selectedSeat.status !== "AVAILABLE"
                                  }
                                  onClick={() =>
                                    handleSeatReserve(selectedSeat)
                                  }
                                >
                                  Reserve
                                </button>
                              )}

                              {selectedSeat.status === "OCCUPIED" && (
                                <button
                                  type="button"
                                  className="seat-action-warning"
                                  disabled={seatActionLoading}
                                  onClick={() => handleSeatVacate(selectedSeat)}
                                >
                                  Vacate Seat
                                </button>
                              )}
                            </div>
                          </aside>
                        )}
                      </>
                    );
                  })()
                )}
              </section>
            </section>
          )}
        </div>
      </section>

      {/* =====================================================
          STUDENT DETAIL MODAL
      ===================================================== */}

      {selectedStudent && (
        <div
          className="admin-student-modal-overlay"
          onClick={() => {
            setSelectedStudent(null);
            setStudentDetailError("");
          }}
        >
          <div
            className="admin-student-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-student-modal-header">
              <div>
                <span>STUDENT PROFILE</span>
                <h2>Student Details</h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentDetailError("");
                }}
                aria-label="Close student details"
              >
                ×
              </button>
            </div>

            {studentDetailLoading ? (
              <div className="admin-modal-loading">
                <div className="admin-spinner dark" />

                <p>Loading student details...</p>
              </div>
            ) : studentDetailError ? (
              <div className="admin-modal-error">{studentDetailError}</div>
            ) : (
              (() => {
                const student = selectedStudent.student;

                const seat = student?.seat;

                const seatRequests = selectedStudent.seatRequests || [];

                const photoUrl = resolveFileUrl(
                  student?.photo?.url || student?.photo?.secure_url || "",
                );

                const aadhaarUrl = resolveFileUrl(
                  student?.aadhaarDocument?.url || "",
                );

                const isPdf = aadhaarUrl
                  .toLowerCase()
                  .split("?")[0]
                  .endsWith(".pdf");

                return (
                  <div className="admin-student-detail-content">
                    {/* =====================================
                        PROFILE HEADER
                    ====================================== */}

                    <div className="admin-student-detail-profile">
                      <div className="admin-student-detail-photo">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={student.fullName || "Student"}
                          />
                        ) : (
                          <div className="admin-no-photo">
                            {initials(student?.fullName)}
                          </div>
                        )}
                      </div>

                      <div className="admin-student-detail-main">
                        <h3>{student?.fullName || "—"}</h3>

                        <p>{student?.studentId || "—"}</p>

                        <span
                          className={`admin-status ${getStatusClass(
                            student?.accountStatus,
                          )}`}
                        >
                          {student?.accountStatus || "pending"}
                        </span>
                      </div>
                    </div>

                    {/* =====================================
                        PERSONAL INFORMATION
                    ====================================== */}

                    <section className="admin-detail-section">
                      <div className="admin-detail-section-title">
                        <span>01</span>

                        <div>
                          <strong>Personal Information</strong>

                          <small>Registered student information</small>
                        </div>
                      </div>

                      <div className="admin-detail-grid">
                        <div>
                          <label>Full Name</label>

                          <strong>{student?.fullName || "—"}</strong>
                        </div>

                        <div>
                          <label>Student ID</label>

                          <strong>{student?.studentId || "—"}</strong>
                        </div>

                        <div>
                          <label>Mobile</label>

                          <strong>{student?.mobile || "—"}</strong>
                        </div>

                        <div>
                          <label>Email</label>

                          <strong>{student?.email || "—"}</strong>
                        </div>

                        <div>
                          <label>Father's Name</label>

                          <strong>{student?.fatherName || "—"}</strong>
                        </div>

                        <div>
                          <label>Mother's Name</label>

                          <strong>{student?.motherName || "—"}</strong>
                        </div>

                        <div>
                          <label>Course</label>

                          <strong>{student?.course || "—"}</strong>
                        </div>

                        <div className="admin-detail-full">
                          <label>Address</label>

                          <strong>{student?.address || "—"}</strong>
                        </div>
                      </div>
                    </section>

                    {/* =====================================
                        SEAT INFORMATION
                    ====================================== */}

                    <section className="admin-detail-section">
                      <div className="admin-detail-section-title">
                        <span>02</span>

                        <div>
                          <strong>Seat Information</strong>

                          <small>Current assigned seat</small>
                        </div>
                      </div>

                      {seat ? (
                        <div className="admin-seat-detail-card">
                          <div>
                            <span>Seat Number</span>

                            <strong>{seat.seatNumber || "—"}</strong>
                          </div>

                          <div>
                            <span>Seat Type</span>

                            <strong>{seat.seatType || "—"}</strong>
                          </div>

                          <div>
                            <span>Status</span>

                            <strong>{seat.status || "—"}</strong>
                          </div>

                          <div>
                            <span>Section</span>

                            <strong>{seat.section || "—"}</strong>
                          </div>

                          <div>
                            <span>Floor</span>

                            <strong>{seat.floor || "—"}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="admin-no-seat">No seat assigned.</div>
                      )}
                    </section>

                    {/* =====================================
                        DOCUMENTS
                    ====================================== */}

                    <section className="admin-detail-section">
                      <div className="admin-detail-section-title">
                        <span>03</span>

                        <div>
                          <strong>Uploaded Documents</strong>

                          <small>Student photo and Aadhaar document</small>
                        </div>
                      </div>

                      <div className="admin-document-detail-grid">
                        {/* PROFILE PHOTO */}

                        <div className="admin-document-detail-card">
                          <div className="admin-document-detail-heading">
                            <strong>Profile Photo</strong>

                            <span>Student Photo</span>
                          </div>

                          {photoUrl ? (
                            <>
                              <img
                                src={photoUrl}
                                alt="Student profile"
                                className="admin-detail-profile-image"
                              />

                              <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-document-open-button"
                              >
                                Open Photo ↗
                              </a>
                            </>
                          ) : (
                            <div className="admin-document-empty">
                              No profile photo uploaded.
                            </div>
                          )}
                        </div>

                        {/* AADHAAR */}

                        <div className="admin-document-detail-card">
                          <div className="admin-document-detail-heading">
                            <strong>Aadhaar Card</strong>

                            <span
                              className={
                                student?.aadhaarDocument?.verified
                                  ? "document-verified"
                                  : "document-pending"
                              }
                            >
                              {student?.aadhaarDocument?.verified
                                ? "✓ Verified"
                                : "Pending Verification"}
                            </span>
                          </div>

                          {aadhaarUrl ? (
                            <>
                              {isPdf ? (
                                <div className="admin-pdf-box">
                                  <span>📄</span>

                                  <strong>Aadhaar PDF</strong>
                                </div>
                              ) : (
                                <img
                                  src={aadhaarUrl}
                                  alt="Aadhaar document"
                                  className="admin-detail-aadhaar-image"
                                />
                              )}

                              <a
                                href={aadhaarUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-document-open-button"
                              >
                                Open Aadhaar ↗
                              </a>

                              <button
                                type="button"
                                className={
                                  student?.aadhaarDocument?.verified
                                    ? "admin-unverify-button"
                                    : "admin-verify-button"
                                }
                                onClick={async () => {
                                  try {
                                    const token = getAdminToken();

                                    if (!token) {
                                      navigate("/admin/login", {
                                        replace: true,
                                      });
                                      return;
                                    }

                                    const nextValue =
                                      !student.aadhaarDocument.verified;

                                    const response = await adminApi.patch(
                                      `/admin/students/${student._id}/aadhaar`,
                                      {
                                        verified: nextValue,
                                      },
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );

                                    if (!response.data?.success) {
                                      throw new Error(
                                        response.data?.message ||
                                          "Unable to update Aadhaar verification.",
                                      );
                                    }

                                    setSelectedStudent((previous) => ({
                                      ...previous,

                                      student: {
                                        ...previous.student,

                                        aadhaarDocument: {
                                          ...previous.student.aadhaarDocument,

                                          verified: nextValue,
                                        },
                                      },
                                    }));

                                    await loadStudents(search, statusFilter);
                                  } catch (err) {
                                    console.error(
                                      "Aadhaar verification error:",
                                      err,
                                    );

                                    if (!handleAuthError(err)) {
                                      setStudentDetailError(
                                        err.response?.data?.message ||
                                          err.message ||
                                          "Unable to update Aadhaar verification.",
                                      );
                                    }
                                  }
                                }}
                              >
                                {student?.aadhaarDocument?.verified
                                  ? "Remove Verification"
                                  : "✓ Verify Aadhaar"}
                              </button>
                            </>
                          ) : (
                            <div className="admin-document-empty">
                              Aadhaar document not uploaded.
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* =====================================
                        SEAT REQUEST HISTORY
                    ====================================== */}

                    <section className="admin-detail-section">
                      <div className="admin-detail-section-title">
                        <span>04</span>

                        <div>
                          <strong>Seat Request History</strong>

                          <small>Previous seat requests</small>
                        </div>
                      </div>

                      {seatRequests.length === 0 ? (
                        <div className="admin-no-seat">
                          No seat requests found.
                        </div>
                      ) : (
                        <div className="admin-seat-request-history">
                          {seatRequests.map((request) => (
                            <div
                              key={request._id}
                              className="admin-history-row"
                            >
                              <div>
                                <strong>
                                  {request.seat?.seatNumber || "—"}
                                </strong>

                                <span>{request.seat?.seatType || "—"}</span>
                              </div>

                              <span
                                className={`admin-status ${getRequestStatusClass(
                                  request.status,
                                )}`}
                              >
                                {request.status || "—"}
                              </span>

                              <span>{formatDateTime(request.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </main>
  );
}
