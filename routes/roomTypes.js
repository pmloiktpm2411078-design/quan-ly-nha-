const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { ROLE_IDS, authorizeRoles } = require("../middleware/authorizeRoles");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles(ROLE_IDS.MANAGER, ROLE_IDS.STAFF),
  async (req, res) => {
  try {
    const [types] = await db.query(`
      SELECT
        room_type_id,
        type_code,
        type_name,
        description
      FROM room_types
      ORDER BY room_type_id ASC
    `);

    return res.status(200).json({
      message: "Lấy danh sách loại phòng thành công",
      total: types.length,
      data: types,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách loại phòng:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách loại phòng",
    });
  }
  },
);

module.exports = router;
