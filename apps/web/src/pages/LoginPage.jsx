import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

// Water drop SVG icon
function DropIcon({ size = 40, color = "#1d4ed8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Force login page to always be LTR English regardless of saved language preference
  useEffect(() => {
    const savedDir = document.documentElement.getAttribute('dir');
    const savedLang = document.documentElement.getAttribute('lang');
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    return () => {
      // Restore direction when navigating away (dashboard will set its own)
      if (savedDir) document.documentElement.setAttribute('dir', savedDir);
      if (savedLang) document.documentElement.setAttribute('lang', savedLang);
    };
  }, []);
  // States: "login" | "forgot" | "reset"
  const [viewState, setViewState] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");

  // Verify & Reset state
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Clear states when transitioning
  const changeViewState = (state) => {
    setViewState(state);
    setError("");
    setSuccessMsg("");
  };

  // ─── LOGIN SUBMIT ─────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter both username/email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { identifier, password });
      const data = res.data.data;
      
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user._id,
          fullName: data.user.fullName,
          phone: data.user.phone || "",
          email: data.user.email || "",
          role: data.user.role,
          tenantName: data.user.tenantName || "AquaFlow"
        }
      });

      navigate("/dashboard");
    } catch (err) {
      // Detailed error for debugging mobile connectivity
      let errorMsg = "";
      if (err.response) {
        // Server responded with an error status
        errorMsg = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        // Request was made but no response received (network issue)
        errorMsg = `Network error: Cannot reach server. Check if backend is running and accessible from this device. (${err.message})`;
      } else {
        // Something else went wrong
        errorMsg = `Request setup error: ${err.message}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  // ─── FORGOT PASSWORD (REQUEST CODE) ──────────────────────────────────────
  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/forgot-password", { email: resetEmail });
      
      // Store the generated debug code so the developer can see it or auto-fill it for demo
      const debugCode = res.data.data?.debugCode;
      
      setSuccessMsg(`Verification code sent to email. ${debugCode ? `(Testing code: ${debugCode})` : ""}`);
      
      // Wait a bit to transition
      setTimeout(() => {
        changeViewState("reset");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Email address not found.");
    } finally {
      setLoading(false);
    }
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!verificationCode || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        code: verificationCode,
        newPassword
      });

      setSuccessMsg("Password updated successfully! Transitioning to login...");
      
      setTimeout(() => {
        changeViewState("login");
        // Reset forms
        setPassword("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password. Check your code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      {/* Animated wave background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full" style={{ animation: "wave 8s linear infinite" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(59,130,246,0.08)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,170.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-full" style={{ animation: "wave 12s linear infinite reverse" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(99,102,241,0.06)" d="M0,160L60,170.7C120,181,240,203,360,202.7C480,203,600,181,720,176C840,171,960,181,1080,186.7C1200,192,1320,192,1380,192L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
        </svg>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-40" style={{ animation: "float 6s ease-in-out infinite" }} />
        <div className="absolute top-40 right-20 w-48 h-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30" style={{ animation: "float 8s ease-in-out infinite reverse" }} />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-35" style={{ animation: "float 10s ease-in-out infinite" }} />
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>

      {/* Main Credentials Card */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100/50 overflow-hidden border border-white/50 backdrop-blur-sm">
          
          {/* Circular Logo & Header */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-200">
              <DropIcon size={32} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-700 tracking-tight">AquaFlow</h1>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1.5">
              {viewState === "login" && "Secure Access Portal"}
              {viewState === "forgot" && "Reset Password"}
              {viewState === "reset" && "Verify & Reset"}
            </p>
          </div>

          {/* Form Content body */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5">
                <span>⚠</span> {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5">
                <span>✓</span> {successMsg}
              </div>
            )}

            {/* ─── STATE 1: LOGIN ─── */}
            {viewState === "login" && (
              <>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Welcome Back</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter your credentials to securely access your account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username or Email</label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-600">Password</label>
                      <button
                        type="button"
                        onClick={() => changeViewState("forgot")}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 hover:scale-[1.01]"
                  >
                    {loading ? "Authenticating..." : "Login"}
                  </button>
                </form>

                {/* verified badge at bottom of form */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 py-2.5 rounded-xl mt-5 border border-blue-100/30">
                  <span className="text-sm">✓</span> Your email is verified
                </div>
              </>
            )}

            {/* ─── STATE 2: FORGOT PASSWORD ─── */}
            {viewState === "forgot" && (
              <>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Reset Password</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter your email address to receive a verification code.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 hover:scale-[1.01]"
                  >
                    {loading ? "Sending Code..." : "Send Code"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => changeViewState("login")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ─── STATE 3: VERIFY & RESET ─── */}
            {viewState === "reset" && (
              <>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Verify & Reset</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter the verification code sent to your email and create a new password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 tracking-wider text-center text-lg font-bold bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword1 ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create new password"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword1(!showPassword1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword1 ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword2 ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword2 ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 hover:scale-[1.01]"
                  >
                    {loading ? "Updating Password..." : "Update Password"}
                  </button>

                  <div className="flex flex-col gap-2.5 items-center pt-2 select-none">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Didn't receive a code? Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => changeViewState("login")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer branding */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center select-none text-xs text-gray-400">
            {viewState === "forgot" ? (
              <p>Need help? <a href="#" className="text-blue-600 hover:underline font-semibold">Contact Support</a></p>
            ) : (
              <p>Secure Internal Portal © 2026 AquaFlow Inc.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
