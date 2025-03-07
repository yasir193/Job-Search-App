export const isAdmin = (req, res, next) => {
  if (req.loggedInUser.role !== "admin") {
    return res.status(403).json({ message: "Only admins can perform this action" });
  }
  next();
};