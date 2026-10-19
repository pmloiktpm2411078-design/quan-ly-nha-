import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Rooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MỚI: Tìm kiếm và lọc phòng
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
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
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
            return;
          }

          throw new Error(result.message || "Không thể tải danh sách phòng.");
        }

        setRooms(result.data || []);
      } catch (err) {
        setError(err.message || "Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const getStatus = (status) => {
    const statusMap = {
      AVAILABLE: "Còn trống",
      HOLD: "Đang giữ phòng",
      OCCUPIED: "Đang có người thuê",
      PROCESSING: "Đang xử lý",
      MAINTENANCE: "Đang bảo trì",
    };

    return statusMap[status] || status || "Chưa xác định";
  };
  // MỚI: Lọc danh sách phòng theo từ khóa và trạng thái
  const filteredRooms = rooms.filter((room) => {
    const searchText = keyword.trim().toLowerCase();

    const matchesKeyword =
      String(room.room_code || "")
        .toLowerCase()
        .includes(searchText) ||
      String(room.room_number || "")
        .toLowerCase()
        .includes(searchText) ||
      String(room.type_name || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" || room.status === statusFilter;

    return matchesKeyword && matchesStatus;
  });

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <button onClick={() => navigate("/dashboard")}>
        ← Quay lại Dashboard
      </button>

      <h1>QUẢN LÝ PHÒNG</h1>
      <p>Danh sách phòng trọ trong hệ thống.</p>
      {/* MỚI: Khu vực tìm kiếm và lọc phòng */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          margin: "20px 0",
        }}
      >
        <input
          type="text"
          placeholder="Tìm mã phòng, số phòng hoặc loại phòng..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{
            padding: "10px",
            width: "320px",
            maxWidth: "100%",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống</option>
          <option value="HOLD">Đang giữ phòng</option>
          <option value="OCCUPIED">Đang có người thuê</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="MAINTENANCE">Đang bảo trì</option>
        </select>

        <button
          onClick={() => {
            setKeyword("");
            setStatusFilter("ALL");
          }}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
      <button
        onClick={() => (window.location.href = "/rooms/add")}
        style={{
          padding: "10px 16px",
          marginBottom: "20px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        + Thêm phòng
      </button>

      {loading && <p>Đang tải danh sách phòng...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <p>
            Tổng số phòng: <strong>{rooms.length}</strong>
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "700px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#e8efff" }}>
                  <th style={cellStyle}>Mã phòng</th>
                  <th style={cellStyle}>Số phòng</th>
                  <th style={cellStyle}>Loại phòng</th>
                  <th style={cellStyle}>Diện tích</th>
                  <th style={cellStyle}>Giá thuê/tháng</th>
                  <th style={cellStyle}>Trạng thái</th>
                  <th style={cellStyle}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.map((room) => (
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
                    <td style={cellStyle}>{getStatus(room.status)}</td>
                    <td style={cellStyle}>
                      <button
                        onClick={() => navigate(`/rooms/${room.room_id}`)}
                        style={{
                          padding: "7px 12px",
                          marginRight: "6px",
                          backgroundColor: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        👁 Chi tiết
                      </button>
                      <button
                        onClick={() => navigate(`/rooms/edit/${room.room_id}`)}
                        style={{
                          padding: "7px 12px",
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rooms.length === 0 && <p>Chưa có phòng nào trong hệ thống.</p>}
        </>
      )}
    </div>
  );
}

const cellStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  textAlign: "left",
};

export default Rooms;
