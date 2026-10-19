const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("./authMiddleware");

// =====================================================
// GET /api/holds
// Xem danh sách giữ phòng
// =====================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT
        h.hold_id,
        h.room_id,
        r.room_code,
        r.room_number,
        h.tenant_id,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        h.started_at,
        h.expires_at,
        h.status AS hold_status,
        h.expiry_action,
        d.deposit_id,
        d.amount AS deposit_amount,
        d.status AS deposit_status,
        h.notes
      FROM reservation_holds h
      INNER JOIN rooms r ON h.room_id = r.room_id
      INNER JOIN tenants t ON h.tenant_id = t.tenant_id
      LEFT JOIN deposits d
        ON d.hold_id = h.hold_id
        AND d.deposit_type = 'RESERVATION'
      ORDER BY h.created_at DESC, h.hold_id DESC
    `;

    const [holds] = await db.query(sql);

    return res.status(200).json({
      message: "Lấy danh sách giữ phòng thành công.",
      total: holds.length,
      data: holds,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách giữ phòng:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách giữ phòng.",
    });
  }
});

// =====================================================
// POST /api/holds
// Tạo lượt giữ phòng và ghi nhận tiền cọc
// =====================================================
router.post("/", authMiddleware, async (req, res) => {
  const roomId = Number(req.body.room_id);
  const tenantId = Number(req.body.tenant_id);
  const amount = Number(req.body.amount);
  const notes = req.body.notes ? String(req.body.notes).trim() : null;

  // Mặc định giữ phòng 5 ngày.
  // Có thể truyền expires_at để chọn thời hạn cụ thể.
  let expiresAt = null;

  if (req.body.expires_at) {
    const date = new Date(req.body.expires_at);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Thời hạn giữ phòng không hợp lệ.",
      });
    }

    expiresAt = date;
  } else {
    expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  }

  if (
    !Number.isInteger(roomId) ||
    roomId <= 0 ||
    !Number.isInteger(tenantId) ||
    tenantId <= 0
  ) {
    return res.status(400).json({
      message: "Phòng và khách thuê không hợp lệ.",
    });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Tiền cọc giữ phòng phải lớn hơn 0.",
    });
  }

  if (expiresAt.getTime() <= Date.now()) {
    return res.status(400).json({
      message: "Thời hạn giữ phòng phải ở tương lai.",
    });
  }

  // Chỉ cho vai trò MANAGER và STAFF thực hiện nghiệp vụ.
  // ADMIN không mặc nhiên được thao tác nghiệp vụ giữ phòng.
  if (![2, 3].includes(Number(req.user.roleId))) {
    return res.status(403).json({
      message: "Bạn không có quyền thực hiện chức năng giữ phòng.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Khóa bản ghi phòng để tránh hai yêu cầu giữ cùng một phòng.
    const [rooms] = await connection.query(
      `SELECT room_id, status
       FROM rooms
       WHERE room_id = ?
       FOR UPDATE`,
      [roomId],
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy phòng.",
      });
    }

    if (rooms[0].status !== "AVAILABLE") {
      await connection.rollback();

      return res.status(409).json({
        message: "Phòng không còn trống để giữ.",
      });
    }

    // Kiểm tra khách thuê.
    const [tenants] = await connection.query(
      `SELECT tenant_id
       FROM tenants
       WHERE tenant_id = ?`,
      [tenantId],
    );

    if (tenants.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy khách thuê.",
      });
    }

    // Tạo lượt giữ phòng.
    const [holdResult] = await connection.query(
      `INSERT INTO reservation_holds
       (
         room_id,
         tenant_id,
         created_by,
         started_at,
         expires_at,
         status,
         notes
       )
       VALUES (?, ?, ?, NOW(), ?, 'ACTIVE', ?)`,
      [roomId, tenantId, req.user.userId, expiresAt, notes],
    );

    const holdId = holdResult.insertId;

    // Ghi nhận tiền cọc giữ phòng.
    await connection.query(
      `INSERT INTO deposits
       (
         hold_id,
         tenant_id,
         room_id,
         deposit_type,
         amount,
         status,
         created_by
       )
       VALUES (?, ?, ?, 'RESERVATION', ?, 'HELD', ?)`,
      [holdId, tenantId, roomId, amount, req.user.userId],
    );

    // Chuyển trạng thái phòng sang HOLD.
    await connection.query(
      `UPDATE rooms
       SET status = 'HOLD'
       WHERE room_id = ?`,
      [roomId],
    );

    await connection.commit();

    return res.status(201).json({
      message: "Tạo lượt giữ phòng và ghi nhận tiền cọc thành công.",
      data: {
        hold_id: holdId,
        room_id: roomId,
        tenant_id: tenantId,
        amount,
        expires_at: expiresAt,
        status: "ACTIVE",
        deposit_status: "HELD",
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Lỗi tạo lượt giữ phòng:", error);

    return res.status(500).json({
      message: "Không thể tạo lượt giữ phòng.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
