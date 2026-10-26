import React, { useContext, useState } from "react";
import withAuth from "../utils/WithAuth";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  History as HistoryIcon,
  VideoCall as VideoCallIcon,
  Logout as LogoutIcon,
  CheckCircleOutline as CheckIcon,
  ShieldOutlined as ShieldIcon,
  KeyboardOutlined as KeyboardIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { AuthContext } from "../contexts/AuthContextDef";
import Footer from "../Footer";
import styles from "../styles/Home.module.css";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { addToUserHistory, handleLogout, userData } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    const trimmedCode = meetingCode.trim();
    if (!trimmedCode) {
      setError("Please enter a meeting code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addToUserHistory(trimmedCode);
      navigate(`/${trimmedCode}`);
    } catch (err) {
      setError("Failed to register meeting session. Please try again.");
      console.error("Error joining meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInstantMeeting = () => {
    const newMeetingCode = Math.random().toString(36).substring(2, 10);
    setMeetingCode(newMeetingCode);
  };

  const onLogoutClick = () => {
    if (window.confirm("Are you sure you want to sign out of your account?")) {
      handleLogout();
    }
  };

  const verifiedFeatures = [
    "Direct Peer-to-Peer WebRTC Mesh Conferencing",
    "High-Definition Camera & Screen Sharing",
    "Real-Time Text Messaging During Active Calls",
    "Private Encrypted Media Streams (DTLS-SRTP)",
  ];

  const displayName = userData?.name || userData?.username || "User";

  return (
    <div className={styles.homeContainer}>
      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navbarBrand}>
          <Avatar className={styles.brandLogo}>
            <VideoCallIcon fontSize="small" />
          </Avatar>
          <Typography className={styles.brandTitle}>Vionex</Typography>
        </div>

        <div className={styles.navbarActions}>
          <Button
            onClick={() => navigate("/history")}
            startIcon={<HistoryIcon fontSize="small" />}
            className={styles.historyButton}
          >
            Meeting History
          </Button>

          <Button
            onClick={onLogoutClick}
            startIcon={<LogoutIcon fontSize="small" />}
            className={styles.logoutButton}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className={styles.mainContent}>
        {/* Left Column: Meeting Launcher */}
        <section className={styles.leftPanel}>
          <div className={styles.greetingSection}>
            <Typography className={styles.heroTitle}>
              Welcome back, {displayName}
            </Typography>
            <Typography className={styles.heroSubtitle}>
              Start a new conference or join an existing room with your meeting code.
            </Typography>
          </div>

          <div className={styles.meetingSection}>
            <Typography className={styles.meetingSectionTitle}>
              Enter or Create a Meeting Room
            </Typography>

            <div className={styles.meetingControls}>
              <TextField
                className={styles.meetingInput}
                label="Meeting Code or Room Name"
                value={meetingCode}
                onChange={(e) => {
                  setMeetingCode(e.target.value);
                  setError("");
                }}
                placeholder="e.g. daily-standup-8x2f"
                error={!!error}
                helperText={error}
                disabled={loading}
                size="small"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinVideoCall();
                  }
                }}
              />

              <Button
                className={styles.joinButton}
                onClick={handleJoinVideoCall}
                disabled={loading || !meetingCode.trim()}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <VideoCallIcon />
                  )
                }
              >
                {loading ? "Connecting..." : "Join Room"}
              </Button>
            </div>

            <div className={styles.quickActions}>
              <Button
                className={styles.quickActionButton}
                onClick={handleGenerateInstantMeeting}
                disabled={loading}
                startIcon={<AddIcon fontSize="small" />}
              >
                Generate Room Code
              </Button>
              <Button
                className={styles.quickActionButton}
                onClick={() => navigate("/history")}
                disabled={loading}
                startIcon={<HistoryIcon fontSize="small" />}
              >
                View Past Sessions
              </Button>
            </div>
          </div>

          {/* Genuine Verified Features */}
          <div className={styles.featuresSection}>
            <Typography className={styles.featuresTitle}>
              Core Architecture & Features
            </Typography>
            <ul className={styles.featuresList}>
              {verifiedFeatures.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <CheckIcon className={styles.featureIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right Column: In-Call Guide & Information */}
        <aside className={styles.rightPanel}>
          <div className={styles.infoCard}>
            <Typography className={styles.infoCardTitle}>
              <KeyboardIcon style={{ color: "#60a5fa" }} />
              <span>In-Call Keyboard Shortcuts</span>
            </Typography>

            <Typography className={styles.infoCardText}>
              Once inside a meeting room, you can toggle controls instantly with keyboard shortcuts:
            </Typography>

            <div className={styles.shortcutsGrid}>
              <div className={styles.shortcutRow}>
                <span>Toggle Microphone (Mute / Unmute)</span>
                <kbd className={styles.kbdKey}>M</kbd>
              </div>
              <div className={styles.shortcutRow}>
                <span>Toggle Camera (Video On / Off)</span>
                <kbd className={styles.kbdKey}>V</kbd>
              </div>
              <div className={styles.shortcutRow}>
                <span>Toggle Chat Drawer</span>
                <kbd className={styles.kbdKey}>C</kbd>
              </div>
            </div>

            <div className={styles.securityNote}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", marginBottom: "4px" }}>
                <ShieldIcon fontSize="small" />
                <span>Peer-to-Peer Privacy</span>
              </div>
              Meetings run directly in your browser without central media relays when peers can connect directly. Video and audio streams are encrypted end-to-end using WebRTC standard DTLS-SRTP.
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

const Home = withAuth(HomeComponent);
export default Home;
