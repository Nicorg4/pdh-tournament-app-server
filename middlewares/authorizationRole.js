function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accwess denied: Unauthorized role' });
    }
    next();
  };
}

module.exports = authorizeRole;
