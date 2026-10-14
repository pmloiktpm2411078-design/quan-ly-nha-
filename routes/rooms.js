const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("./authMiddleware");

// UC-ROOM-01: Xem danh sách phòng
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT
        r.room_id,
        r.room_code,
        r.room_number,
        r.room_type_id,
        rt.type_code,
        rt.type_name,
        r.area_m2,
        r.listed_rent,
        r.status,
        r.description,
        r.created_at,
        r.updated_at
      FROM rooms r
      INNER JOIN room_types rt
        ON r.room_type_id = rt.room_type_id
      ORDER BY r.room_code ASC
    `;

    const [rooms] = await db.query(sql);

    return res.status(200).json({
      message: "Lấy danh sách phòng thành công.",
      total: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách phòng.",
    });
  }
});
// UC-ROOM-02: Thêm phòng mới
// UC-ROOM-03: Lấy thông tin chi tiết một phòng
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({
        message: "Mã phòng không hợp lệ.",
      });
    }

    const [rooms] = await db.query(
      `SELECT
        r.room_id,
        r.room_code,
        r.room_number,
        r.room_type_id,
        rt.type_code,
        rt.type_name,
        r.area_m2,
        r.listed_rent,
        r.status,
        r.description
      FROM rooms r
      INNER JOIN room_types rt
        ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = ?`,
      [roomId],
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy phòng.",
      });
    }

    return res.status(200).json({
      message: "Lấy thông tin phòng thành công.",
      data: rooms[0],
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin phòng:", error);

    return res.status(500).json({
      message: "Không thể lấy thông tin phòng.",
    });
  }
});
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      room_code,
      room_number,
      room_type_id,
      area_m2,
      listed_rent,
      description,
    } = req.body;

    // 1. Kiểm tra thông tin bắt buộc
    if (
      !room_code ||
      !room_number ||
      !room_type_id ||
      listed_rent === undefined ||
      listed_rent === null ||
      listed_rent === ""
    ) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ mã phòng, số phòng, loại phòng và giá thuê.",
      });
    }

    // 2. Kiểm tra dữ liệu số
    const typeId = Number(room_type_id);
    const rent = Number(listed_rent);
    const area =
      area_m2 === "" || area_m2 === null || area_m2 === undefined
        ? null
        : Number(area_m2);

    if (!Number.isInteger(typeId) || typeId <= 0) {
      return res.status(400).json({
        message: "Loại phòng không hợp lệ.",
      });
    }

    if (!Number.isFinite(rent) || rent < 0) {
      return res.status(400).json({
        message: "Giá thuê phải là số không âm.",
      });
    }

    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      return res.status(400).json({
        message: "Diện tích phải lớn hơn 0.",
      });
    }

    const code = String(room_code).trim();
    const number = String(room_number).trim();

    if (!code || !number) {
      return res.status(400).json({
        message: "Mã phòng và số phòng không được để trống.",
      });
    }

    // 3. Kiểm tra mã phòng và số phòng đã tồn tại chưa
    const [existingRooms] = await db.query(
      `SELECT room_id
       FROM rooms
       WHERE room_code = ? OR room_number = ?`,
      [code, number],
    );

    if (existingRooms.length > 0) {
      return res.status(409).json({
        message: "Mã phòng hoặc số phòng đã tồn tại.",
      });
    }

    // 4. Kiểm tra loại phòng có tồn tại không
    const [roomTypes] = await db.query(
      `SELECT room_type_id
       FROM room_types
       WHERE room_type_id = ?`,
      [typeId],
    );

    if (roomTypes.length === 0) {
      return res.status(400).json({
        message: "Loại phòng không tồn tại.",
      });
    }

    // 5. Lưu phòng mới vào database
    const [result] = await db.query(
      `INSERT INTO rooms
       (
         room_code,
         room_number,
         room_type_id,
         area_m2,
         listed_rent,
         status,
         description
       )
       VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
      [
        code,
        number,
        typeId,
        area,
        rent,
        description ? String(description).trim() : null,
      ],
    );

    return res.status(201).json({
      message: "Thêm phòng thành công!",
      room_id: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi thêm phòng:", error);

    return res.status(500).json({
      message: "Không thể thêm phòng. Vui lòng kiểm tra lại dữ liệu.",
    });
  }
});

// UC-ROOM-03: Cập nhật thông tin phòng
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    const {
      room_code,
      room_number,
      room_type_id,
      area_m2,
      listed_rent,
      description,
    } = req.body;

    // 1. Kiểm tra mã phòng trên URL
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({
        message: "Mã phòng không hợp lệ.",
      });
    }

    // 2. Kiểm tra thông tin bắt buộc
    if (
      !room_code ||
      !room_number ||
      !room_type_id ||
      listed_rent === undefined ||
      listed_rent === null ||
      listed_rent === ""
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin bắt buộc.",
      });
    }

    const code = String(room_code).trim();
    const number = String(room_number).trim();
    const typeId = Number(room_type_id);
    const rent = Number(listed_rent);

    const area =
      area_m2 === "" || area_m2 === null || area_m2 === undefined
        ? null
        : Number(area_m2);

    if (!code || !number) {
      return res.status(400).json({
        message: "Mã phòng và số phòng không được để trống.",
      });
    }

    if (!Number.isInteger(typeId) || typeId <= 0) {
      return res.status(400).json({
        message: "Loại phòng không hợp lệ.",
      });
    }

    if (!Number.isFinite(rent) || rent < 0) {
      return res.status(400).json({
        message: "Giá thuê phải là số không âm.",
      });
    }

    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      return res.status(400).json({
        message: "Diện tích phải lớn hơn 0.",
      });
    }

    // 3. Kiểm tra phòng có tồn tại không
    const [currentRooms] = await db.query(
      "SELECT room_id FROM rooms WHERE room_id = ?",
      [roomId],
    );

    if (currentRooms.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy phòng cần sửa.",
      });
    }

    // 4. Kiểm tra trùng mã phòng hoặc số phòng
    // Bỏ qua chính phòng đang được sửa
    const [existingRooms] = await db.query(
      `SELECT room_id
       FROM rooms
       WHERE (room_code = ? OR room_number = ?)
       AND room_id <> ?`,
      [code, number, roomId],
    );

    if (existingRooms.length > 0) {
      return res.status(409).json({
        message: "Mã phòng hoặc số phòng đã được sử dụng.",
      });
    }

    // 5. Kiểm tra loại phòng
    const [roomTypes] = await db.query(
      "SELECT room_type_id FROM room_types WHERE room_type_id = ?",
      [typeId],
    );

    if (roomTypes.length === 0) {
      return res.status(400).json({
        message: "Loại phòng không tồn tại.",
      });
    }

    // 6. Cập nhật thông tin phòng
    // Giữ nguyên trạng thái phòng hiện tại
    await db.query(
      `UPDATE rooms
       SET room_code = ?,
           room_number = ?,
           room_type_id = ?,
           area_m2 = ?,
           listed_rent = ?,
           description = ?
       WHERE room_id = ?`,
      [
        code,
        number,
        typeId,
        area,
        rent,
        description ? String(description).trim() : null,
        roomId,
      ],
    );

    return res.status(200).json({
      message: "Cập nhật thông tin phòng thành công!",
      room_id: roomId,
    });
  } catch (error) {
    console.error("Lỗi cập nhật phòng:", error);

    return res.status(500).json({
      message: "Không thể cập nhật phòng. Vui lòng thử lại.",
    });
  }
});

module.exports = router;
