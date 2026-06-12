// middleware/authenticate.js

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Main Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token provided" });
  
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Role-based Authorization Middleware
 * @param {...string} roles - Allowed roles
 */
export function authorizeRole(...roles) {
  return (req, res, next) => {
    // Check if user exists and has role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "User not authenticated" });
    }
    
    // Case-insensitive role comparison
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
}

/**
 * Authenticate Token (Alias for authenticate)
 * Used in routes where naming is different
 */
export function authenticateToken(req, res, next) {
  authenticate(req, res, next);
}

/**
 * Optional Authentication
 * Attaches user if token exists, but doesn't fail if missing
 */
export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth) {
    req.user = null;
    return next();
  }
  
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.warn("Optional token verification failed:", err.message);
    req.user = null;
  }
  
  next();
}

/**
 * Admin Only Middleware
 * Restricts access to admin and superadmin roles
 */
export function adminOnly(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "User not authenticated" });
  }
  
  const role = req.user.role.toLowerCase();
  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({ 
      message: "Admin access required",
      current: req.user.role
    });
  }
  
  next();
}

/**
 * Superadmin Only Middleware
 * Restricts access to superadmin role only
 */
export function superadminOnly(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "User not authenticated" });
  }
  
  if (req.user.role.toLowerCase() !== "superadmin") {
    return res.status(403).json({ 
      message: "Superadmin access required",
      current: req.user.role
    });
  }
  
  next();
}

/**
 * Owner Verification Middleware
 * Ensures user can only access their own resources
 * @param {string} paramName - URL parameter containing the resource owner ID (default: 'userId')
 */
export function verifyOwnership(paramName = "userId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const resourceOwnerId = req.params[paramName];
    const currentUserId = req.user.id || req.user._id;
    
    // Allow if user is admin/superadmin or owner
    if (
      req.user.role?.toLowerCase() === "superadmin" ||
      req.user.role?.toLowerCase() === "admin" ||
      resourceOwnerId === currentUserId
    ) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "You can only access your own resources"
    });
  };
}

/**
 * Tutor Access Middleware
 * Allows tutors, admins, and superadmins
 */
export function tutorAccess(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "User not authenticated" });
  }
  
  const role = req.user.role.toLowerCase();
  if (!["tutor", "admin", "superadmin"].includes(role)) {
    return res.status(403).json({ 
      message: "Tutor or higher access required",
      current: req.user.role
    });
  }
  
  next();
}

/**
 * Student Access Middleware
 * Allows students and higher roles
 */
export function studentAccess(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "User not authenticated" });
  }
  
  const role = req.user.role.toLowerCase();
  if (!["student", "tutor", "admin", "superadmin"].includes(role)) {
    return res.status(403).json({ 
      message: "Student or higher access required",
      current: req.user.role
    });
  }
  
  next();
}

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per user
 */
const requestCounts = new Map();

export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, []);
    }
    
    const requests = requestCounts.get(userId);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        message: "Too many requests, please try again later"
      });
    }
    
    recentRequests.push(now);
    requestCounts.set(userId, recentRequests);
    
    next();
  };
}

/**
 * Audit Logger Middleware
 * Logs important actions for security audit
 */
export function auditLog(action) {
  return (req, res, next) => {
    const userId = req.user?.id || "unknown";
    const timestamp = new Date().toISOString();
    
    console.log(`[AUDIT] ${timestamp} | User: ${userId} | Action: ${action} | IP: ${req.ip}`);
    
    next();
  };
}

/**
 * Error Handler for Auth Errors
 * Centralized error handling for authentication errors
 */
export function authErrorHandler(err, req, res, next) {
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token has expired" });
  }
  
  next(err);
}
