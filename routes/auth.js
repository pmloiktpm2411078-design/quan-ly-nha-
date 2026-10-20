const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { jwtSecret } = require("../config/env");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    const user = users[0];

    if (user.status === "LOCKED") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    const token = jwt.sign(
      { userId: user.user_id, roleId: user.role_id, username: user.username },
      jwtSecret,
      { expiresIn: "8h" },
    );

    return res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        fullName: user.full_name,
        roleId: user.role_id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi hệ thống!" });
  }
});

module.exports = router;
