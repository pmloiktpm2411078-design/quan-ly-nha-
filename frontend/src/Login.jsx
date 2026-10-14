import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn trang web tải lại khi bấm submit

    try {
      // Gọi API Đăng nhập tới Backend
      const response = await axios.post("http://localhost:3000/api/login", {
        username: username,
        password: password,
      });

      setMessage(response.data.message); // Hiển thị thông báo thành công

      // Lưu token vào bộ nhớ trình duyệt để dùng cho các chức năng sau này
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");

      // Tạm thời alert ra thông báo để dễ nhận biết
      alert("Đăng nhập thành công! Chào " + response.data.user.fullName);
    } catch (error) {
      // Xử lý khi đăng nhập thất bại (sai pass, tài khoản khóa...)
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Lỗi kết nối đến máy chủ!");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        textAlign: "center",
        fontFamily: "Arial",
      }}
    >
      <h2>Đăng nhập Hệ thống</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>
        <button
          type="submit"
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Đăng nhập
        </button>
      </form>
      <p style={{ color: "red", marginTop: "20px" }}>{message}</p>
    </div>
  );
}

export default Login;
