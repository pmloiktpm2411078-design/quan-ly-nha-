const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { ROLE_IDS, authorizeRoles } = require("../middleware/authorizeRoles");
const writeAuditLog = require("../services/auditLog");

const tenantReadRoles = authorizeRoles(ROLE_IDS.MANAGER, ROLE_IDS.STAFF);
const tenantWriteRole = authorizeRoles(ROLE_IDS.STAFF);

// ============================================
// UC-TENANT-01: LẤY DANH SÁCH NGƯỜI THUÊ
// API: GET /api/tenants
// ============================================
router.get("/", authMiddleware, tenantReadRoles, async (req, res) => {
  try {
    const keyword = String(req.query.keyword || "").trim();

    const sql = `
      SELECT
        tenant_id,
        full_name,
        date_of_birth,
        identity_number,
        phone,
        address,
        contact_info,
        created_at,
        updated_at
      FROM tenants
      WHERE
        full_name LIKE ?
        OR phone LIKE ?
        OR identity_number LIKE ?
      ORDER BY tenant_id DESC
    `;

    const searchValue = `%${keyword}%`;

    const [tenants] = await db.query(sql, [
      searchValue,
      searchValue,
      searchValue,
    ]);

    return res.status(200).json({
      message: "Lấy danh sách người thuê thành công.",
      total: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách người thuê:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách người thuê.",
    });
  }
});

// ============================================
// UC-TENANT-02: XEM CHI TIẾT NGƯỜI THUÊ
// API: GET /api/tenants/:id
// ============================================
router.get("/:id", authMiddleware, tenantReadRoles, async (req, res) => {
  try {
    const tenantId = Number(req.params.id);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return res.status(400).json({
        message: "Mã người thuê không hợp lệ.",
      });
    }

    const [tenants] = await db.query(
      `SELECT
        tenant_id,
        full_name,
        date_of_birth,
        identity_number,
        phone,
        address,
        contact_info,
        created_at,
        updated_at
      FROM tenants
      WHERE tenant_id = ?`,
      [tenantId],
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy người thuê.",
      });
    }

    return res.status(200).json({
      message: "Lấy thông tin người thuê thành công.",
      data: tenants[0],
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người thuê:", error);

    return res.status(500).json({
      message: "Không thể lấy thông tin người thuê.",
    });
  }
});

