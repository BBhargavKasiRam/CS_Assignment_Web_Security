import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle, signInWithMicrosoft, signInWithFacebook } from "../lib/firebase";

export const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google', 'microsoft', 'facebook'
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRegex =
    /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateStep = () => {
    if (step === 1) {
      const email = form.email.trim();

      if (!email) return "Email is required";
      if (!emailRegex.test(email)) return "Enter valid email";
    }

    if (step === 2) {
      if (!form.password) return "Password is required";
    }

    return null;
  };

  const handleNext = async () => {
    if (loading) return;

    const err = validateStep();
    if (err) {
      setError(err + " ");
      return;
    }

    setError("");

    // 🔥 STEP 1 → CHECK EMAIL FIRST
    if (step === 1) {
      try {
        setLoading(true);

        await api.post("/auth/check-login-email", {
          email: form.email.trim().toLowerCase(),
        });

        // ✅ ONLY IF EMAIL EXISTS → GO TO PASSWORD
        setAnimating(true);
        setTimeout(() => {
          setStep(2);
          setAnimating(false);
        }, 200);

      } catch (err) {
        let msg = "Email not registered";

        if (err && err.message && !err.message.includes("JSON")) {
          msg = err.message;
        }

        setError(msg + " "); // ❌ stay on email
      } finally {
        setLoading(false);
      }

      return;
    }

    // 🔥 STEP 2 → LOGIN
    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      login(res.token, res.user);
      navigate("/");

    } catch (err) {
      let msg = "Login failed";

      if (err && err.message && !err.message.includes("JSON")) {
        msg = err.message;
      }

      setError(msg + " ");

      if (msg.toLowerCase().includes("email")) {
        setStep(1);
      } else if (msg.toLowerCase().includes("password")) {
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (socialLoading) return;
    try {
      setSocialLoading('google');
      setError("");
      const googleUser = await signInWithGoogle();
      const res = await api.post("/auth/social-login", {
        email: googleUser.email,
        name: googleUser.displayName,
        profile_image: googleUser.photoURL,
        uid: googleUser.uid,
      });
      login(res.token, res.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSocialLogin = async (providerName) => {
    if (socialLoading) return;
    try {
      setSocialLoading(providerName);
      setError("");
      
      let socialUser;
      if (providerName === 'microsoft') socialUser = await signInWithMicrosoft();
      else if (providerName === 'facebook') socialUser = await signInWithFacebook();
      
      const res = await api.post("/auth/social-login", {
        email: socialUser.email,
        name: socialUser.displayName,
        profile_image: socialUser.photoURL,
        uid: socialUser.uid
      });

      login(res.token, res.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} sign-in failed. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleBack = () => {
    if (loading) return;
    setError("");
    setAnimating(true);
    setTimeout(() => {
      setStep(1);
      setAnimating(false);
    }, 200);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 flex items-center justify-center relative px-4 overflow-x-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-xl w-full p-6 sm:p-10 md:p-14 glass-card relative z-10 shadow-[0_20px_60px_rgba(42,35,24,0.15)] bg-white rounded-2xl border border-ink/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40"></div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-serif mb-2 text-ink letterpress">Welcome Back</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/50 font-bold">Access your BidVora account</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 border-l-4 border-red-600 rounded-r">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-ink/10 text-ink shadow-[0_2px_8px_rgba(42,35,24,0.08)] hover:shadow-[0_4px_16px_rgba(42,35,24,0.12)] hover:border-ink/20 transition-all hover-lift group rounded-lg"
            >
              {socialLoading === 'google' ? (
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink/70 group-hover:text-ink transition-colors">
                Continue with Google
              </span>
            </button>

            <button
              onClick={() => handleSocialLogin('microsoft')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#2F2F2F] border border-[#2F2F2F] text-white shadow-[0_2px_8px_rgba(47,47,47,0.2)] hover:shadow-[0_4px_16px_rgba(47,47,47,0.4)] transition-all hover-lift group rounded-lg"
            >
              {socialLoading === 'microsoft' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5 h-5" alt="Microsoft" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-bold text-white transition-colors">
                Continue with Microsoft
              </span>
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] border border-[#1877F2] text-white shadow-[0_2px_8px_rgba(24,119,242,0.2)] hover:shadow-[0_4px_16px_rgba(24,119,242,0.4)] transition-all hover-lift group rounded-lg"
            >
              {socialLoading === 'facebook' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" className="w-5 h-5 filter invert" alt="Facebook" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-bold text-white transition-colors">
                Continue with Facebook
              </span>
            </button>
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-ink/10"></div>
            <span className="flex-shrink mx-4 text-[9px] uppercase tracking-widest font-bold text-ink/40">or use email</span>
            <div className="flex-grow border-t border-ink/10"></div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-10">
            <div className={`transition-all duration-200 ${
              animating ? "opacity-0 translate-x-4" : "opacity-100"
            }`}>

              {/* EMAIL */}
              {step === 1 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/50 block mb-2 font-bold">
                    Email Address
                  </label>
                  <input
                    autoFocus
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        email: e.target.value.trimStart(),
                      });
                      setError("");
                    }}
                    className="w-full border-b-2 border-ink/20 py-5 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                  />
                </div>
              )}

              {/* PASSWORD */}
              {step === 2 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/50 block mb-2 font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        setError("");
                      }}
                      className="w-full border-b-2 border-ink/20 py-5 pr-12 text-xl bg-transparent outline-none focus:border-gold transition-colors text-ink"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-gold transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="mt-4 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-[10px] uppercase tracking-widest text-ink/60 hover:text-gold transition-colors font-bold"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-xs uppercase tracking-widest text-ink/60 hover:text-gold transition-colors font-bold"
                >
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-10 py-4 bg-ink text-paper text-[10px] uppercase tracking-[0.4em] hover:bg-gold transition-all font-bold shadow-[0_4px_16px_rgba(42,35,24,0.2)] hover:shadow-[0_6px_20px_rgba(197,160,89,0.4)] flex items-center justify-center gap-2 rounded"
              >
                {loading && <div className="w-3 h-3 border border-paper border-t-transparent rounded-full animate-spin" />}
                {step === 1 ? "Next" : "Login"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-ink/50 font-bold">
          New to Bidvora?{" "}
          <Link
            to="/register"
            className="text-gold font-bold hover:underline transition-all"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};