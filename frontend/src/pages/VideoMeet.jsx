import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import io from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, IconButton, TextField, Tooltip, CircularProgress } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import LockIcon from "@mui/icons-material/Lock";
import PeopleIcon from "@mui/icons-material/People";
import GridViewIcon from "@mui/icons-material/GridView";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import PanToolIcon from "@mui/icons-material/PanTool";
import styles from "../styles/videoComponent.module.css";
import server from "../environment";

const PEER_CONNECTION_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const OFFER_OPTIONS = { offerToReceiveAudio: true, offerToReceiveVideo: true };
const KEYBOARD_SHORTCUTS = { m: "audio", v: "video", c: "chat" };

// Time formatting helper
function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Media Track Helpers
function createSilentAudioTrack() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const destination = ctx.createMediaStreamDestination();
  oscillator.connect(destination);
  oscillator.start();
  ctx.resume();
  const [track] = destination.stream.getAudioTracks();
  track.enabled = false;
  return track;
}

function createBlackVideoTrack({ width = 640, height = 480 } = {}) {
  const canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  });
  canvas.getContext("2d").fillRect(0, 0, width, height);
  const [track] = canvas.captureStream().getVideoTracks();
  track.enabled = false;
  return track;
}

function createPlaceholderStream() {
  return new MediaStream([createBlackVideoTrack(), createSilentAudioTrack()]);
}

function stopStreamTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

// Presentational Sub-components
const RemoteVideoTile = memo(function RemoteVideoTile({ video }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video.stream) return;

    el.srcObject = video.stream;
    el.muted = false;
    el.volume = 1.0;

    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[RemoteVideoTile] Autoplay prevented:", err);
      });
    }
  }, [video.stream, video.video, video.audio]);

  const hasVideoTrack =
    video.stream &&
    video.stream.getVideoTracks().length > 0 &&
    video.stream.getVideoTracks().some((t) => t.enabled);

  const showVideoOffOverlay = !video.video || !hasVideoTrack;

  return (
    <div className={`${styles.remoteVideoWrapper} ${video.audio ? styles.isSpeaking : ""}`}>
      <video data-socket={video.socketId} ref={videoRef} autoPlay playsInline />

      {/* Speaking neon badge */}
      {video.audio && (
        <div className={styles.speakingBadgeTop}>
          <span className={styles.pulseDot} />
          <span>Speaking</span>
        </div>
      )}

      {/* Camera Off Placeholder */}
      {showVideoOffOverlay && (
        <div className={styles.videoOffPlaceholder}>
          <div className={styles.avatarPlaceholder}>
            {video.username ? video.username.charAt(0).toUpperCase() : "P"}
          </div>
          <span>Camera Off</span>
        </div>
      )}

      {/* Participant Name & Role Tag */}
      <div className={styles.participantPill}>
        <span>{video.username || "Participant"}</span>
        <span className={styles.roleTag}>Peer</span>
      </div>

      {/* Corner Mic Indicator */}
      <div
        className={`${styles.micIndicatorCorner} ${
          video.audio ? styles.micActive : styles.micMuted
        }`}
      >
        {video.audio ? (
          <MicIcon style={{ fontSize: "15px" }} />
        ) : (
          <MicOffIcon style={{ fontSize: "15px" }} />
        )}
      </div>
    </div>
  );
});

