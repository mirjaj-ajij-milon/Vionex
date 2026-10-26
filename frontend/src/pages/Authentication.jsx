import React, { useState, useContext } from "react";
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  VideoCall as VideoCallIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { AuthContext } from "../contexts/AuthContextDef";
import { Link } from "react-router-dom";
import styles from "../styles/Authentication.module.css";

export default function Authentication() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [formState, setFormState] = useState(0); // 0 = Login, 1 = Register
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  const { handleRegister, handleLogin } = useContext(AuthContext);

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formState === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Full name is required";
      } else if (!validateName(formData.name)) {
        newErrors.name = "Full name must be at least 2 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (globalError) {
      setGlobalError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setGlobalError("");
    setSuccessMessage("");

    try {
      if (formState === 0) {
        await handleLogin(formData.username, formData.password);
      } else {
        const result = await handleRegister(
          formData.name,
          formData.username,
          formData.password
        );
        setSuccessMessage(result || "Account created successfully! Please sign in.");

        setTimeout(() => {
          setFormState(0);
          setFormData({
            username: "",
            password: "",
            name: "",
            confirmPassword: "",
          });
          setSuccessMessage("");
        }, 1800);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setGlobalError(
        err?.response?.data?.message ||
          "Authentication failed. Please verify your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchForm = (newFormState) => {
    setFormState(newFormState);
    setErrors({});
    setGlobalError("");
    setSuccessMessage("");
    setFormData({ username: "", password: "", name: "", confirmPassword: "" });
  };

  return (
    <div className={styles.authContainer}>
      <Paper className={styles.authCard} elevation={0}>
        <div className={styles.logoContainer}>
          <Avatar className={styles.logoAvatar}>
            <VideoCallIcon />
          </Avatar>
          <Typography className={styles.title}>
            {formState === 0 ? "Welcome back" : "Create an account"}
          </Typography>
          <Typography className={styles.subtitle}>
            {formState === 0
              ? "Sign in to manage your meetings and history"
              : "Register to get your dedicated meeting identity"}
          </Typography>
        </div>

        {/* Tab Switch */}
        <div className={styles.toggleContainer} role="tablist">
          <Button
            type="button"
            className={`${styles.toggleButton} ${
              formState === 0
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive
            }`}
            onClick={() => switchForm(0)}
          >
            Sign In
          </Button>
          <Button
            type="button"
            className={`${styles.toggleButton} ${
              formState === 1
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive
            }`}
            onClick={() => switchForm(1)}
          >
            Create Account
          </Button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className={`${styles.alertMessage} ${styles.alertSuccess}`}>
            <CheckCircle style={{ fontSize: "1.1rem" }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {globalError && (
          <div className={`${styles.alertMessage} ${styles.alertError}`}>
            <ErrorIcon style={{ fontSize: "1.1rem" }} />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formContainer} noValidate>
          <div className={styles.formFields}>
            {formState === 1 && (
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={styles.inputField}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
                autoComplete="name"
                size="small"
              />
            )}

            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className={styles.inputField}
              error={!!errors.username}
              helperText={errors.username}
              disabled={loading}
              autoComplete="username"
              size="small"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={styles.inputField}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              autoComplete={formState === 1 ? "new-password" : "current-password"}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {formState === 1 && (
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className={styles.inputField}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
                autoComplete="new-password"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                        disabled={loading}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        size="small"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CircularProgress size={16} color="inherit" />
                {formState === 0 ? "Signing in..." : "Creating account..."}
              </span>
            ) : formState === 0 ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className={styles.backToHome}>
          <Link to="/">← Back to Vionex home</Link>
        </div>
      </Paper>
    </div>
  );
}
