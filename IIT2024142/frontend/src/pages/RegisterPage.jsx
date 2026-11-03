import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle, signInWithMicrosoft, signInWithFacebook } from "../lib/firebase";

export const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const otpRefs = useRef([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    otp: "",
  });

  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Countdown for OTP resend button
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setInterval(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [otpResendCooldown]);

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim()) return "Name is required";
      if (form.name.trim().length < 3) return "Minimum 3 characters required";
    }
    if (step === 2) {
      const email = form.email.trim();
      if (!email) return "Email is required";
      if (!emailRegex.test(email)) return "Enter valid email";
    }
    if (step === 3) {
      const otp = otpValues.join("");
      if (otp.length < 6) return "Please enter the 6-digit OTP";
    }
    if (step === 4) {
      if (!form.password) return "Password is required";
      if (!passwordRegex.test(form.password))
        return "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character";
      if (!form.confirmPassword) return "Confirm your password";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
      if (!form.role) return "Please select an account type";
    }
    return null;
  };

  const goToStep = (nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  };

  // Send OTP to backend (logged in console)
  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/send-otp", {
        email: form.email.trim().toLowerCase(),
        purpose: "register",
      });
      setOtpSent(true);
      setOtpResendCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (loading) return;
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");

    if (step === 2) {
      // Check email availability then send OTP
      try {
        setLoading(true);
        await api.post("/auth/check-register-email", {
          email: form.email.trim().toLowerCase(),
        });
        // Email is free — send OTP and move to step 3
        await sendOtp();
        goToStep(3);
      } catch (err) {
        const msg = err.message || "Email already registered";
        setError(msg);
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      // Verify OTP
      try {
        setLoading(true);
        await api.post("/auth/verify-otp", {
          email: form.email.trim().toLowerCase(),
          otp: otpValues.join(""),
          purpose: "register",
        });
        goToStep(4);
      } catch (err) {
        setError(err.message || "Invalid OTP");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step < 4) {
      goToStep(step + 1);
      return;
    }

    // Step 4 — Final Registration
    try {
      setLoading(true);
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        otp: otpValues.join(""),
      });
      navigate("/login");
    } catch (err) {
      const msg = err.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pending Google signup data (when role selection is needed)
  const [pendingGoogleData, setPendingGoogleData] = useState(null);

  const handleSocialSignup = async (providerName) => {
    if (socialLoading) return;
    try {
      setSocialLoading(providerName);
      setError("");
      
      let socialUser;
      if (providerName === 'google') socialUser = await signInWithGoogle();
      else if (providerName === 'microsoft') socialUser = await signInWithMicrosoft();
      else if (providerName === 'facebook') socialUser = await signInWithFacebook();
      
      const res = await api.post("/auth/social-login", {
        email: socialUser.email,
        name: socialUser.displayName,
        profile_image: socialUser.photoURL,
        uid: socialUser.uid,
        role: form.role
      });

      // If backend says this is a new user who needs to pick a role
      if (res.needRoleSelection) {
        setPendingGoogleData(res.googleData);
        return;
      }

      login(res.token, res.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} account connection failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  // Complete Google signup after role is selected
  const completeSocialSignup = async (selectedRole) => {
    if (!pendingGoogleData) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/social-login", {
        ...pendingGoogleData,
        role: selectedRole
      });
      login(res.token, res.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return;
    setError("");
    if (step === 3) {
      // Going back from OTP step — reset OTP
      setOtpValues(["", "", "", "", "", ""]);
      setOtpSent(false);
    }
    goToStep(step - 1);
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    setError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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

  const stepLabels = ["Name", "Email", "Verify", "Setup"];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 flex items-center justify-center relative px-4 overflow-x-hidden">
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="max-w-xl w-full p-6 sm:p-10 md:p-14 glass-card relative overflow-hidden z-10 shadow-[0_20px_60px_rgba(42,35,24,0.15)] bg-white rounded-2xl border border-ink/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40"></div>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-serif text-ink letterpress">Join Bidvora</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/50 font-bold mt-2">Create your professional profile</p>
        </div>

        {/* Step Indicators */}
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

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 border-l-4 border-red-600 rounded-r">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 1 && (
            <>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSocialSignup('google')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-ink/10 text-ink shadow-[0_2px_8px_rgba(42,35,24,0.08)] hover:shadow-[0_4px_16px_rgba(42,35,24,0.12)] hover:border-ink/20 transition-all hover-lift group rounded-lg"
                >
                  {socialLoading === 'google' ? (
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  )}
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/70 group-hover:text-ink transition-colors">
                    Register with Google
                  </span>
                </button>
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-ink/10"></div>
                <span className="flex-shrink mx-4 text-[9px] uppercase tracking-widest font-bold text-ink/40">or sign up manually</span>
                <div className="flex-grow border-t border-ink/10"></div>
              </div>
            </>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-10">
            <div className={`transition-all duration-200 ${animating ? "opacity-0 translate-x-4" : "opacity-100"}`}>
              
              {/* Step 1: Name */}
              {step === 1 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">Full Name</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value.trimStart() }); setError(""); }}
                    className="w-full border-b border-ink/20 py-5 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                  />
                </div>
              )}

              {/* Step 2: Email */}
              {step === 2 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">Email Address</label>
                  <input
                    autoFocus
                    type="email"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value.trimStart() }); setError(""); }}
                    className="w-full border-b border-ink/20 py-5 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                  />
                  <p className="text-[10px] text-ink/40 mt-3 uppercase tracking-widest">
                    An OTP will be sent to your email address to verify your account.
                  </p>
                </div>
              )}

              {/* Step 3: OTP Verification */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mb-2">
                      <ShieldCheck className="w-7 h-7 text-gold" />
                    </div>
                    <p className="text-sm font-serif text-ink text-center">Check your email</p>
                    <p className="text-[10px] uppercase tracking-widest text-ink/50 text-center">
                      Enter the 6-digit OTP sent to your inbox
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
                      onClick={sendOtp}
                      disabled={otpResendCooldown > 0 || loading}
                      className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                        otpResendCooldown > 0 ? "text-ink/30 cursor-not-allowed" : "text-ink/60 hover:text-gold"
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Password + Role */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
                          className="w-full border-b border-ink/20 py-4 pr-10 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-gold transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-ink/40 block mb-2 font-bold">Confirm</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setError(""); }}
                          className="w-full border-b border-ink/20 py-4 pr-10 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-gold transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-ink/50 block mb-4 font-bold">Select Account Purpose</label>
                    <div className="flex gap-4">
                      {['buyer', 'consignor', 'auctioneer'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm({ ...form, role: r })}
                          className={`flex-1 py-3 text-[9px] uppercase tracking-widest font-bold border rounded transition-all ${
                            form.role === r ? "bg-gold text-white border-gold shadow-[0_4px_12px_rgba(197,160,89,0.3)]" : "text-ink/50 border-ink/15 hover:border-gold/40 hover:text-ink bg-white"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              {step > 1 && (
                <button type="button" onClick={handleBack} className="text-xs uppercase tracking-widest text-ink/60 font-bold hover:text-gold transition-colors">
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-10 py-4 bg-ink text-paper text-[10px] uppercase tracking-[0.4em] hover:bg-gold transition-all font-bold shadow-[0_4px_16px_rgba(42,35,24,0.2)] hover:shadow-[0_6px_20px_rgba(197,160,89,0.4)] flex items-center justify-center gap-2 rounded"
              >
                {loading && <div className="w-3 h-3 border border-paper border-t-transparent rounded-full animate-spin" />}
                {step < 4 ? "Next" : "Complete"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-ink/50 font-bold">
          Already have an account?{" "}
          <Link to="/login" className="text-gold font-bold hover:underline transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};