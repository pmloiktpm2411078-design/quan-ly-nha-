import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditRoom() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Lấy thông tin phòng và danh sách loại phòng
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const [roomResponse, typesResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/rooms/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3000/api/room-types", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const roomResult = await roomResponse.json();
        const typesResult = await typesResponse.json();

        if (!roomResponse.ok) {
          throw new Error(
            roomResult.message || "Không thể lấy thông tin phòng.",
          );
        }

        if (!typesResponse.ok) {
          throw new Error(
            typesResult.message || "Không thể lấy danh sách loại phòng.",
          );
        }

        const room = roomResult.data;

        setForm({
          room_code: room.room_code || "",
          room_number: room.room_number || "",
          room_type_id: String(room.room_type_id || ""),
          area_m2: room.area_m2 ?? "",
          listed_rent: room.listed_rent ?? "",
          description: room.description || "",
        });

        setRoomTypes(typesResult.data || []);
      } catch (err) {
        setError(err.message || "Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Cập nhật dữ liệu khi người dùng nhập
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Lưu thông tin phòng đã chỉnh sửa
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:3000/api/rooms/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể cập nhật thông tin phòng.",
        );
      }

      setSuccess("Cập nhật thông tin phòng thành công!");

      setTimeout(() => {
        navigate("/rooms");
      }, 1000);
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

  if (loading) {
    return <p style={{ padding: "30px" }}>Đang tải thông tin phòng...</p>;
  }

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
        style={{ padding: "9px 14px", marginBottom: "15px" }}
      >
        ← Quay lại danh sách phòng
      </button>

      <h1>SỬA THÔNG TIN PHÒNG</h1>
      <p>Chỉnh sửa thông tin phòng và lưu thay đổi.</p>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {success && <p style={{ color: "#15803d" }}>{success}</p>}

      {!error && (
        <form onSubmit={handleSubmit}>
          <label>Mã phòng *</label>
          <input
            style={inputStyle}
            name="room_code"
            value={form.room_code}
            onChange={handleChange}
            maxLength={30}
            required
          />

          <label>Số phòng *</label>
          <input
            style={inputStyle}
            name="room_number"
            value={form.room_number}
            onChange={handleChange}
            maxLength={30}
            required
          />

          <label>Loại phòng *</label>
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
                {type.type_name}
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
            min="0.01"
            step="0.01"
          />

          <label>Giá thuê mỗi tháng (VNĐ) *</label>
          <input
            style={inputStyle}
            type="number"
            name="listed_rent"
            value={form.listed_rent}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />

          <label>Mô tả phòng</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: "100px",
              resize: "vertical",
            }}
            name="description"
            value={form.description}
            onChange={handleChange}
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
            }}
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      )}
    </div>
  );
}

export default EditRoom;
