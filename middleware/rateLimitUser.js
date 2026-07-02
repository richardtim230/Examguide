// 
import rateLimit from "express-rate-limit";

/**
 * Simple per-IP global limiter (still recommended).
 * You can use RedisStore for distributed rate limiting in production.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // max requests per IP per window
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Per-user check & cost deduction (not a strict rate limiter).
 * Usage:
 *   router.post("/message", auth, checkCreditsMiddleware({ costFn }), handler)
 *
 * costFn: async (req) => { return { cost: <number>, reason: "call" } }
 *
 * This middleware will:
 *  - get req.user from auth middleware (must be present)
 *  - estimate cost via costFn
 *  - atomically deduct from user's creditPoints if enough balance
 *  - attach req.charge = { cost, before, after } for later recording
 */
import User from "../models/User.js";

export function checkCreditsMiddleware(opts = {}) {
  const costFn = opts.costFn || (async () => ({ cost: 1 }));

  return async function (req, res, next) {
    try {
      if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Authentication required" });

      const { cost } = await costFn(req);
      if (!Number.isFinite(cost) || cost <= 0) {
        req.charge = { cost: 0 };
        return next();
      }

      // atomic decrement if enough credits
      const userId = req.user._id;
      const beforeUser = await User.findById(userId).select("creditPoints").exec();
      const before = beforeUser?.creditPoints || 0;
      if (before < cost) {
        return res.status(402).json({ success: false, message: "Insufficient credits" });
      }

      const updated = await User.findOneAndUpdate(
        { _id: userId, creditPoints: { $gte: cost } },
        { $inc: { creditPoints: -cost } },
        { new: true, select: "creditPoints" }
      ).lean();

      if (!updated) return res.status(409).json({ success: false, message: "Failed to deduct credits; try again" });

      req.charge = { cost, before, after: updated.creditPoints };
      next();
    } catch (err) {
      console.error("checkCreditsMiddleware error:", err);
      return res.status(500).json({ success: false, message: "Credit check failed" });
    }
  };
}
