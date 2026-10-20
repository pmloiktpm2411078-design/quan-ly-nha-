const ROLE_IDS = Object.freeze({
  ADMIN: 1,
  MANAGER: 2,
  STAFF: 3,
});

function authorizeRoles(...allowedRoleIds) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập hoặc token không hợp lệ.",
      });
    }

    if (!allowedRoleIds.includes(Number(req.user.roleId))) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện chức năng này.",
      });
    }

    return next();
  };
}

module.exports = { ROLE_IDS, authorizeRoles };
