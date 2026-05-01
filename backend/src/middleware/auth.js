const jwt = require('jsonwebtoken');

// JWT secret — required in production. Throw at startup if not set so the platform
// can never accidentally run with a known fallback secret.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production' || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET env var is missing or weak. Refusing to start.');
    process.exit(1);
  } else {
    console.warn('[auth] WARNING: JWT_SECRET is missing/weak. Allowing in non-production for dev only.');
  }
}

const EFFECTIVE_SECRET = JWT_SECRET || 'dev-only-' + Math.random().toString(36).slice(2);

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, EFFECTIVE_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(403).json({ error: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const generateToken = (id, role, additionalData = {}) => {
  const payload = {
    id,
    role,
    ...additionalData,
  };
  // Shorter token lifetime than the previous 30 days. With a refresh-token flow added later,
  // we'll bring this down to 1h.
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: '7d' });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  generateToken,
};
