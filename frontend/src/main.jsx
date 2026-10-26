import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Authentication = lazy(() => import("./pages/Authentication.jsx"));
const VideoMeet = lazy(() => import("./pages/VideoMeet.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const History = lazy(() => import("./pages/History.jsx"));

const fallbackElement = (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0f172a",
    }}
  >
    <CircularProgress size={48} sx={{ color: "#3b82f6" }} />
  </div>
);

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={fallbackElement}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signin" element={<Authentication />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/:url" element={<VideoMeet />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);
