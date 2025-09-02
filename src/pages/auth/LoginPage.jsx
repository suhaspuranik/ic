import { useEffect, useState } from "react";
import { isValidEmail, isRequired } from "../../utils/validation";
import LoginInfoPanel from "../../components/LoginInfoPanel";
import LoginUI from "./LoginUI";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../apis/AuthApis";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Assembly Head");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // When unauthenticated on the login page, keep user on login with back/forward
  useEffect(() => {
    const isAuthed = Boolean(sessionStorage.getItem("party_worker_id"));
    if (isAuthed) return; // App-level guard handles redirect away from login

    const lockToLogin = () => {
      // Force the URL to stay at /login
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      } else {
        // Re-push state to block navigating away
        window.history.pushState(null, "", "/login");
      }
    };

    // Prime history and listen for back/forward
    window.history.pushState(null, "", "/login");
    window.addEventListener("popstate", lockToLogin);
    return () => window.removeEventListener("popstate", lockToLogin);
  }, []);

  // Use the navigate function from react-router-dom
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setShowError(false);
    setErrorMsg("");

    // Validation using utility functions
    let isValid = true;

    if (!isRequired(email)) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!isRequired(password)) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    setShowError(false);

    try {
      const res = await loginUser(email, password, role);
      const result = res?.RESULT?.[0];
      const isSuccess = result?.p_out_mssg_flg === "S";

      if (!isSuccess) {
        setErrorMsg(result?.p_out_mssg || "Login failed");
        throw new Error(result?.p_out_mssg || "Login failed");
      }

      // Persist required fields in sessionStorage
      sessionStorage.setItem(
        "party_worker_id",
        String(result.party_worker_id ?? "")
      );
      sessionStorage.setItem(
        "party_worker_number",
        String(result.party_worker_number ?? "")
      );
      sessionStorage.setItem("role_id", String(result.role_id ?? ""));
      sessionStorage.setItem("email_id", String(result.email_id ?? email));
      sessionStorage.setItem("role_name", String(result.role_name ?? role));
      sessionStorage.setItem("assembly_id", String(result.assembly_id ?? ""));
      sessionStorage.setItem("ward_id", String(result.ward_id ?? ""));

      navigate("/dashboard");
    } catch (err) {
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Info Panel */}
      <LoginInfoPanel />

      {/* Right Panel - Login Form */}
      <LoginUI
        role={role}
        setRole={setRole}
        email={email}
        setEmail={setEmail}
        emailError={emailError}
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        showPassword={showPassword}
        togglePasswordVisibility={togglePasswordVisibility}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        showError={showError}
        errorMsg={errorMsg}
      />
    </div>
  );
};

export default LoginPage;
