import axios from "axios";

const hostname = window.location.hostname;
const protocol = window.location.protocol;

const API_URL = (() => {
  if (protocol === "http:") {
    return "http://localhost:8080/api/v1";
  }
  if (protocol === "https:") {
    return "/api/v1"; 
  }
  return ""; 
})();


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default api;
