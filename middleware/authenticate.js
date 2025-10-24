import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function authorizeRole(...roles) {
  return (req, res, next) => { // <-- changed 'resp' to 'res'
    // Defensive: check req.user exists
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Case-insensitive role comparison for robustness
    if (!roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