// Ready to Join (Lobby / Pre-Join Room)
function Lobby({
  username,
  onUsernameChange,
  localVideoRef,
  onJoin,
  isConnecting,
  video,
  audio,
  onToggleVideo,
  onToggleAudio,
  roomId,
  onCopyLink,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.lobbyContainer}>
      {/* Top Branding Pill */}
      <div className={styles.lobbyBrandHeader}>
        <div className={styles.vionexLogoPill}>
          <div className={styles.brandVIcon}>V</div>
          <span className={styles.brandText}>Vionex Room Sync</span>
        </div>
        <div className={styles.encryptedBadge}>
          <LockIcon style={{ fontSize: "12px" }} />
          <span>Encrypted</span>
        </div>
      </div>

      <div className={styles.lobbyCard}>
        <h1 className={styles.lobbyTitle}>Ready to Join?</h1>
        <p className={styles.lobbySubtitle}>
          Configure your camera & microphone before stepping into the meeting room
        </p>

        {/* Room Information Chip */}
        <div className={styles.roomInfoChip}>
          <span>
            Room ID: <span className={styles.roomInfoCode}>{roomId}</span>
          </span>
          <Tooltip title={copied ? "Copied!" : "Copy Room Link"}>
            <IconButton onClick={handleCopy} className={styles.copyCodeBtn} size="small">
              {copied ? (
                <CheckIcon style={{ fontSize: "16px", color: "#10b981" }} />
              ) : (
                <ContentCopyIcon style={{ fontSize: "16px" }} />
              )}
            </IconButton>
          </Tooltip>
        </div>

        {/* Local Video Preview Frame */}
        <div className={styles.localVideoWrapper}>
          <video ref={localVideoRef} autoPlay muted playsInline />

          {!video && (
            <div className={styles.videoOffPlaceholder}>
              <div className={styles.avatarPlaceholder}>
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
              <span>Camera Turned Off</span>
            </div>
          )}

          {/* Top Live Status Badges */}
          <div className={styles.lobbyMediaStatus}>
            <div className={styles.statusBadgesGroup}>
              <span className={styles.statusBadge}>
                <span className={styles.pulseDot} />
                HD 60FPS
              </span>
              <span className={styles.statusBadge}>⚡ Low Latency</span>
            </div>
            <div className={styles.statusBadgesGroup}>
              <span className={styles.statusBadge}>
                {video ? (
                  <VideocamIcon style={{ fontSize: "14px", color: "#10b981" }} />
                ) : (
                  <VideocamOffIcon style={{ fontSize: "14px", color: "#ef4444" }} />
                )}
                {video ? "Camera On" : "Camera Off"}
              </span>
              <span className={styles.statusBadge}>
                {audio ? (
                  <MicIcon style={{ fontSize: "14px", color: "#10b981" }} />
                ) : (
                  <MicOffIcon style={{ fontSize: "14px", color: "#ef4444" }} />
                )}
                {audio ? "Mic Ready" : "Muted"}
              </span>
            </div>
          </div>

          {/* Floating Pre-Join Toggle Controls */}
          <div className={styles.lobbyOverlayControls}>
            <Tooltip title={video ? "Turn Camera Off (V)" : "Turn Camera On (V)"}>
              <IconButton
                onClick={onToggleVideo}
                className={`${styles.lobbyMediaBtn} ${
                  video ? styles.lobbyMediaBtnActive : styles.lobbyMediaBtnInactive
                }`}
                sx={{
                  width: "50px !important",
                  height: "50px !important",
                  borderRadius: "50% !important",
                  backgroundColor: video
                    ? "rgba(16, 185, 129, 0.22) !important"
                    : "rgba(239, 68, 68, 0.3) !important",
                  color: video ? "#10b981 !important" : "#ef4444 !important",
                  border: video
                    ? "2px solid #10b981 !important"
                    : "2px solid #ef4444 !important",
                  boxShadow: video
                    ? "0 0 16px rgba(16, 185, 129, 0.4) !important"
                    : "0 0 16px rgba(239, 68, 68, 0.4) !important",
                  transition: "all 0.2s ease !important",
                  "&:hover": {
                    transform: "scale(1.08) !important",
                    backgroundColor: video
                      ? "rgba(16, 185, 129, 0.38) !important"
                      : "rgba(239, 68, 68, 0.45) !important",
                  },
                }}
              >
                {video ? (
                  <VideocamIcon sx={{ fontSize: "26px !important", color: "#10b981 !important" }} />
                ) : (
                  <VideocamOffIcon sx={{ fontSize: "26px !important", color: "#ef4444 !important" }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title={audio ? "Mute Microphone (M)" : "Unmute Microphone (M)"}>
              <IconButton
                onClick={onToggleAudio}
                className={`${styles.lobbyMediaBtn} ${
                  audio ? styles.lobbyMediaBtnActive : styles.lobbyMediaBtnInactive
                }`}
                sx={{
                  width: "50px !important",
                  height: "50px !important",
                  borderRadius: "50% !important",
                  backgroundColor: audio
                    ? "rgba(16, 185, 129, 0.22) !important"
                    : "rgba(239, 68, 68, 0.3) !important",
                  color: audio ? "#10b981 !important" : "#ef4444 !important",
                  border: audio
                    ? "2px solid #10b981 !important"
                    : "2px solid #ef4444 !important",
                  boxShadow: audio
                    ? "0 0 16px rgba(16, 185, 129, 0.4) !important"
                    : "0 0 16px rgba(239, 68, 68, 0.4) !important",
                  transition: "all 0.2s ease !important",
                  "&:hover": {
                    transform: "scale(1.08) !important",
                    backgroundColor: audio
                      ? "rgba(16, 185, 129, 0.38) !important"
                      : "rgba(239, 68, 68, 0.45) !important",
                  },
                }}
              >
                {audio ? (
                  <MicIcon sx={{ fontSize: "26px !important", color: "#10b981 !important" }} />
                ) : (
                  <MicOffIcon sx={{ fontSize: "26px !important", color: "#ef4444 !important" }} />
                )}
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Display Name Input */}
        <TextField
          label="Your Display Name"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          variant="outlined"
          className={styles.input}
          required
          fullWidth
          disabled={isConnecting}
          onKeyDown={(e) => e.key === "Enter" && username.trim() && !isConnecting && onJoin()}
          sx={{
            marginBottom: "1.25rem",
            width: "100%",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(19, 25, 38, 0.95) !important",
              borderRadius: "14px !important",
              border: "1.5px solid rgba(255, 255, 255, 0.2) !important",
              transition: "all 0.2s ease !important",
              "& fieldset": {
                border: "none !important",
              },
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.4) !important",
              },
              "&.Mui-focused": {
                borderColor: "#6366f1 !important",
                boxShadow: "0 0 16px rgba(99, 102, 241, 0.4) !important",
              },
            },
            "& .MuiInputBase-input": {
              color: "#ffffff !important",
              WebkitTextFillColor: "#ffffff !important",
              fontWeight: "700 !important",
              fontSize: "1.1rem !important",
              padding: "14px 16px !important",
            },
            "& .MuiInputLabel-root": {
              color: "#94a3b8 !important",
              fontWeight: "600 !important",
              fontSize: "0.95rem !important",
              "&.Mui-focused": {
                color: "#818cf8 !important",
                fontWeight: "700 !important",
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <PersonIcon style={{ color: "#818cf8", marginRight: "10px", fontSize: "22px" }} />
              ),
            },
          }}
        />

        {/* Prominent Gradient Join Button */}
        <Button
          variant="contained"
          onClick={onJoin}
          className={styles.connectButton}
          fullWidth
          disabled={!username.trim() || isConnecting}
          startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isConnecting ? "Connecting to Mesh Room..." : "Join Meeting Now"}
        </Button>

        {/* Keyboard Shortcut Hints */}
        <div className={styles.keyboardShortcutsHint}>
          <span>Shortcuts:</span>
          <span><kbd className={styles.kbdKey}>M</kbd> Mic</span>
          <span><kbd className={styles.kbdKey}>V</kbd> Camera</span>
          <span><kbd className={styles.kbdKey}>↵</kbd> Join</span>
        </div>
      </div>
    </div>
  );
}

