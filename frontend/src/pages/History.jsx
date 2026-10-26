import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContextDef";
import withAuth from "../utils/WithAuth";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Home as HomeIcon,
  VideoCall as VideoCallIcon,
  CalendarToday as CalendarIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Error as ErrorIcon,
  EventNote as EventNoteIcon,
} from "@mui/icons-material";
import Footer from "../Footer";
import styles from "../styles/History.module.css";

function HistoryComponent() {
  const { getHistoryOfUser, addToUserHistory } = useContext(AuthContext);
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const history = await getHistoryOfUser();
      setMeetings(history || []);
    } catch (err) {
      setError("Failed to load meeting history. Please verify your connection and try again.");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }, [getHistoryOfUser]);

  const filterMeetings = useCallback(() => {
    let filtered = meetings;

    if (searchTerm.trim()) {
      filtered = filtered.filter((meeting) =>
        meeting.meetingCode.toLowerCase().includes(searchTerm.trim().toLowerCase())
      );
    }

    if (filterPeriod !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filterPeriod) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter(
        (meeting) => new Date(meeting.date) >= cutoffDate
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, searchTerm, filterPeriod]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    filterMeetings();
  }, [filterMeetings]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRejoinMeeting = async (meetingCode) => {
    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to rejoin meeting. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCopyMeetingLink = (meetingCode) => {
    const meetingLink = `${window.location.origin}/${meetingCode}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(meetingLink)
        .then(() => {
          setSnackbar({
            open: true,
            message: `Meeting link copied: ${meetingLink}`,
            severity: "success",
          });
        })
        .catch(() => {
          setSnackbar({
            open: true,
            message: "Failed to copy link to clipboard.",
            severity: "error",
          });
        });
    }
  };

  // Mathematically verified metrics calculated from real user history
  const getMeetingStats = () => {
    const totalMeetings = meetings.length;
    const now = new Date();

    const thisMonthMeetings = meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date);
      return (
        meetingDate.getMonth() === now.getMonth() &&
        meetingDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekMeetings = meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= weekAgo;
    }).length;

    return { totalMeetings, thisMonthMeetings, thisWeekMeetings };
  };

  const stats = getMeetingStats();

  return (
    <div className={styles.historyContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <IconButton
              className={styles.backButton}
              onClick={() => navigate("/home")}
              aria-label="Back to home dashboard"
            >
              <HomeIcon fontSize="small" />
            </IconButton>
            <div>
              <Typography className={styles.pageTitle}>
                Meeting History
              </Typography>
              <Typography className={styles.pageSubtitle}>
                Verified past session records for your account
              </Typography>
            </div>
          </div>

          <Button
            className={styles.refreshButton}
            onClick={fetchHistory}
            startIcon={<RefreshIcon fontSize="small" />}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <CircularProgress size={36} style={{ color: "#3b82f6" }} />
            <Typography style={{ color: "var(--vx-text-secondary)", fontSize: "0.9375rem" }}>
              Retrieving your meeting activity...
            </Typography>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <ErrorIcon style={{ color: "#ef4444", fontSize: "2rem" }} />
            <Typography style={{ fontWeight: "600", color: "var(--vx-text-primary)" }}>
              Unable to load history
            </Typography>
            <Typography style={{ color: "var(--vx-text-secondary)", fontSize: "0.875rem" }}>
              {error}
            </Typography>
            <Button
              className={styles.rejoinButton}
              onClick={fetchHistory}
              startIcon={<RefreshIcon />}
            >
              Try Again
            </Button>
          </div>
        ) : meetings.length === 0 ? (
          <div className={styles.emptyState}>
            <EventNoteIcon className={styles.emptyStateIcon} />
            <Typography className={styles.emptyStateTitle}>
              No past meetings recorded
            </Typography>
            <Typography className={styles.emptyStateMessage}>
              When you start or join meetings while signed in, your session activity will be logged here for quick reference.
            </Typography>
            <Button
              className={styles.startMeetingButton}
              onClick={() => navigate("/home")}
              startIcon={<VideoCallIcon />}
            >
              Start a New Meeting
            </Button>
          </div>
        ) : (
          <>
            {/* Verified Statistics Grid */}
            <section className={styles.statsSection} aria-label="Meeting Statistics">
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <HistoryIcon fontSize="small" />
                  </div>
                  <div>
                    <Typography className={styles.statValue}>
                      {stats.totalMeetings}
                    </Typography>
                    <Typography className={styles.statLabel}>
                      Total Recorded Meetings
                    </Typography>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <CalendarIcon fontSize="small" />
                  </div>
                  <div>
                    <Typography className={styles.statValue}>
                      {stats.thisMonthMeetings}
                    </Typography>
                    <Typography className={styles.statLabel}>
                      Meetings This Month
                    </Typography>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <VideoCallIcon fontSize="small" />
                  </div>
                  <div>
                    <Typography className={styles.statValue}>
                      {stats.thisWeekMeetings}
                    </Typography>
                    <Typography className={styles.statLabel}>
                      Meetings in Past 7 Days
                    </Typography>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter and Search Bar */}
            <div className={styles.filterBar}>
              <TextField
                className={styles.searchInput}
                label="Search by meeting code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type code..."
                size="small"
              />

              <TextField
                className={styles.periodSelect}
                select
                label="Time Range"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Past 7 Days</MenuItem>
                <MenuItem value="month">Past 30 Days</MenuItem>
              </TextField>
            </div>

            {/* Meetings List */}
            <div className={styles.meetingsList}>
              {filteredMeetings.map((meeting, index) => (
                <Card key={meeting._id || index} className={styles.meetingCard} elevation={0}>
                  <CardContent className={styles.cardInner}>
                    <div className={styles.meetingInfo}>
                      <div className={styles.meetingCodeRow}>
                        <VideoCallIcon style={{ color: "#60a5fa", fontSize: "1.25rem" }} />
                        <Typography className={styles.meetingCode}>
                          {meeting.meetingCode}
                        </Typography>
                      </div>

                      <div className={styles.meetingDate}>
                        <CalendarIcon style={{ fontSize: "0.9rem", color: "var(--vx-text-muted)" }} />
                        <span>{formatDate(meeting.date)}</span>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <Button
                        className={styles.shareButton}
                        onClick={() => handleCopyMeetingLink(meeting.meetingCode)}
                        startIcon={<CopyIcon fontSize="small" />}
                      >
                        Copy Link
                      </Button>

                      <Button
                        className={styles.rejoinButton}
                        onClick={() => handleRejoinMeeting(meeting.meetingCode)}
                        startIcon={<VideoCallIcon fontSize="small" />}
                      >
                        Rejoin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredMeetings.length === 0 && meetings.length > 0 && (
                <div className={styles.emptyState}>
                  <Typography className={styles.emptyStateTitle}>
                    No matching sessions found
                  </Typography>
                  <Typography className={styles.emptyStateMessage}>
                    No meetings match "{searchTerm}". Try clearing your filter or searching for another code.
                  </Typography>
                  <Button
                    className={styles.rejoinButton}
                    onClick={() => {
                      setSearchTerm("");
                      setFilterPeriod("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

const History = withAuth(HistoryComponent);
export default History;
