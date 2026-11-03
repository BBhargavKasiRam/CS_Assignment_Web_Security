const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Configure nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "bidvora/profiles" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

// ─── Helper: Generate 6-digit OTP ────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🔐 REGISTER
exports.register = async (req, res) => {
  try {
    let { name, email, password, role, otp } = req.body;
    email = email.trim().toLowerCase().replace(/\s+/g, "");

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const validRoles = ['buyer', 'consignor', 'auctioneer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already registered" });

    // Verify OTP from globalStore (for registration)
    if (!global.otpStore || !global.otpStore.has(`register:${email}`)) {
      return res.status(400).json({ message: "No OTP requested for this email" });
    }

    const registrationOtpData = global.otpStore.get(`register:${email}`);
    if (new Date() > new Date(registrationOtpData.expires)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const isValid = await bcrypt.compare(otp.toString(), registrationOtpData.hashedOtp);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role || "buyer"]
    );

    // Clean up OTP
    global.otpStore.delete(`register:${email}`);

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase().replace(/\s+/g, "");

    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = results[0];

    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    if (user.is_google_user && !user.password) {
        return res.status(400).json({ message: "This account uses Google Login. Please sign in with Google." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const SECRET = process.env.JWT_SECRET || "secret";

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔐 SOCIAL LOGIN (Google, Microsoft, Facebook)
exports.socialLogin = async (req, res) => {
  try {
    let { email, name, profile_image, uid, role } = req.body;
    email = email.trim().toLowerCase().replace(/\s+/g, "");

    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    let user = results[0];
    const SECRET = process.env.JWT_SECRET || "secret";
    const validRoles = ['buyer', 'consignor', 'auctioneer'];

    if (user) {
      // Existing user: Update profile image if they don't have one
      if (!user.profile_image && profile_image) {
        await db.query("UPDATE users SET profile_image = ?, is_google_user = 1 WHERE id = ?", [profile_image, user.id]);
        user.profile_image = profile_image;
      } else {
        await db.query("UPDATE users SET is_google_user = 1 WHERE id = ?", [user.id]);
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;
      return res.json({ token, user: userWithoutPassword });
    } else {
      // New user: role is required — frontend must show role picker first
      if (!role || !validRoles.includes(role)) {
        return res.status(200).json({
          needRoleSelection: true,
          message: "Please select your role to complete registration.",
          googleData: { email, name, profile_image, uid }
        });
      }

      // Create account with selected role
      const [result] = await db.query(
        "INSERT INTO users (name, email, profile_image, role, is_google_user) VALUES (?, ?, ?, ?, ?)",
        [name, email, profile_image, role, 1]
      );

      const newId = result.insertId;
      const token = jwt.sign(
        { id: newId, role },
        SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: newId, name, email, role, profile_image }
      });
    }
  } catch (err) {
    console.error("Social Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 CHECK REGISTER EMAIL
exports.checkRegisterEmail = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    email = email.trim().toLowerCase();

    const [result] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (result.length > 0) return res.status(400).json({ message: "Email already registered" });
    return res.json({ message: "OK" });
  } catch (error) {
    console.error("Check Register Email error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔥 CHECK LOGIN EMAIL
exports.checkLoginEmail = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    email = email.trim().toLowerCase().replace(/\s+/g, "");

    const [result] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (result.length === 0) return res.status(400).json({ message: "Email not registered" });
    res.json({ message: "OK" });
  } catch (err) {
    console.error("Check Login Email error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔐 UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.user.id;
    
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" });
    
    let imageUrl = null;
    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) return res.status(400).json({ message: "Only image files are allowed" });
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Email already in use" });

    let sql = "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?";
    let params = [name, email, role || "buyer", userId];

    if (imageUrl) {
      sql = "UPDATE users SET name = ?, email = ?, role = ?, profile_image = ? WHERE id = ?";
      params = [name, email, role || "buyer", imageUrl, userId];
    }

    await db.query(sql, params);
    
    const [results] = await db.query("SELECT id, name, email, role, profile_image FROM users WHERE id = ?", [userId]);
    res.json({ message: "Profile updated successfully", user: results[0] });
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

// ─── Helper: Send OTP Email ───────────────────────────────────────────
const sendOtpEmail = async (email, otp, purpose, expires) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your OTP for ${purpose} on BidVora`,
    text: `Hello,\n\nYour OTP is: ${otp}\nIt will expire at ${expires.toISOString()} (10 minutes).\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nBidVora Team`,
  };
  await transporter.sendMail(mailOptions);
};

// 🔥 SEND OTP (for registration or password reset)
// OTP is logged to the backend console (visible in server terminal / Render logs)
exports.sendOtp = async (req, res) => {
  try {
    let { email, purpose } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!purpose || !['register', 'reset'].includes(purpose)) {
      return res.status(400).json({ message: "Invalid OTP purpose" });
    }

    email = email.trim().toLowerCase();

    if (purpose === 'register') {
      const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }
    } else if (purpose === 'reset') {
      const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length === 0) {
        return res.status(404).json({ message: "Email not found" });
      }
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (purpose === 'register') {
      if (!global.otpStore) global.otpStore = new Map();
      global.otpStore.set(`${purpose}:${email}`, {
        hashedOtp,
        expires,
        purpose
      });
    } else {
      await db.query(
        "UPDATE users SET otp_code = ?, otp_expires = ?, otp_purpose = ? WHERE email = ?",
        [hashedOtp, expires, purpose, email]
      );
    }

    // ✅ OTP logged to backend console / Render logs
    console.log(`\n🔐 ========================`);
    console.log(`   OTP for ${email} [${purpose}]`);
    console.log(`   Code: ${otp}`);
    console.log(`   Expires: ${expires.toISOString()}`);
    console.log(`========================\n`);

    // Send OTP via email
    await sendOtpEmail(email, otp, purpose, expires);

    res.json({ message: "OTP generated and sent via email. Check your inbox." });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to generate OTP" });
  }
};

// 🔥 VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp, purpose } = req.body;
    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: "Email, OTP and purpose are required" });
    }

    email = email.trim().toLowerCase();
    let storedData = null;

    if (purpose === 'register') {
      if (global.otpStore && global.otpStore.has(`${purpose}:${email}`)) {
        storedData = global.otpStore.get(`${purpose}:${email}`);
      } else {
        return res.status(400).json({ message: "OTP not found. Please request a new one." });
      }
    } else {
      const [results] = await db.query(
        "SELECT otp_code, otp_expires, otp_purpose FROM users WHERE email = ?",
        [email]
      );
      if (results.length === 0) return res.status(400).json({ message: "Invalid request" });
      const user = results[0];
      if (!user.otp_code || user.otp_purpose !== purpose) {
        return res.status(400).json({ message: "OTP not found. Please request a new one." });
      }
      storedData = { hashedOtp: user.otp_code, expires: user.otp_expires, purpose: user.otp_purpose };
    }

    if (new Date() > new Date(storedData.expires)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const isValid = await bcrypt.compare(otp.toString(), storedData.hashedOtp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }

    // OTP verified — we don't clear it yet for 'reset' because resetPassword needs it.
    // Wait, in resetPassword we check it again. So we can keep it or clear it.
    // Let's keep it for 'reset' and clear for 'register' if needed, but actually verifyOtp usually just returns success.

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// 🔥 FORGOT PASSWORD (legacy compatibility, now uses sendOtp flow)
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    email = email.trim().toLowerCase();

    const [results] = await db.query("SELECT id, name FROM users WHERE email = ?", [email]);
    if (results.length === 0) return res.status(404).json({ message: "Email not found" });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_purpose = 'reset' WHERE email = ?",
      [hashedOtp, expires, email]
    );

    // ✅ OTP logged to backend console / Render logs
    console.log(`\n🔑 ========================`);
    console.log(`   PASSWORD RESET OTP for ${email}`);
    console.log(`   Code: ${otp}`);
    console.log(`   Expires: ${expires.toISOString()}`);
    console.log(`========================\n`);

    // Send OTP via email
    await sendOtpEmail(email, otp, "reset", expires);

    res.json({ message: "OTP generated and sent to your email. Check your inbox." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [results] = await db.query(
      "SELECT id, otp_code, otp_expires, otp_purpose FROM users WHERE email = ?",
      [cleanEmail]
    );
    
    if (results.length === 0) return res.status(400).json({ message: "Invalid request" });

    const user = results[0];
    if (!user.otp_code || user.otp_purpose !== 'reset') {
      return res.status(400).json({ message: "Invalid or expired OTP. Please start over." });
    }
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const isValid = await bcrypt.compare(otp.toString(), user.otp_code);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ?, otp_code = NULL, otp_expires = NULL, otp_purpose = NULL, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );
    
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
