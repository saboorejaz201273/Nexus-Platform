// Restricts route access to specific roles
// Usage: roleCheck('investor') or roleCheck('investor', 'entrepreneur')
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. This action requires: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

module.exports = roleCheck;