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
    const roomTypeId =
      req.query.room_type_id === undefined
        ? null
        : Number(req.query.room_type_id);

    if (
      roomTypeId !== null &&
      (!Number.isInteger(roomTypeId) || roomTypeId <= 0)
    ) {
      return res.status(400).json({
        message: "room_type_id phải là số nguyên dương.",
      });
    }

    try {
      const [prices] = await db.query(
        `
          SELECT
            price_id,
            room_type_id,
            monthly_rent,
            effective_from,
            effective_to,
            created_by
          FROM room_type_prices
          WHERE (? IS NULL OR room_type_id = ?)
          ORDER BY room_type_id ASC, effective_from DESC
        `,
        [roomTypeId, roomTypeId],
      );

      return res.status(200).json({
        message: "Lấy lịch sử giá phòng thành công.",
        total: prices.length,
        data: prices,
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử giá phòng:", error);

      return res.status(500).json({
        message: "Không thể lấy lịch sử giá phòng.",
      });
    }
  },
);

module.exports = router;
