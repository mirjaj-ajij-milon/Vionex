import React from "react";
import { Link, useNavigate } from "react-router-dom";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ScreenShareOutlinedIcon from "@mui/icons-material/ScreenShareOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import MicIcon from "@mui/icons-material/Mic";
import VideocamIcon from "@mui/icons-material/Videocam";
import CallEndIcon from "@mui/icons-material/CallEnd";
import Footer from "../Footer";
import "../styles/Landingpage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCreateGuestMeeting = () => {
    // Generate an 8-character unique alphanumeric room identifier
    const guestRoomId = Math.random().toString(36).substring(2, 10);
    navigate(`/${guestRoomId}`);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-navbar">
        <Link to="/" className="brand-wrapper">
          <div className="brand-icon">
            <VideoCallIcon fontSize="small" />
          </div>
          <span className="brand-title">Vionex</span>
          <span className="brand-badge">WebRTC P2P</span>
        </Link>

        <nav className="nav-actions" aria-label="Main Navigation">
          <button
            type="button"
            className="btn btn-secondary-vx"
            onClick={handleCreateGuestMeeting}
          >
            Join as Guest
          </button>
          <button
            type="button"
            className="btn btn-ghost-vx"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn btn-primary-vx"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="hero-container">
        <div className="hero-content">
          <div className="hero-pill">
            <ShieldOutlinedIcon style={{ fontSize: "1rem" }} />
            <span>Encrypted WebRTC Conferencing</span>
          </div>

          <h1 className="hero-title">
            Real-time video calls with <span className="hero-title-highlight">zero friction</span>.
          </h1>

          <p className="hero-description">
            Connect directly in your browser with crystal-clear audio, dynamic screen sharing,
            and in-room messaging. No downloads, no room reservations, and no arbitrary timeouts.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn btn-primary-vx"
              onClick={handleCreateGuestMeeting}
            >
              <VideoCallIcon style={{ fontSize: "1.2rem" }} />
              Start Instant Meeting
            </button>
            <Link to="/auth" className="btn btn-secondary-vx">
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Hero Product Mockup */}
        <div className="hero-mockup-wrapper">
          <div className="hero-preview-window">
            <div className="window-titlebar">
              <div className="window-dots">
                <div className="window-dot" />
                <div className="window-dot" />
                <div className="window-dot" />
              </div>
              <span className="window-title">vionex.live/room-8x2f1a</span>
              <div className="window-status">
                <span className="status-indicator" />
                <span>Connected</span>
              </div>
            </div>

            <div className="preview-grid">
              <div className="preview-participant">
                <div className="participant-label">You (Host)</div>
                <div className="participant-avatar-sim">Y</div>
              </div>
              <div className="preview-participant">
                <div className="participant-label">Alex Rivera</div>
                <div className="participant-avatar-sim" style={{ backgroundColor: "#1e3a5f" }}>A</div>
              </div>
              <div className="preview-participant">
                <div className="participant-label">Taylor Chen</div>
                <div className="participant-avatar-sim" style={{ backgroundColor: "#2e2e48" }}>T</div>
              </div>
              <div className="preview-participant">
                <div className="participant-label">Jordan Lee</div>
                <div className="participant-avatar-sim" style={{ backgroundColor: "#1e4d3a" }}>J</div>
              </div>
            </div>

            <div className="preview-controls">
              <div className="mock-btn" title="Microphone Active">
                <MicIcon style={{ fontSize: "1rem" }} />
              </div>
              <div className="mock-btn" title="Camera Active">
                <VideocamIcon style={{ fontSize: "1rem" }} />
              </div>
              <div className="mock-btn mock-btn-danger" title="Leave Call">
                <CallEndIcon style={{ fontSize: "1rem" }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Verified Product Capabilities Section */}
      <section className="features-section">
        <div className="features-header">
          <h2>Engineered for reliable peer communication</h2>
          <p>Every feature is built directly on native browser standards.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <BoltOutlinedIcon />
            </div>
            <h3>Direct WebRTC Mesh</h3>
            <p>
              Media streams flow peer-to-peer whenever possible, minimizing latency and server hops
              for instant voice and video.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldOutlinedIcon />
            </div>
            <h3>Encrypted Streams</h3>
            <p>
              End-to-end media encryption via DTLS-SRTP ensures your audio and video streams remain
              private between active participants.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ScreenShareOutlinedIcon />
            </div>
            <h3>Screen Sharing & Chat</h3>
            <p>
              Present documents, terminal sessions, or browser windows in full resolution while chatting
              alongside peers in real-time.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <DevicesOutlinedIcon />
            </div>
            <h3>Zero Installation</h3>
            <p>
              No browser plugins, desktop clients, or account requirements for guests. Simply share a
              unique meeting URL to connect.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
