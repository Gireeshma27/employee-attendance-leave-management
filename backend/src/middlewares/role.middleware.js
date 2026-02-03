export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedRoles.join(', ')} can access this resource.`,
      });
    }

    next();
  };
};

export const isAdmin = roleMiddleware(['ADMIN']);
export const isManager = roleMiddleware(['ADMIN', 'MANAGER']);
export const isEmployee = roleMiddleware(['ADMIN', 'MANAGER', 'EMPLOYEE']);

export default roleMiddleware;
