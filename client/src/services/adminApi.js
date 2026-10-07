import axios from "axios";

const adminApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

export default adminApi;