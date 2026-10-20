import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  // Trạng thái hiển thị danh sách phòng
  const [showRooms, setShowRooms] = useState(false);

  // Dữ liệu và trạng thái tải danh sách phòng
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Lấy danh sách phòng từ Backend
  const handleShowRooms = async () => {
    setShowRooms(true);
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/rooms", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          );
        } else {
          setError(result.message || "Không thể tải danh sách phòng.");
        }

        setLoading(false);
        return;
      }

      setRooms(result.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng:", err);
      setError(
        "Không thể kết nối đến máy chủ. Hãy kiểm tra Backend có đang chạy không.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Các chức năng trên Dashboard
  const features = [
    {
      title: "Quản lý phòng",
      description: "Theo dõi danh sách phòng và tình trạng phòng.",
      icon: "🏠",
      action: () => navigate("/rooms"),
    },
    {
      title: "Quản lý người thuê",
      description: "Lưu trữ thông tin và quản lý người thuê.",
      icon: "👥",
      action: () => navigate("/tenants"),
    },
    {
      title: "Quản lý hợp đồng",
      description: "Theo dõi hợp đồng thuê phòng.",
      icon: "📄",
    },
    {
      title: "Quản lý thu tiền",
      description: "Theo dõi tiền thuê, điện, nước và công nợ.",
      icon: "💰",
    },
    {
      title: "Quản lý dịch vụ",
      description: "Quản lý các dịch vụ sử dụng tại nhà trọ.",
      icon: "🛠️",
    },
    {
      title: "Báo cáo thống kê",
      description: "Theo dõi doanh thu và tình trạng phòng.",
      icon: "📊",
    },
  ];

  // Chuyển mã trạng thái thành tiếng Việt
  const getRoomStatus = (status) => {
    const statuses = {
      AVAILABLE: "Còn trống",
      HOLD: "Đang giữ phòng",
      OCCUPIED: "Đang có người thuê",
      PROCESSING: "Đang xử lý",
      MAINTENANCE: "Đang bảo trì",
    };

    return statuses[status] || status || "Chưa xác định";
  };

  // Định dạng tiền Việt Nam
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>QUẢN LÝ NHÀ TRỌ</h1>
          <p>Hệ thống quản lý và theo dõi hoạt động nhà trọ</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <h2>Chào mừng bạn đến với hệ thống!</h2>
          <p>Chọn chức năng bên dưới để bắt đầu quản lý nhà trọ.</p>
        </section>

        {/* Danh sách chức năng */}
        <section className="feature-grid">
          {features.map((feature) => (
            <div
              className="feature-card"
              key={feature.title}
              onClick={feature.action}
              role={feature.action ? "button" : undefined}
              tabIndex={feature.action ? 0 : undefined}
              onKeyDown={(event) => {
                if (
                  feature.action &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  feature.action();
                }
              }}
              style={{
                cursor: feature.action ? "pointer" : "default",
              }}
            >
              <div className="feature-icon">{feature.icon}</div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <span className="feature-status">
                {feature.action ? "Nhấn để xem" : "Đang phát triển"}
              </span>
            </div>
          ))}
        </section>

        {/* Khu vực danh sách phòng */}
        {showRooms && (
          <section
            style={{
              marginTop: "32px",
              padding: "24px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 8px" }}>Danh sách phòng trọ</h2>

                <p style={{ margin: 0, color: "#666" }}>
                  Dữ liệu được lấy từ cơ sở dữ liệu của hệ thống.
                </p>
              </div>

              <button
                onClick={handleShowRooms}
                disabled={loading}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>

            {loading && <p>Đang tải danh sách phòng...</p>}

            {error && (
              <div
                role="alert"
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  color: "#b91c1c",
                  backgroundColor: "#fee2e2",
                  borderRadius: "6px",
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <p>
                  Tổng số phòng: <strong>{rooms.length}</strong>
                </p>

                {rooms.length === 0 ? (
                  <p>Chưa có phòng nào trong cơ sở dữ liệu.</p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      minWidth: "750px",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#eff6ff" }}>
                        {[
                          "Mã phòng",
                          "Số phòng",
                          "Loại phòng",
                          "Diện tích",
                          "Giá thuê/tháng",
                          "Trạng thái",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "14px 12px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.room_id}>
                          <td style={cellStyle}>{room.room_code}</td>

                          <td style={cellStyle}>{room.room_number}</td>

                          <td style={cellStyle}>
                            {room.type_name || "Chưa phân loại"}
                          </td>

                          <td style={cellStyle}>
                            {room.area_m2 != null
                              ? `${room.area_m2} m²`
                              : "Chưa cập nhật"}
                          </td>

                          <td style={cellStyle}>
                            {formatCurrency(room.listed_rent)}
                          </td>

                          <td style={cellStyle}>
                            {getRoomStatus(room.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <footer className="dashboard-footer">Hệ thống quản lý nhà trọ</footer>
    </div>
  );
}

const cellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
};

export default Dashboard;