function ConnectingOverlay() {
  return (
    <div className={styles.connectingOverlay}>
      <div className={styles.connectingCard}>
        <CircularProgress size={48} sx={{ color: "#6366f1" }} />
        <h3 className={styles.connectingTitle}>Joining Meeting Room...</h3>
        <p className={styles.connectingSubtitle}>Establishing secure WebRTC audio & video mesh connection</p>
      </div>
    </div>
  );
}

// Left Navigation Rail for Desktop
function LeftNavRail({ showChat, onToggleChat, participantCount, onCopyLink }) {
  return (
    <aside className={styles.leftRail}>
      <div className={styles.railTop}>
        <Tooltip title="Vionex Meet" placement="right">
          <div className={styles.railLogoSquare}>V</div>
        </Tooltip>

        <nav className={styles.railNav}>
          <Tooltip title="Video Stage (Active)" placement="right">
            <IconButton className={`${styles.railBtn} ${styles.activeNav}`}>
              <VideocamIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="In-Call Chat" placement="right">
            <IconButton
              onClick={onToggleChat}
              className={`${styles.railBtn} ${showChat ? styles.activeNav : ""}`}
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Participants (${participantCount})`} placement="right">
            <IconButton onClick={onToggleChat} className={styles.railBtn}>
              <PeopleIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Copy Invite Link" placement="right">
            <IconButton onClick={onCopyLink} className={styles.railBtn}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </nav>
      </div>

      <div className={styles.railBottom}>
        <Tooltip title="Audio & Video Settings" placement="right">
          <IconButton className={styles.railBtn}>
            <TuneIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Meeting Shortcuts: M (Mute), V (Video), C (Chat)" placement="right">
          <IconButton className={styles.railBtn}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </div>
    </aside>
  );
}

// Top Telemetry & Meeting Header Bar
function MeetingHeader({
  roomId,
  callDuration,
  participantCount,
  viewMode,
  onToggleViewMode,
  isFullscreen,
  onToggleFullscreen,
  username,
  isMobile,
}) {
  return (
    <header className={styles.meetingHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.meetingTitleWrapper}>
          <h2 className={styles.meetingTitle} title={roomId}>
            {roomId ? roomId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Sprint Architecture Sync"}
          </h2>
          <div className={styles.liveDurationPill}>
            <span className={styles.pulseDot} />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <div className={styles.headerEncryptedBadge}>
            <LockIcon style={{ fontSize: "11px" }} />
            <span>Encrypted</span>
          </div>
        </div>

        {!isMobile && (
          <div className={styles.headerSubStatus}>
            <div className={styles.subStatusItem}>
              <span className={styles.pulseDot} />
              <span>Auto-Focus Stage</span>
            </div>
            <div className={styles.subStatusItem}>
              <span>40 ms latency</span>
            </div>
            <div className={styles.subStatusItem}>
              <span>⚡ Active</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.headerRight}>
        {!isMobile && (
          <>
            <button
              onClick={onToggleViewMode}
              className={styles.headerPillBtn}
              title="Toggle View Mode"
            >
              <GridViewIcon style={{ fontSize: "16px" }} />
              <span>{viewMode === "grid" ? `Gallery (${participantCount})` : "Stage View"}</span>
            </button>

            <span className={styles.headerQualityBadge}>📶 HD 60 FPS</span>
          </>
        )}

        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton
            onClick={onToggleFullscreen}
            className={styles.headerPillBtn}
            size="small"
            style={{ width: "34px", height: "34px", padding: 0 }}
          >
            {isFullscreen ? (
              <CloseFullscreenIcon style={{ fontSize: "18px" }} />
            ) : (
              <OpenInFullIcon style={{ fontSize: "18px" }} />
            )}
          </IconButton>
        </Tooltip>

        <div className={styles.userProfileBadge} title={`${username} (You)`}>
          {username ? username.charAt(0).toUpperCase() : "U"}
          <span className={styles.userOnlineDot} />
        </div>
      </div>
    </header>
  );
}

// In-Call Chat & Participants Panel (Desktop Sidebar & Mobile Drawer)
function ChatPanel({
  messages,
  message,
  onMessageChange,
  onSend,
  onClose,
  isSending,
  onQuickEmoji,
  participants,
  isMobile,
  isExpanded,
  onToggleExpand,
  currentUsername,
  onCopyLink,
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const chatDisplayRef = useRef(null);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const quickEmojis = ["❤️", "👍", "🚀", "⚡", "🔥", "👏"];

  const content = (
    <div className={styles.chatContainer}>
      {/* Top Header Tabs */}
      <div className={styles.chatHeaderTabs}>
        <div className={styles.tabsGroup}>
          <button
            onClick={() => setActiveTab("chat")}
            className={`${styles.tabBtn} ${activeTab === "chat" ? styles.activeTab : ""}`}
          >
            <ChatIcon style={{ fontSize: "16px" }} />
            <span>In-Call Chat</span>
            {messages.length > 0 && <span className={styles.tabBadge}>{messages.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className={`${styles.tabBtn} ${activeTab === "people" ? styles.activeTab : ""}`}
          >
            <PeopleIcon style={{ fontSize: "16px" }} />
            <span>People</span>
            <span className={styles.tabBadge}>{participants.length}</span>
          </button>
        </div>

        <IconButton onClick={onClose} className={styles.chatCloseBtn} size="small">
          <CloseIcon style={{ fontSize: "20px" }} />
        </IconButton>
      </div>

      {activeTab === "chat" ? (
        <>
          {/* Ephemeral Privacy Notice Banner */}
          <div className={styles.privacyBanner}>
            <LockIcon />
            <span>
              Messages are visible to participants in this session and vanish permanently once the
              meeting ends.
            </span>
          </div>

          {/* Messages Stream */}
          <div className={styles.chattingDisplay} ref={chatDisplayRef}>
            {messages.length ? (
              messages.map((item, index) => {
                const isYou = item.sender === currentUsername || item.sender === "You";
                return isYou ? (
                  <div key={index} className={styles.outgoingMsgGroup}>
                    <div className={styles.outgoingMsgMeta}>
                      <span className={styles.msgTimestamp}>Just now</span>
                      <span className={styles.youBadge}>You</span>
                    </div>
                    <div className={styles.outgoingMsgBubble}>{item.data}</div>
                  </div>
                ) : (
                  <div key={index} className={styles.incomingMsgGroup}>
                    <div className={styles.msgSenderMeta}>
                      <span className={styles.senderName}>{item.sender}</span>
                      <span className={styles.msgTimestamp}>In Call</span>
                    </div>
                    <div className={styles.incomingMsgBubble}>{item.data}</div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyChatPrompt}>
                <ChatIcon style={{ fontSize: "32px", opacity: 0.3 }} />
                <span>No messages yet. Start the conversation!</span>
              </div>
            )}
          </div>

          {/* Quick Reaction Emojis */}
          <div className={styles.quickEmojiBar}>
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onQuickEmoji(emoji)}
                className={styles.emojiChip}
                type="button"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Composer */}
          <div className={styles.chattingArea}>
            <div className={styles.chatRecipientBar}>
              <span className={styles.sendToSelector}>Send to: Everyone ▾</span>
              <span className={styles.pressEnterHint}>Press Enter ↵</span>
            </div>

            <div className={styles.chatInputRow}>
              <input
                type="text"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Type a message to everyone..."
                className={styles.chatInputField}
                onKeyDown={(e) => e.key === "Enter" && !isSending && onSend()}
                disabled={isSending}
              />
              <IconButton
                onClick={onSend}
                disabled={!message.trim() || isSending}
                className={styles.chatSendBtn}
                size="small"
              >
                {isSending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendIcon style={{ fontSize: "17px" }} />
                )}
              </IconButton>
            </div>
          </div>
        </>
      ) : (
        /* People Tab */
        <div className={styles.peopleListArea}>
          {participants.map((person, idx) => (
            <div key={person.id || idx} className={styles.participantItem}>
              <div className={styles.participantUserMeta}>
                <div className={styles.participantItemAvatar}>
                  {person.name ? person.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <div className={styles.participantItemName}>
                    {person.name} {person.isYou ? "(You)" : ""}
                  </div>
                  {person.isHost && <span className={styles.roleTag}>Host</span>}
                </div>
              </div>

              <div className={styles.participantItemIcons}>
                {person.audio ? (
                  <MicIcon style={{ fontSize: "16px", color: "#10b981" }} />
                ) : (
                  <MicOffIcon style={{ fontSize: "16px", color: "#ef4444" }} />
                )}
                {person.video ? (
                  <VideocamIcon style={{ fontSize: "16px", color: "#818cf8" }} />
                ) : (
                  <VideocamOffIcon style={{ fontSize: "16px", color: "#64748b" }} />
                )}
              </div>
            </div>
          ))}

          <div className={styles.inviteButtonRow}>
            <button onClick={onCopyLink} className={styles.inviteFullBtn} type="button">
              <AddIcon style={{ fontSize: "18px" }} />
              <span>Copy Meeting Invite Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If on mobile screen, render as bottom-sheet modal / drawer
  if (isMobile) {
    return (
      <div
        className={`${styles.mobileLiveThreadDrawer} ${
          isExpanded ? styles.expandedDrawer : styles.collapsedDrawer
        }`}
      >
        <div className={styles.drawerGrabHandle} onClick={onToggleExpand} />
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>
            <ChatIcon style={{ fontSize: "16px", color: "#818cf8" }} />
            Live Thread ({messages.length})
          </span>
          <button onClick={onToggleExpand} className={styles.drawerExpandBtn} type="button">
            {isExpanded ? "Collapse ▾" : "Expand ⤢"}
          </button>
        </div>
        {content}
      </div>
    );
  }

  // Desktop side panel
  return <aside className={styles.chatRoom}>{content}</aside>;
}

// Floating Bottom Control Bar
function ControlBar({
  video,
  audio,
  screen,
  screenAvailable,
  showChat,
  newMessages,
  onToggleVideo,
  onToggleAudio,
  onToggleScreen,
  onToggleChat,
  onCopyLink,
  onEndCall,
}) {
  return (
    <div className={styles.buttonContainers}>
      {/* Audio Mute/Unmute */}
      <Tooltip title={audio ? "Mute Mic (M)" : "Unmute Mic (M)"}>
        <IconButton
          onClick={onToggleAudio}
          className={`${styles.controlButton} ${
            audio ? styles.btnAudioActive : styles.btnAudioInactive
          }`}
        >
          {audio ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>

      {/* Video Camera Toggle */}
      <Tooltip title={video ? "Turn Video Off (V)" : "Turn Video On (V)"}>
        <IconButton
          onClick={onToggleVideo}
          className={`${styles.controlButton} ${
            video ? styles.btnVideoActive : styles.btnVideoInactive
          }`}
        >
          {video ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
      </Tooltip>

      {/* Screen Share */}
      {screenAvailable && (
        <Tooltip title={screen ? "Stop Sharing Screen" : "Share Entire Screen"}>
          <IconButton
            onClick={onToggleScreen}
            className={`${styles.controlButton} ${
              screen ? styles.btnScreenActive : styles.btnScreenInactive
            }`}
          >
            {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
        </Tooltip>
      )}

      {/* In-Call Chat Drawer / Sidebar */}
      <Tooltip title="In-Call Chat & Reactions (C)">
        <Badge badgeContent={newMessages} max={99} color="error">
          <IconButton
            onClick={onToggleChat}
            className={`${styles.controlButton} ${
              showChat ? styles.btnChatActive : styles.btnChatInactive
            }`}
          >
            <ChatIcon />
          </IconButton>
        </Badge>
      </Tooltip>

      {/* Quick Invite Link */}
      <Tooltip title="Copy Meeting Link">
        <IconButton onClick={onCopyLink} className={`${styles.controlButton} ${styles.btnUtility}`}>
          <ContentCopyIcon />
        </IconButton>
      </Tooltip>

      {/* Red Capsule End Call Button */}
      <Tooltip title="Leave or End Call">
        <button onClick={onEndCall} className={styles.endCallBtn} type="button">
          <CallEndIcon style={{ fontSize: "20px" }} />
          <span>End</span>
        </button>
      </Tooltip>
    </div>
  );
}

// Conference View (Handles Desktop Grid & Mobile Spotlight + Peers Carousel)
function ConferenceView({
  localVideoRef,
  username,
  video,
  audio,
  videos,
  isMobile,
  onCopyLink,
}) {
  // Mobile View: Spotlight Active Speaker + Horizontal Peers in Sync Carousel Strip
  if (isMobile) {
    const hasPeers = videos.length > 0;
    const spotlightPeer = hasPeers ? videos[0] : null;

    return (
      <div className={styles.mobileLayoutWrapper}>
        {/* Main Spotlight Video Stage */}
        <div className={styles.spotlightMainTile}>
          {spotlightPeer ? (
            <RemoteVideoTile video={spotlightPeer} />
          ) : (
            <div className={styles.remoteVideoWrapper}>
              <video ref={localVideoRef} autoPlay muted playsInline />
              {!video && (
                <div className={styles.videoOffPlaceholder}>
                  <div className={styles.avatarPlaceholder}>
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span>Camera Off</span>
                </div>
              )}
              <div className={styles.participantPill}>
                <span>{username || "You"} (Me)</span>
                <span className={styles.roleTag}>Host</span>
              </div>
              <div
                className={`${styles.micIndicatorCorner} ${
                  audio ? styles.micActive : styles.micMuted
                }`}
              >
                {audio ? (
                  <MicIcon style={{ fontSize: "15px" }} />
                ) : (
                  <MicOffIcon style={{ fontSize: "15px" }} />
                )}
              </div>
            </div>
          )}

          {/* Mobile Top Latency Chip */}
          <div className={styles.mobileTelemetryBar}>
            <span className={styles.mobileLatencyChip}>⚡ 40ms - HD 60fps</span>
          </div>
        </div>

        {/* Peers in Sync Section */}
        <div className={styles.peersInSyncSection}>
          <div className={styles.peersSectionHeader}>
            <span className={styles.peersTitle}>
              PEERS IN SYNC ({videos.length + 1})
            </span>
            <span className={styles.peersViewAll} onClick={onCopyLink}>
              View All ({videos.length + 1}) ›
            </span>
          </div>

          <div className={styles.peersCarousel}>
            {/* Local Video Mini Card */}
            <div className={styles.peerMiniCard}>
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className={styles.peerMiniName}>{username || "You"} (Me)</div>
            </div>

            {/* Remote Participants */}
            {videos.map((peer) => (
              <div key={peer.socketId} className={styles.peerMiniCard}>
                <RemoteVideoTile video={peer} />
                <div className={styles.peerMiniName}>{peer.username}</div>
              </div>
            ))}

            {/* Invite Peer Action Card */}
            <div className={styles.peerInviteCard} onClick={onCopyLink} title="Invite Others">
              <AddIcon style={{ fontSize: "20px" }} />
              <span>Invite</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View: Balanced Conference Grid
  return (
    <div
      className={styles.conferenceView}
      data-participant-count={videos.length + 1}
    >
      {/* Local Video Tile */}
      <div className={`${styles.remoteVideoWrapper} ${audio ? styles.isSpeaking : ""}`}>
        <video ref={localVideoRef} autoPlay muted playsInline />

        {/* Speaking indicator for local user */}
        {audio && (
          <div className={styles.speakingBadgeTop}>
            <span className={styles.pulseDot} />
            <span>Speaking</span>
          </div>
        )}

        {!video && (
          <div className={styles.videoOffPlaceholder}>
            <div className={styles.avatarPlaceholder}>
              {username ? username.charAt(0).toUpperCase() : "U"}
            </div>
            <span>Camera Off</span>
          </div>
        )}

        <div className={styles.participantPill}>
          <span>{username || "You"} (Me)</span>
          <span className={styles.roleTag}>Host</span>
        </div>

        <div
          className={`${styles.micIndicatorCorner} ${
            audio ? styles.micActive : styles.micMuted
          }`}
        >
          {audio ? (
            <MicIcon style={{ fontSize: "15px" }} />
          ) : (
            <MicOffIcon style={{ fontSize: "15px" }} />
          )}
        </div>
      </div>

      {/* Remote Video Tiles */}
      {videos.map((v) => (
        <RemoteVideoTile key={v.socketId} video={v} />
      ))}
    </div>
  );
}

// Main VideoMeetComponent
export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const { url: routeRoomCode } = useParams();
  const roomId = routeRoomCode || window.location.pathname.replace(/^\/+/, "");

  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const connectionsRef = useRef({});
  const iceCandidatesQueueRef = useRef({});
  const latestVideosRef = useRef([]);
  const peerConfigRef = useRef(PEER_CONNECTION_CONFIG);
  const makingOfferRef = useRef({});

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);

  const [askForUsername, setAskForUsername] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [username, setUsername] = useState(
    localStorage.getItem("name") || localStorage.getItem("username") || "User"
  );

  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);

  const [videos, setVideos] = useState([]);

  // Telemetry & UI Layout States
  const [callDuration, setCallDuration] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "stage"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Resize listener for mobile viewport responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Meeting duration timer
  useEffect(() => {
    if (askForUsername) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [askForUsername]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("[Fullscreen error]", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("[Exit Fullscreen error]", err);
      });
    }
  }, []);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "stage" : "grid"));
  }, []);

  // Dynamic ICE server retrieval (STUN + environment TURN)
  useEffect(() => {
    let active = true;
    fetch(`${server}/api/users/ice_config`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.iceServers && Array.isArray(data.iceServers)) {
          peerConfigRef.current = { iceServers: data.iceServers };
        }
      })
      .catch((err) => {
        console.warn("[VideoMeet] Fallback to default STUN servers:", err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  // Bind local stream to localVideoRef element
  const attachLocalStream = useCallback(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch((err) =>
        console.warn("[LocalVideo] play error:", err)
      );
    }
  }, []);

  useEffect(() => {
    attachLocalStream();
  }, [askForUsername, attachLocalStream]);

  // Capability check for screen share
  useEffect(() => {
    setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));
  }, []);

  // Media acquisition
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) return stopStreamTracks(stream);
        setVideoAvailable(true);
        setAudioAvailable(true);
        localStreamRef.current = stream;
        attachLocalStream();
      } catch (err) {
        console.warn("[getUserMedia] Camera+Mic failed, trying audio only:", err);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          if (cancelled) return stopStreamTracks(stream);
          setVideoAvailable(false);
          setAudioAvailable(true);
          setVideo(false);
          localStreamRef.current = stream;
          attachLocalStream();
        } catch (err2) {
          console.warn("[getUserMedia] No media granted, using placeholder:", err2);
          setVideoAvailable(false);
          setAudioAvailable(false);
          setVideo(false);
          setAudio(false);
          const placeholder = createPlaceholderStream();
          localStreamRef.current = placeholder;
          attachLocalStream();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachLocalStream]);

  // Track replacement helper across WebRTC peers
  const replaceTracksOnPeers = useCallback((newStream) => {
    if (!newStream) return;
    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];

    Object.values(connectionsRef.current).forEach((peer) => {
      peer.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" && videoTrack) {
          sender.replaceTrack(videoTrack).catch((err) =>
            console.error("[replaceTrack video error]", err)
          );
        } else if (sender.track?.kind === "audio" && audioTrack) {
          sender.replaceTrack(audioTrack).catch((err) =>
            console.error("[replaceTrack audio error]", err)
          );
        }
      });
    });
  }, []);

  // WebRTC Peer Connection Factory
  const getOrCreatePeerConnection = useCallback(
    (peerId, peerUsername = "Participant", peerAudio = true, peerVideo = true) => {
      if (connectionsRef.current[peerId]) {
        return connectionsRef.current[peerId];
      }

      const peer = new RTCPeerConnection(peerConfigRef.current);
      connectionsRef.current[peerId] = peer;

      peer.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit(
            "signal",
            peerId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };

      peer.ontrack = (event) => {
        let eventStream = event.streams && event.streams[0];
        const newTrack = event.track;

        setVideos((prev) => {
          const filtered = prev.filter((v) => v.socketId !== peerId);
          const existing = prev.find((v) => v.socketId === peerId);
          let updatedStream;

          if (existing && existing.stream) {
            const tracks = Array.from(
              new Set([...existing.stream.getTracks(), newTrack])
            );
            updatedStream = new MediaStream(tracks);
          } else if (eventStream) {
            const tracks = Array.from(
              new Set([...eventStream.getTracks(), newTrack])
            );
            updatedStream = new MediaStream(tracks);
          } else {
            updatedStream = new MediaStream([newTrack]);
          }

          const next = [
            ...filtered,
            {
              socketId: peerId,
              stream: updatedStream,
              username: existing?.username || peerUsername,
              audio: existing?.audio ?? peerAudio,
              video: existing?.video ?? peerVideo,
            },
          ];
          latestVideosRef.current = next;
          return next;
        });
      };

      if (!localStreamRef.current) {
        localStreamRef.current = createPlaceholderStream();
      }
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });

      return peer;
    },
    []
  );

  // Process queued ICE candidates
  const processQueuedCandidates = useCallback((peerId, peer) => {
    const queue = iceCandidatesQueueRef.current[peerId];
    if (queue && queue.length) {
      queue.forEach((cand) => {
        peer.addIceCandidate(cand).catch((e) =>
          console.warn("[addIceCandidate queued error]", e)
        );
      });
      delete iceCandidatesQueueRef.current[peerId];
    }
  }, []);

  // WebRTC Signal Handler
  const handleSignal = useCallback(
    async (fromId, rawMessage) => {
      if (fromId === socketIdRef.current) return;

      try {
        const signal = JSON.parse(rawMessage);

        if (signal.sdp) {
          if (signal.sdp.type === "offer") {
            const peer = getOrCreatePeerConnection(fromId);
            const isPolite = socketIdRef.current < fromId;
            const offerCollision =
              peer.signalingState !== "stable" || makingOfferRef.current[fromId];

            if (offerCollision) {
              if (!isPolite) return;
              await Promise.all([
                peer.setLocalDescription({ type: "rollback" }),
                peer.setRemoteDescription(new RTCSessionDescription(signal.sdp)),
              ]);
            } else {
              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            }

            processQueuedCandidates(fromId, peer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socketRef.current?.emit(
              "signal",
              fromId,
              JSON.stringify({ sdp: peer.localDescription })
            );
          } else if (signal.sdp.type === "answer") {
            const peer = connectionsRef.current[fromId];
            if (peer) {
              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              processQueuedCandidates(fromId, peer);
            }
          }
        }

        if (signal.ice) {
          const candidate = new RTCIceCandidate(signal.ice);
          const peer = connectionsRef.current[fromId];
          if (peer && peer.remoteDescription) {
            peer.addIceCandidate(candidate).catch((err) =>
              console.warn(`[addIceCandidate error for ${fromId}]`, err)
            );
          } else {
            if (!iceCandidatesQueueRef.current[fromId]) {
              iceCandidatesQueueRef.current[fromId] = [];
            }
            iceCandidatesQueueRef.current[fromId].push(candidate);
          }
        }
      } catch (err) {
        console.error("Error parsing WebRTC signal:", err);
      }
    },
    [getOrCreatePeerConnection, processQueuedCandidates]
  );

  // Socket Connection Setup
  const connectToSocketServer = useCallback(
    (initialVideo, initialAudio) => {
      setIsConnecting(true);

      const token = localStorage.getItem("token");
      const socket = io(server, {
        auth: { token: token || undefined },
        transports: ["websocket", "polling"],
        secure: window.location.protocol === "https:",
      });
      socketRef.current = socket;

      socket.on("signal", handleSignal);

      socket.on("join-error", (errorMessage) => {
        setIsConnecting(false);
        alert(errorMessage || "Could not join call.");
        navigate("/home");
      });

      socket.on("connect", () => {
        socketIdRef.current = socket.id;

        socket.emit(
          "join-call",
          roomId,
          username,
          initialVideo,
          initialAudio
        );

        setIsConnecting(false);
      });

      socket.on("user-joined", (joinedSocketId, clients) => {
        if (!Array.isArray(clients)) return;

        const activeSocketIds = new Set();

        clients.forEach((client) => {
          const peerId = typeof client === "object" ? client.id : client;
          const peerUsername =
            typeof client === "object" ? client.username || "Participant" : "Participant";
          const peerAudio = typeof client === "object" ? client.audio ?? true : true;
          const peerVideo = typeof client === "object" ? client.video ?? true : true;

          if (!peerId || peerId === socketIdRef.current) return;

          activeSocketIds.add(peerId);
          getOrCreatePeerConnection(peerId, peerUsername, peerAudio, peerVideo);

          setVideos((prev) => {
            const filtered = prev.filter((v) => v.socketId !== peerId);
            const existing = prev.find((v) => v.socketId === peerId);
            return [
              ...filtered,
              {
                socketId: peerId,
                stream: existing?.stream || null,
                username: peerUsername,
                audio: peerAudio,
                video: peerVideo,
              },
            ];
          });
        });

        setVideos((prev) => prev.filter((v) => activeSocketIds.has(v.socketId)));

        if (joinedSocketId === socketIdRef.current) {
          Object.entries(connectionsRef.current).forEach(([peerId, peer]) => {
            if (peerId === socketIdRef.current) return;
            makingOfferRef.current[peerId] = true;
            peer
              .createOffer(OFFER_OPTIONS)
              .then((offer) => peer.setLocalDescription(offer))
              .then(() => {
                socket.emit(
                  "signal",
                  peerId,
                  JSON.stringify({ sdp: peer.localDescription })
                );
              })
              .catch((err) =>
                console.error(`[user-joined offer error for ${peerId}]`, err)
              )
              .finally(() => {
                makingOfferRef.current[peerId] = false;
              });
          });
        }
      });

      socket.on("chat-message", (data, sender, senderId) => {
        setMessages((prev) => [...prev, { sender, data }]);
        if (senderId !== socketIdRef.current) {
          setNewMessages((prev) => prev + 1);
        }
        setIsSendingChat(false);
      });

      socket.on("media-toggled", ({ socketId, type, state }) => {
        setVideos((prev) => {
          const next = prev.map((v) =>
            v.socketId === socketId ? { ...v, [type]: state } : v
          );
          latestVideosRef.current = next;
          return next;
        });
      });

      socket.on("user-left", (leftId) => {
        if (connectionsRef.current[leftId]) {
          connectionsRef.current[leftId].close();
          delete connectionsRef.current[leftId];
        }
        delete iceCandidatesQueueRef.current[leftId];

        setVideos((prev) => {
          const next = prev.filter((v) => v.socketId !== leftId);
          latestVideosRef.current = next;
          return next;
        });
      });
    },
    [roomId, username, handleSignal, getOrCreatePeerConnection, navigate]
  );

  // Control Actions
  const handleToggleVideo = useCallback(() => {
    setVideo((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current
          .getVideoTracks()
          .forEach((track) => (track.enabled = next));
      }
      socketRef.current?.emit("toggle-video", {
        roomId: roomId,
        video: next,
      });
      return next;
    });
  }, [roomId]);

  const handleToggleAudio = useCallback(() => {
    setAudio((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current
          .getAudioTracks()
          .forEach((track) => (track.enabled = next));
      }
      socketRef.current?.emit("toggle-audio", {
        roomId: roomId,
        audio: next,
      });
      return next;
    });
  }, [roomId]);

  const handleToggleScreen = useCallback(() => {
    if (!screen) {
      navigator.mediaDevices
        ?.getDisplayMedia({ video: true, audio: true })
        .then((screenStream) => {
          setScreen(true);
          replaceTracksOnPeers(screenStream);
          if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

          screenStream.getVideoTracks()[0].onended = () => {
            setScreen(false);
            if (localStreamRef.current) {
              replaceTracksOnPeers(localStreamRef.current);
              if (localVideoRef.current)
                localVideoRef.current.srcObject = localStreamRef.current;
            }
          };
        })
        .catch((err) => console.error("Screen share cancelled/failed:", err));
    } else {
      setScreen(false);
      if (localStreamRef.current) {
        replaceTracksOnPeers(localStreamRef.current);
        if (localVideoRef.current)
          localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [screen, replaceTracksOnPeers]);

  const handleToggleChat = useCallback(() => {
    setShowChat((prev) => {
      const next = !prev;
      if (next) setNewMessages(0);
      return next;
    });
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isSendingChat) return;
    setIsSendingChat(true);
    socketRef.current?.emit("chat-message", message.trim());
    setMessage("");
  }, [message, isSendingChat]);

  const handleQuickEmoji = useCallback((emoji) => {
    socketRef.current?.emit("chat-message", emoji);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Meeting link copied to clipboard!");
    });
  }, []);

  const handleEndCall = useCallback(() => {
    socketRef.current?.emit("leave-call");
    stopStreamTracks(localStreamRef.current);
    Object.values(connectionsRef.current).forEach((peer) => peer.close());
    socketRef.current?.disconnect();
    navigate("/home");
  }, [navigate]);

  const handleJoin = useCallback(() => {
    if (!username.trim()) return;
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer(videoAvailable, audioAvailable);
  }, [username, videoAvailable, audioAvailable, connectToSocketServer]);

  // Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const action = KEYBOARD_SHORTCUTS[e.key.toLowerCase()];
      if (!action) return;

      e.preventDefault();
      if (action === "audio") handleToggleAudio();
      else if (action === "video") handleToggleVideo();
      else if (action === "chat") handleToggleChat();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleToggleAudio, handleToggleVideo, handleToggleChat]);

  // Cleanup on unmount
  useEffect(() => {
    const activeConnections = connectionsRef.current;
    return () => {
      socketRef.current?.emit("leave-call");
      stopStreamTracks(localStreamRef.current);
      if (activeConnections) {
        Object.values(activeConnections).forEach((peer) => peer.close());
      }
      socketRef.current?.disconnect();
    };
  }, []);

  // Aggregated participant list for People tab
  const allParticipants = [
    {
      id: "local",
      name: username || "You",
      isYou: true,
      isHost: true,
      audio: audio,
      video: video,
    },
    ...videos.map((v) => ({
      id: v.socketId,
      name: v.username || "Participant",
      isYou: false,
      isHost: false,
      audio: v.audio,
      video: v.video,
    })),
  ];

  // Render Ready to Join (Lobby)
  if (askForUsername) {
    return (
      <div className={styles.container}>
        <Lobby
          username={username}
          onUsernameChange={setUsername}
          localVideoRef={localVideoRef}
          onJoin={handleJoin}
          isConnecting={isConnecting}
          video={video}
          audio={audio}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          roomId={roomId}
          onCopyLink={handleCopyLink}
        />
      </div>
    );
  }

  // Render In-Call Meeting Room
  return (
    <div className={styles.container}>
      {isConnecting && <ConnectingOverlay />}

      <div className={styles.meetVideoContainer}>
        {/* Desktop Left Rail Navigation */}
        {!isMobile && (
          <LeftNavRail
            showChat={showChat}
            onToggleChat={handleToggleChat}
            participantCount={videos.length + 1}
            onCopyLink={handleCopyLink}
          />
        )}

        {/* Main Stage & Conference Grid */}
        <div className={styles.mainMeetingArea}>
          <MeetingHeader
            roomId={roomId}
            callDuration={callDuration}
            participantCount={videos.length + 1}
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            username={username}
            isMobile={isMobile}
          />

          <main className={styles.conferenceContainer}>
            <ConferenceView
              localVideoRef={localVideoRef}
              username={username}
              video={video}
              audio={audio}
              videos={videos}
              isMobile={isMobile}
              onCopyLink={handleCopyLink}
            />
          </main>

          {/* Floating Bottom Control Bar */}
          <ControlBar
            video={video}
            audio={audio}
            screen={screen}
            screenAvailable={screenAvailable}
            showChat={showChat}
            newMessages={newMessages}
            onToggleVideo={handleToggleVideo}
            onToggleAudio={handleToggleAudio}
            onToggleScreen={handleToggleScreen}
            onToggleChat={handleToggleChat}
            onCopyLink={handleCopyLink}
            onEndCall={handleEndCall}
          />
        </div>

        {/* In-Call Chat & People Panel (Sidebar on desktop / Drawer on mobile) */}
        {showChat && (
          <ChatPanel
            messages={messages}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSendMessage}
            onClose={handleToggleChat}
            isSending={isSendingChat}
            onQuickEmoji={handleQuickEmoji}
            participants={allParticipants}
            isMobile={isMobile}
            isExpanded={isChatExpanded}
            onToggleExpand={() => setIsChatExpanded((prev) => !prev)}
            currentUsername={username}
            onCopyLink={handleCopyLink}
          />
        )}
      </div>
    </div>
  );
}