// ============================================
// UC-TENANT-03: THÊM NGƯỜI THUÊ
// API: POST /api/tenants
// ============================================
router.post("/", authMiddleware, tenantWriteRole, async (req, res) => {
  try {
    const {
      full_name,
      date_of_birth,
      identity_number,
      phone,
      address,
      contact_info,
    } = req.body;

    const fullName = String(full_name || "").trim();

    if (!fullName) {
      return res.status(400).json({
        message: "Vui lòng nhập họ và tên người thuê.",
      });
    }

    const identityNumber = String(identity_number || "").trim();
    const phoneNumber = String(phone || "").trim();

    // Kiểm tra số điện thoại đã được sử dụng chưa.
    if (phoneNumber) {
      const [existingPhone] = await db.query(
        `SELECT tenant_id
         FROM tenants
         WHERE phone = ?
         LIMIT 1`,
        [phoneNumber],
      );

      if (existingPhone.length > 0) {
        return res.status(409).json({
          message: "Số điện thoại này đã được sử dụng.",
        });
      }
    }

    // Kiểm tra số giấy tờ tùy thân đã được sử dụng chưa.
    if (identityNumber) {
      const [existingIdentity] = await db.query(
        `SELECT tenant_id
         FROM tenants
         WHERE identity_number = ?
         LIMIT 1`,
        [identityNumber],
      );

      if (existingIdentity.length > 0) {
        return res.status(409).json({
          message: "Số giấy tờ tùy thân này đã được sử dụng.",
        });
      }
    }

    // Kiểm tra ngày sinh nếu người dùng có nhập.
    let dateOfBirth = date_of_birth || null;

    if (dateOfBirth) {
      dateOfBirth = String(dateOfBirth).trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return res.status(400).json({
          message: "Ngày sinh phải có định dạng YYYY-MM-DD.",
        });
      }

      const date = new Date(`${dateOfBirth}T00:00:00Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== dateOfBirth
      ) {
        return res.status(400).json({
          message: "Ngày sinh không hợp lệ.",
        });
      }

      if (dateOfBirth > new Date().toISOString().slice(0, 10)) {
        return res.status(400).json({
          message: "Ngày sinh không được lớn hơn ngày hiện tại.",
        });
      }
    }

    const connection = await db.getConnection();
    let result;

    try {
      await connection.beginTransaction();
      [result] = await connection.query(
      `INSERT INTO tenants (
        full_name,
        date_of_birth,
        identity_number,
        phone,
        address,
        contact_info
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        dateOfBirth,
        identityNumber || null,
        phoneNumber || null,
        address ? String(address).trim() : null,
        contact_info ? String(contact_info).trim() : null,
        ],
      );

      await writeAuditLog(connection, req, {
        userId: req.user.userId,
        actionType: "CREATE",
        tableName: "tenants",
        recordId: result.insertId,
        newData: {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          identity_number: identityNumber || null,
          phone: phoneNumber || null,
          address: address ? String(address).trim() : null,
          contact_info: contact_info ? String(contact_info).trim() : null,
        },
        description: "Tạo hồ sơ người thuê",
      });

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(201).json({
      message: "Thêm người thuê thành công.",
      tenant_id: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi thêm người thuê:", error);

    return res.status(500).json({
      message: "Không thể thêm người thuê.",
    });
  }
});

// ============================================
// UC-TENANT-04: CẬP NHẬT NGƯỜI THUÊ
// API: PUT /api/tenants/:id
// ============================================
router.put("/:id", authMiddleware, tenantWriteRole, async (req, res) => {
  try {
    const tenantId = Number(req.params.id);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return res.status(400).json({
        message: "Mã người thuê không hợp lệ.",
      });
    }

    const {
      full_name,
      date_of_birth,
      identity_number,
      phone,
      address,
      contact_info,
    } = req.body;

    const fullName = String(full_name || "").trim();

    if (!fullName) {
      return res.status(400).json({
        message: "Vui lòng nhập họ và tên người thuê.",
      });
    }

    const [currentTenant] = await db.query(
      "SELECT * FROM tenants WHERE tenant_id = ?",
      [tenantId],
    );

    if (currentTenant.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy người thuê cần cập nhật.",
      });
    }

    const identityNumber = String(identity_number || "").trim();
    const phoneNumber = String(phone || "").trim();

    if (phoneNumber) {
      const [existingPhone] = await db.query(
        `SELECT tenant_id
         FROM tenants
         WHERE phone = ? AND tenant_id <> ?
         LIMIT 1`,
        [phoneNumber, tenantId],
      );

      if (existingPhone.length > 0) {
        return res.status(409).json({
          message: "Số điện thoại này đã thuộc về người thuê khác.",
        });
      }
    }

    if (identityNumber) {
      const [existingIdentity] = await db.query(
        `SELECT tenant_id
         FROM tenants
         WHERE identity_number = ? AND tenant_id <> ?
         LIMIT 1`,
        [identityNumber, tenantId],
      );

      if (existingIdentity.length > 0) {
        return res.status(409).json({
          message: "Số giấy tờ tùy thân này đã thuộc về người thuê khác.",
        });
      }
    }

    let dateOfBirth = date_of_birth || null;

    if (dateOfBirth) {
      dateOfBirth = String(dateOfBirth).trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return res.status(400).json({
          message: "Ngày sinh phải có định dạng YYYY-MM-DD.",
        });
      }

      const date = new Date(`${dateOfBirth}T00:00:00Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== dateOfBirth
      ) {
        return res.status(400).json({
          message: "Ngày sinh không hợp lệ.",
        });
      }

      if (dateOfBirth > new Date().toISOString().slice(0, 10)) {
        return res.status(400).json({
          message: "Ngày sinh không được lớn hơn ngày hiện tại.",
        });
      }
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE tenants
       SET full_name = ?,
           date_of_birth = ?,
           identity_number = ?,
           phone = ?,
           address = ?,
           contact_info = ?
       WHERE tenant_id = ?`,
      [
        fullName,
        dateOfBirth,
        identityNumber || null,
        phoneNumber || null,
        address ? String(address).trim() : null,
        contact_info ? String(contact_info).trim() : null,
        tenantId,
        ],
      );

      await writeAuditLog(connection, req, {
        userId: req.user.userId,
        actionType: "UPDATE",
        tableName: "tenants",
        recordId: tenantId,
        oldData: currentTenant[0],
        newData: {
          ...currentTenant[0],
          full_name: fullName,
          date_of_birth: dateOfBirth,
          identity_number: identityNumber || null,
          phone: phoneNumber || null,
          address: address ? String(address).trim() : null,
          contact_info: contact_info ? String(contact_info).trim() : null,
        },
        description: "Cập nhật hồ sơ người thuê",
      });

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      message: "Cập nhật người thuê thành công.",
      tenant_id: tenantId,
    });
  } catch (error) {
    console.error("Lỗi cập nhật người thuê:", error);

    return res.status(500).json({
      message: "Không thể cập nhật thông tin người thuê.",
    });
  }
});

module.exports = router;
