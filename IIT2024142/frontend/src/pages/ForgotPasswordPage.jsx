import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ShieldCheck, RefreshCw, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { api } from "../lib/api";

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [animating, setAnimating] = useState(false);

  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Resend cooldown timer
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setInterval(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [otpResendCooldown]);

  const goToStep = (nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setMessage(res.message);
      setOtpResendCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      goToStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 350);
    } catch (err) {
      setError(err.message || "Failed to generate OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpResendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setOtpResendCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otp = otpValues.join("");
    if (otp.length < 6) { setError("Please enter the 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp,
        purpose: "reset",
      });
      goToStep(3);
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword) { setError("Please enter a new password"); return; }
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be 8+ characters with uppercase, lowercase, number, and special character");
      return;
    }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otpValues.join(""),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const stepLabels = ["Email", "Verify OTP", "New Password"];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 flex items-center justify-center bg-white px-4">
      <div className="max-w-xl w-full p-6 sm:p-10 md:p-14 rounded-2xl bg-white border border-ink/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 text-gold mb-4">
            {step === 1 && <Mail size={32} />}
            {step === 2 && <ShieldCheck size={32} />}
            {step === 3 && <Lock size={32} />}
          </div>
          <h2 className="text-4xl font-serif mb-2">Reset Password</h2>
          <p className="text-xs uppercase tracking-widest text-ink/60">
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Create a secure new password"}
          </p>
        </div>

        {!success && (
          <div className="flex items-center justify-center mb-8 gap-2">
            {stepLabels.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                      step === i + 1
                        ? "bg-gold border-gold text-white shadow-[0_0_12px_rgba(197,160,89,0.5)]"
                        : step > i + 1
                        ? "bg-ink border-ink text-paper"
                        : "border-ink/20 text-ink/30"
                    }`}
                  >
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className={`text-[8px] uppercase tracking-widest font-bold ${step === i + 1 ? "text-gold" : "text-ink/30"}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-px flex-1 mb-4 transition-all ${step > i + 1 ? "bg-ink/40" : "bg-ink/10"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 border-l-2 border-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-serif mb-2">Password Updated</h3>
            <p className="text-xs text-ink/50 uppercase tracking-widest mb-8">
              Your password has been reset successfully.
            </p>
            <Link
              to="/login"
              className="inline-block px-10 py-3 bg-ink text-white text-xs uppercase tracking-[0.25em] rounded-full hover:bg-gold transition"
            >
              Back to Login
            </Link>
          </div>
        )}

        {!success && (
          <div className={`transition-all duration-200 ${animating ? "opacity-0 translate-x-4" : "opacity-100"}`}>
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-10">
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">
                    Email Address
                  </label>
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full border-b border-ink/10 py-5 text-xl outline-none focus:border-gold transition-colors text-ink bg-transparent"
                    placeholder="your@email.com"
                  />
                  <p className="text-[10px] text-ink/40 mt-3 uppercase tracking-widest">
                    Verification code will be sent to your email address
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <Link to="/login" className="text-xs uppercase tracking-widest text-ink/60 hover:text-ink">
                    Back to Login
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3 bg-ink text-white text-xs uppercase tracking-[0.25em] rounded-full hover:bg-gold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-ink/20"
                  >
                    {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-8">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-serif text-ink text-center">Check your email</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/50 text-center">
                    Enter the 6-digit code for<br />
                    <span className="text-ink font-bold">{email}</span>
                  </p>
                </div>

                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition-all bg-transparent ${
                        val ? "border-gold text-gold shadow-[0_0_12px_rgba(197,160,89,0.3)]" : "border-ink/20 text-ink focus:border-gold/60"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpResendCooldown > 0 || loading}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                      otpResendCooldown > 0 ? "text-ink/30 cursor-not-allowed" : "text-ink/60 hover:text-gold"
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : "Resend OTP"}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => { setError(""); goToStep(1); }}
                    className="text-xs uppercase tracking-widest text-ink/60 font-bold hover:text-gold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpValues.join("").length < 6}
                    className="px-10 py-3 bg-ink text-white text-xs uppercase tracking-[0.25em] rounded-full hover:bg-gold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-ink/20"
                  >
                    {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    Verify
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-8">
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      className="w-full border-b border-ink/10 py-5 pr-10 text-xl outline-none focus:border-gold transition-colors text-ink bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-gold"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className="w-full border-b border-ink/10 py-5 pr-10 text-xl outline-none focus:border-gold transition-colors text-ink bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-gold"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-ink/40 uppercase tracking-widest font-medium">
                  Min 8 chars · uppercase · lowercase · number · special character
                </p>

                <div className="flex justify-between items-center mt-10">
                  <button
                    type="button"
                    onClick={() => { setError(""); goToStep(2); }}
                    className="text-xs uppercase tracking-widest text-ink/60 font-bold hover:text-gold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3 bg-ink text-white text-xs uppercase tracking-[0.25em] rounded-full hover:bg-gold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-ink/20"
                  >
                    {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
