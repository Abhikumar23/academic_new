import axios from "axios";

// 👇 Create an axios instance with default base URL and credentials
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1",
  withCredentials: true, // if your backend uses cookies/auth
});

// 👇 General-purpose API connector
export const apiConnector = async (method, url, bodyData = {}, headers = {}, params = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data: bodyData,
      headers,
      params,
    });
    return response;
  } catch (error) {
    console.error("API ERROR:", error);
    throw error;
  }
};
