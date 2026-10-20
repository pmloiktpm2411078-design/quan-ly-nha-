
import "./Login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-header-section">
        <div className="login-main-title">ĐĂNG NHẬP</div>
        <div className="breadcrumb-nav">
          <span className="breadcrumb-btn">Trang chủ</span>
          <span className="breadcrumb-btn active">Đăng nhập</span>
        </div>
      </div>

      <div className="login-box-container">
        <div className="login-card-box">
          <div className="avatar-container">
            <div className="avatar-circle">
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-field-group">
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="custom-login-input"
              />
            </div>

            <div className="input-field-group password-field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="custom-login-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button type="submit" className="custom-submit-btn">
              Đăng nhập
            </button>

            <div className="login-extra-links">
              <label className="remember-me-label">
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
              <a
                href="#forgot"
                className="forgot-password-link"
                onClick={(e) => e.preventDefault()}
              >
                Quên mật khẩu
              </a>
            </div>
          </form>

          <div className="register-account-row">
            <a
              href="#register"
              onClick={(e) => e.preventDefault()}
            >
              Đăng ký tài khoản
            </a>
          </div>

          {message && <p className="error-message-text">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;
