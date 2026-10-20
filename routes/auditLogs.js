const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { ROLE_IDS, authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/", authMiddleware, authorizeRoles(ROLE_IDS.ADMIN), async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const requestedOffset = Number.parseInt(req.query.offset, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;
  const offset = Number.isInteger(requestedOffset)
    ? Math.max(requestedOffset, 0)
    : 0;

  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");
    const [logs] = await db.query(
      `SELECT
         audit_log_id,
         user_id,
         action_type,
         table_name,
         record_id,
         old_data,
         new_data,
         description,
         ip_address,
         created_at
       FROM audit_logs
       ORDER BY created_at DESC, audit_log_id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return res.status(200).json({
      message: "Lấy nhật ký hệ thống thành công.",
      total,
      limit,
      offset,
      data: logs,
    });
  } catch (error) {
    console.error("Lỗi lấy nhật ký hệ thống:", error);
    return res.status(500).json({
      message: "Không thể lấy nhật ký hệ thống.",
    });
  }
});

module.exports = router;
