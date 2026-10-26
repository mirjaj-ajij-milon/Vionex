import axios from "axios";
import httpStatus from "http-status";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
import { AuthContext } from "./AuthContextDef";

const client = axios.create({
  baseURL: `${server}/api/users`,
});

export const AuthProvider = ({ children }) => {
  const router = useNavigate();

  // Initialize user state from persistent storage if available
  const [userData, setUserData] = useState(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const username = localStorage.getItem("username");
    if (token) {
      return { token, name: name || "", username: username || "" };
    }
    return {};
  });

  const handleRegister = async (name, username, password) => {
    try {
      if (!name?.trim()) throw new Error("Name is required");
      if (!username?.trim()) throw new Error("Username is required");
      if (!password) throw new Error("Password is required");

      const trimmedName = name.trim();
      const trimmedUsername = username.trim();

      if (trimmedName.length < 2) throw new Error("Name must be at least 2 characters long");
      if (trimmedUsername.length < 3) throw new Error("Username must be at least 3 characters long");
      if (password.length < 6) throw new Error("Password must be at least 6 characters long");

      const response = await client.post("/register", {
        name: trimmedName,
        username: trimmedUsername,
        password: password,
      });

      if (response.status === httpStatus.CREATED || response.status === 200) {
        return response.data.message || "Registration successful!";
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err.message || "Registration failed";
      const error = new Error(errorMessage);
      error.response = err.response || { data: { message: errorMessage } };
      throw error;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      if (!username?.trim()) throw new Error("Username is required");
      if (!password) throw new Error("Password is required");

      const response = await client.post("/login", {
        username: username.trim(),
        password: password,
      });

      if (response.status === httpStatus.OK && response.data.token) {
        const userPayload = {
          token: response.data.token,
          name: response.data.name || "",
          username: response.data.username || "",
        };

        localStorage.setItem("token", userPayload.token);
        if (userPayload.name) localStorage.setItem("name", userPayload.name);
        if (userPayload.username) localStorage.setItem("username", userPayload.username);

        setUserData(userPayload);
        router("/home");
      } else {
        throw new Error("Invalid response received from authentication server.");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err.message || "Login failed";
      const error = new Error(errorMessage);
      error.response = err.response || { data: { message: errorMessage } };
      throw error;
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await client.post(
          "/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).catch(() => {});
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("username");
      setUserData({});
      router("/auth");
    }
  }, [router]);

  const getHistoryOfUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await client.get("/get_all_activity", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data || [];
    } catch (err) {
      console.error("Error fetching user history:", err);
      if (err?.response?.status === 401) {
        handleLogout();
      }
      throw err;
    }
  }, [handleLogout]);

  const addToUserHistory = useCallback(async (meetingCode) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      return await client.post(
        "/add_to_activity",
        {
          meeting_code: meetingCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (e) {
      console.error("Error adding to user history:", e);
      throw e;
    }
  }, []);

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
