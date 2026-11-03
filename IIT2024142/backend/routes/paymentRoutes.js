const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Supported currencies and their exchange rates from USD
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.54,
  CAD: 1.36,
  CHF: 0.90,
  CNY: 7.24,
  INR: 83.12,
  SGD: 1.34,
  AED: 3.67,
  HKD: 7.82,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1325.0,
};

// Lazy-initialize Razorpay so it doesn't crash at startup if env vars aren't loaded
let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured in environment variables");
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

// POST /api/payments/create-order
// Creates a Razorpay Order for a won auction
router.post("/create-order", authMiddleware, async (req, res) => {
  const { auctionId, currency = "USD" } = req.body;
  const userId = req.user.id;

  if (!auctionId) {
    return res.status(400).json({ message: "Auction ID is required" });
  }

  const currencyUpper = currency.toUpperCase();
  if (!EXCHANGE_RATES[currencyUpper]) {
    return res.status(400).json({ message: "Unsupported currency" });
  }

  // Verify this user actually won this auction
  const sql = `
    SELECT a.current_price, a.title, a.id
    FROM auctions a
    JOIN bids b ON b.auction_id = a.id
    WHERE a.id = ? 
      AND b.user_id = ?
      AND b.amount = a.current_price
      AND a.end_time <= CURRENT_TIMESTAMP
    LIMIT 1
  `;

  try {
    const [results] = await db.query(sql, [auctionId, userId]);

    if (!results || results.length === 0) {
      return res.status(403).json({ message: "You did not win this auction or auction is still active" });
    }

    const auction = results[0];
    const amountUSD = parseFloat(auction.current_price);
    const rate = EXCHANGE_RATES[currencyUpper];
    const convertedAmount = amountUSD * rate;

    // Razorpay amount is in smallest currency unit (paise for INR, cents for USD)
    const razorpayAmount = Math.round(convertedAmount * 100);

    const options = {
      amount: razorpayAmount,
      currency: currencyUpper,
      receipt: `receipt_${auctionId}_${Date.now()}`,
      notes: {
        auction_id: String(auctionId),
        buyer_id: String(userId),
        auction_title: auction.title,
      },
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      auctionTitle: auction.title,
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST /api/payments/verify-payment
// Verifies Razorpay payment signature
router.post("/verify-payment", authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, auctionId } = req.body;
  const userId = req.user.id;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      // Get the final price from the auction
      const [results] = await db.query("SELECT current_price FROM auctions WHERE id = ?", [auctionId]);
      if (results.length === 0) return res.status(500).json({ message: "Auction not found" });

      const finalPrice = results[0].current_price;

      // Check if transaction already exists
      const [trans] = await db.query("SELECT id FROM transactions WHERE auction_id = ?", [auctionId]);
      if (trans.length > 0) return res.json({ success: true, message: "Transaction already recorded" });

      const sql = "INSERT INTO transactions (auction_id, winner_id, final_price, payment_id) VALUES (?, ?, ?, ?)";
      await db.query(sql, [auctionId, userId, finalPrice, razorpay_payment_id]);

      return res.json({ success: true, message: "Payment verified and recorded" });
    } catch (err) {
      console.error("Payment verification record error:", err);
      return res.status(500).json({ success: false, message: "Failed to record transaction" });
    }
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});


// POST /api/payments/confirm-payment
// Records a successful transaction in the database
router.post("/confirm-payment", authMiddleware, async (req, res) => {
  try {
    const { auctionId } = req.body;
    const userId = req.user.id;

    if (!auctionId) return res.status(400).json({ message: "Auction ID is required" });

    // Get the final price from the auction
    const [results] = await db.query("SELECT current_price FROM auctions WHERE id = ?", [auctionId]);
    if (results.length === 0) return res.status(500).json({ message: "Auction not found" });

    const finalPrice = results[0].current_price;

    // Check if transaction already exists
    const [trans] = await db.query("SELECT id FROM transactions WHERE auction_id = ?", [auctionId]);
    if (trans.length > 0) return res.json({ message: "Transaction already recorded" });

    const sql = "INSERT INTO transactions (auction_id, winner_id, final_price) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [auctionId, userId, finalPrice]);
    
    res.json({ message: "Transaction recorded successfully", transactionId: result.insertId });
  } catch (err) {
    console.error("Transaction recording error:", err);
    res.status(500).json({ message: "Failed to record transaction" });
  }
});

// GET /api/payments/currencies — returns available currencies with rates
router.get("/currencies", (req, res) => {
  const currencies = Object.entries(EXCHANGE_RATES).map(([code, rate]) => ({
    code,
    rate,
    symbol: getCurrencySymbol(code),
    name: getCurrencyName(code),
  }));
  res.json(currencies);
});

// GET /api/payments/convert — convert a USD amount to another currency
router.get("/convert", (req, res) => {
  const { amount, currency } = req.query;
  const usdAmount = parseFloat(amount);
  const targetCurrency = (currency || "USD").toUpperCase();

  if (isNaN(usdAmount) || !EXCHANGE_RATES[targetCurrency]) {
    return res.status(400).json({ message: "Invalid amount or currency" });
  }

  const converted = usdAmount * EXCHANGE_RATES[targetCurrency];
  res.json({
    original: usdAmount,
    converted: Math.round(converted * 100) / 100,
    currency: targetCurrency,
    symbol: getCurrencySymbol(targetCurrency),
    rate: EXCHANGE_RATES[targetCurrency],
  });
});

function getCurrencySymbol(code) {
  const symbols = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$",
    CAD: "C$", CHF: "Fr", CNY: "¥", INR: "₹", SGD: "S$",
    AED: "د.إ", HKD: "HK$", MXN: "MX$", BRL: "R$", KRW: "₩",
  };
  return symbols[code] || code;
}

function getCurrencyName(code) {
  const names = {
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound",
    JPY: "Japanese Yen", AUD: "Australian Dollar", CAD: "Canadian Dollar",
    CHF: "Swiss Franc", CNY: "Chinese Yuan", INR: "Indian Rupee",
    SGD: "Singapore Dollar", AED: "UAE Dirham", HKD: "Hong Kong Dollar",
    MXN: "Mexican Peso", BRL: "Brazilian Real", KRW: "South Korean Won",
  };
  return names[code] || code;
}

module.exports = router;
