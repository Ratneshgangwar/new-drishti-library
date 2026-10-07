import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://new-drishti-library.onrender.com/api",

  timeout: 20000,
});

/*
 * =====================================================
 * REQUEST INTERCEPTOR
 * =====================================================
 */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "library_token",
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * IMPORTANT:
     * FormData must NOT receive application/json.
     *
     * Browser/Axios will automatically generate:
     *
     * multipart/form-data; boundary=...
     */

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
 * =====================================================
 * RESPONSE INTERCEPTOR
 * =====================================================
 */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      /*
       * Do not automatically redirect
       * from registration/login requests.
       *
       * AuthContext handles student logout.
       */
    }

    return Promise.reject(error);
  },
);

export default api;