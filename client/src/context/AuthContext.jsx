import { createContext, useEffect, useState } from "react";

import api from "../services/api";

const TOKEN_KEY = "library_token";
const STUDENT_KEY = "library_student";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  /*
   * =====================================================
   * CLEAR AUTH STATE
   * =====================================================
   */

  const clearAuthState = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDENT_KEY);

    setStudent(null);
    setIsAuthenticated(false);
  };

  /*
   * =====================================================
   * SAVE AUTH STATE
   * =====================================================
   */

  const saveAuthState = (authData) => {
    if (!authData?.token || !authData?.student) {
      throw new Error("Invalid authentication response.");
    }

    localStorage.setItem(TOKEN_KEY, authData.token);

    localStorage.setItem(STUDENT_KEY, JSON.stringify(authData.student));

    setStudent(authData.student);
    setIsAuthenticated(true);
  };

  /*
   * =====================================================
   * LOAD AUTHENTICATED STUDENT
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadStudent = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      const savedStudent = localStorage.getItem(STUDENT_KEY);

      /*
       * -------------------------------------------------
       * NO TOKEN
       * -------------------------------------------------
       */

      if (!savedToken) {
        if (!cancelled) {
          setStudent(null);
          setIsAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      /*
       * -------------------------------------------------
       * LOAD CACHED STUDENT FIRST
       * -------------------------------------------------
       */

      if (savedStudent) {
        try {
          const parsedStudent = JSON.parse(savedStudent);

          if (!cancelled) {
            setStudent(parsedStudent);

            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Invalid saved student data:", error);

          localStorage.removeItem(STUDENT_KEY);
        }
      }

      /*
       * -------------------------------------------------
       * FETCH LATEST PROFILE
       * -------------------------------------------------
       */

      try {
        const response = await api.get("/students/profile");

        if (cancelled) {
          return;
        }

        if (response.data?.success && response.data?.student) {
          const latestStudent = response.data.student;

          setStudent(latestStudent);

          setIsAuthenticated(true);

          localStorage.setItem(STUDENT_KEY, JSON.stringify(latestStudent));
        } else {
          throw new Error(
            response.data?.message || "Unable to load student profile.",
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = error.response?.status;

        /*
         * Token invalid / expired
         */

        if (status === 401 || status === 403) {
          clearAuthState();
        } else {
          /*
           * Network/server error:
           * keep cached student logged in.
           */

          console.error(
            "Unable to load student profile:",
            error.response?.data?.message || error.message || "Unknown error",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStudent();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */

  const login = async (email, password) => {
    if (!email?.trim()) {
      throw new Error("Email is required.");
    }

    if (!password) {
      throw new Error("Password is required.");
    }

    const response = await api.post("/students/login", {
      email: email.trim(),
      password,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Login failed.");
    }

    saveAuthState(response.data);

    return response.data;
  };

  /*
   * =====================================================
   * REGISTER
   * =====================================================
   *
   * Registration uses FormData because it contains:
   *
   * - Student information
   * - Profile photo
   * - Aadhaar document
   *
   * Aadhaar NUMBER is NOT used here.
   *
   * IMPORTANT:
   * We do not manually set multipart Content-Type.
   * Axios/browser creates the boundary automatically.
   */

  const register = async (formData) => {
    /*
     * Verify FormData.
     */

    if (!(formData instanceof FormData)) {
      throw new Error("Registration data must be submitted using FormData.");
    }

    /*
     * Make sure the required files
     * actually exist before sending.
     */

    const photo = formData.get("photo");

    const aadhaarDocument = formData.get("aadhaarDocument");

    if (!photo || !(photo instanceof File) || photo.size === 0) {
      throw new Error("Profile photo is required. Please select a photo.");
    }

    if (
      !aadhaarDocument ||
      !(aadhaarDocument instanceof File) ||
      aadhaarDocument.size === 0
    ) {
      throw new Error(
        "Aadhaar document is required. Please select your document.",
      );
    }

    /*
     * Debug information.
     *
     * This does NOT print the actual Aadhaar
     * document or sensitive contents.
     */

    console.log("REGISTER FORM DATA:", {
      hasPhoto: photo instanceof File && photo.size > 0,

      photoName: photo instanceof File ? photo.name : "",

      photoType: photo instanceof File ? photo.type : "",

      hasAadhaarDocument:
        aadhaarDocument instanceof File && aadhaarDocument.size > 0,

      aadhaarDocumentName:
        aadhaarDocument instanceof File ? aadhaarDocument.name : "",

      aadhaarDocumentType:
        aadhaarDocument instanceof File ? aadhaarDocument.type : "",
    });

    /*
     * IMPORTANT:
     *
     * Do NOT send:
     *
     * Content-Type:
     * application/json
     *
     * for this request.
     *
     * The api interceptor will remove
     * the JSON header for FormData.
     */

    const response = await api.post("/students/register", formData);

    /*
     * Backend failure
     */

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Registration failed.");
    }

    /*
     * Save returned login state.
     */

    saveAuthState(response.data);

    return response.data;
  };

  /*
   * =====================================================
   * LOGOUT
   * =====================================================
   */

  const logout = () => {
    clearAuthState();

    window.location.href = "/login";
  };

  /*
   * =====================================================
   * CONTEXT VALUE
   * =====================================================
   */

  const value = {
    student,

    loading,

    login,

    register,

    logout,

    isAuthenticated,
  };

  /*
   * =====================================================
   * PROVIDER
   * =====================================================
   */

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
