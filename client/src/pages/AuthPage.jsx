import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { loginUser, signupUser } from "../services/api";

const emptyAuthForm = {
  name: "",
  email: "",
  password: ""
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleAuthFormChange = (event) => {
    const { name, value } = event.target;
    setAuthError("");
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthModeChange = (nextMode) => {
    setAuthMode(nextMode);
    setAuthError("");
    setAuthForm((previousForm) => ({
      name: nextMode === "signup" ? previousForm.name : "",
      email: previousForm.email,
      password: ""
    }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthForm(authMode, authForm);

    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setLoadingAuth(true);
    setAuthError("");

    try {
      const authResponse =
        authMode === "login"
          ? await loginUser({
              email: authForm.email,
              password: authForm.password
            })
          : await signupUser({
              name: authForm.name,
              email: authForm.email,
              password: authForm.password
            });

      console.log("[auth] success", authResponse);
      login(authResponse);
      setAuthForm(emptyAuthForm);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[auth] failed", error);
      setAuthError(resolveAuthError(authMode, error));
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <AuthScreen
      authError={authError}
      authForm={authForm}
      authMode={authMode}
      loadingAuth={loadingAuth}
      onAuthFormChange={handleAuthFormChange}
      onAuthModeChange={handleAuthModeChange}
      onSubmit={handleAuthSubmit}
    />
  );
}

function validateAuthForm(mode, form) {
  const normalizedEmail = form.email.trim();
  const password = form.password.trim();

  if (mode === "signup" && !form.name.trim()) {
    return "Name is required.";
  }

  if (!normalizedEmail || !password) {
    return "Email and password are required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  return "";
}

function resolveAuthError(mode, error) {
  if (mode === "signup" && error.status === 409) {
    return "User already exists";
  }

  if (mode === "login" && error.status === 404) {
    return "User not found";
  }

  if (mode === "login" && error.status === 401) {
    return "Invalid credentials";
  }

  return error.message || "Authentication failed.";
}
