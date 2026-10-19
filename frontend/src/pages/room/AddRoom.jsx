import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AddRoom() {
  const navigate = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    room_code: "",
    room_number: "",
    room_type_id: "",
    area_m2: "",
    listed_rent: "",
    description: "",
  });

  // Lấy danh sách loại phòng từ Backend
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:3000/api/room-types", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Không thể lấy danh sách loại phòng.",
          );
        }

        setRoomTypes(result.data || []);
      } catch (err) {
        setError(err.message || "Không thể kết nối đến máy chủ.");
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchRoomTypes();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.room_code.trim() ||
      !form.room_number.trim() ||
      !form.room_type_id ||
      form.listed_rent === ""
    ) {
      setError("Vui lòng nhập đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Không thể thêm phòng.");
      }

      setSuccess("Thêm phòng thành công!");

      alert("Thêm phòng thành công!");

      navigate("/rooms");
    } catch (err) {
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    marginBottom: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "15px",
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "30px auto",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/rooms")}
        style={{
          padding: "9px 14px",
          marginBottom: "15px",
          cursor: "pointer",
        }}
      >
        ← Quay lại danh sách phòng
      </button>

      <h1>THÊM PHÒNG MỚI</h1>
      <p>Nhập thông tin phòng cần thêm vào hệ thống.</p>

      {error && (
        <div style={{ color: "#b91c1c", marginBottom: "15px" }}>{error}</div>
      )}

      {success && (
        <div style={{ color: "#15803d", marginBottom: "15px" }}>
          {success}
          <br />
          <button
            type="button"
            onClick={() => navigate("/rooms")}
            style={{ marginTop: "10px", cursor: "pointer" }}
          >
            Xem danh sách phòng
          </button>
        </div>
      )}

      {loadingTypes ? (
        <p>Đang tải danh sách loại phòng...</p>
      ) : roomTypes.length === 0 ? (
        <p style={{ color: "#b91c1c" }}>
          Không tải được loại phòng hoặc chưa có loại phòng trong hệ thống. Bạn
          hãy kiểm tra kết nối API trước khi thêm phòng.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Mã phòng <span style={{ color: "red" }}>*</span>
          </label>
          <input
            style={inputStyle}
            name="room_code"
            value={form.room_code}
            onChange={handleChange}
            placeholder="Ví dụ: P103"
            maxLength={30}
            required
          />

          <label>
            Số phòng <span style={{ color: "red" }}>*</span>
          </label>
          <input
            style={inputStyle}
            name="room_number"
            value={form.room_number}
            onChange={handleChange}
            placeholder="Ví dụ: 103"
            maxLength={30}
            required
          />

          <label>
            Loại phòng <span style={{ color: "red" }}>*</span>
          </label>
          <select
            style={inputStyle}
            name="room_type_id"
            value={form.room_type_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn loại phòng --</option>
            {roomTypes.map((type) => (
              <option key={type.room_type_id} value={type.room_type_id}>
                {type.type_code} - {type.type_name}
              </option>
            ))}
          </select>

          <label>Diện tích (m²)</label>
          <input
            style={inputStyle}
            type="number"
            name="area_m2"
            value={form.area_m2}
            onChange={handleChange}
            placeholder="Ví dụ: 20"
            min="0.01"
            step="0.01"
          />

          <label>
            Giá thuê mỗi tháng (VNĐ) <span style={{ color: "red" }}>*</span>
          </label>
          <input
            style={inputStyle}
            type="number"
            name="listed_rent"
            value={form.listed_rent}
            onChange={handleChange}
            placeholder="Ví dụ: 1500000"
            min="0"
            step="1"
            required
          />

          <label>Mô tả phòng</label>
          <textarea
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Mô tả tiện nghi và đặc điểm của phòng..."
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 20px",
              backgroundColor: submitting ? "#999" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "16px",
            }}
          >
            {submitting ? "Đang lưu..." : "Lưu phòng"}
          </button>
        </form>
      )}
    </div>
  );
}

export default AddRoom;
