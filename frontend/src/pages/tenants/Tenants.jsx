import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Tenants.css";

const API_URL = "http://localhost:3000/api/tenants";

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const birthDateRef = useRef(null);
  const pendingCursorRef = useRef(null);

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    identity_number: "",
    phone: "",
    address: "",
    contact_info: "",
  });

  function getToken() {
    return localStorage.getItem("token");
  }

  // Chuyển dd/mm/yyyy thành yyyy-mm-dd và kiểm tra ngày hợp lệ
  function convertDateToSQL(value) {
    if (!value || !value.trim()) {
      throw new Error("Vui lòng nhập ngày sinh.");
    }

    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
      throw new Error(
        "Ngày sinh phải có đủ ngày, tháng và năm theo dạng dd/mm/yyyy.",
      );
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error("Ngày sinh không hợp lệ.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      throw new Error("Ngày sinh không được lớn hơn ngày hiện tại.");
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Tải danh sách người thuê
  async function loadTenants(search = "") {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const params = new URLSearchParams({ keyword: search });

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể tải danh sách người thuê.",
        );
      }

      setTenants(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  // Khôi phục vị trí con trỏ sau khi React cập nhật ô ngày sinh
  useEffect(() => {
    if (pendingCursorRef.current === null) return;

    const position = pendingCursorRef.current;
    pendingCursorRef.current = null;

    const input = birthDateRef.current;

    if (input) {
      input.focus();
      input.setSelectionRange(position, position);
    }
  }, [form.date_of_birth]);

  function handleSearch(event) {
    event.preventDefault();
    loadTenants(keyword.trim());
  }

  function resetForm() {
    setForm({
      full_name: "",
      date_of_birth: "",
      identity_number: "",
      phone: "",
      address: "",
      contact_info: "",
    });
  }

  function handleEdit(tenant) {
    setAdding(false);
    setEditingId(tenant.tenant_id);

    setForm({
      full_name: tenant.full_name || "",
      date_of_birth: formatDateInput(tenant.date_of_birth),
      identity_number: tenant.identity_number || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      contact_info: tenant.contact_info || "",
    });

    setError("");
    setSuccess("");
  }

  function handleAdd() {
    setEditingId(null);
    resetForm();
    setError("");
    setSuccess("");
    setAdding(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    resetForm();
    setError("");
  }

  // Tự thêm dấu / và giữ vị trí con trỏ
  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "date_of_birth") {
      const input = event.target;
      const oldPosition = input.selectionStart ?? value.length;

      // Số chữ số nằm trước con trỏ trong nội dung cũ
      const digitsBeforeCursor = value
        .slice(0, oldPosition)
        .replace(/\D/g, "").length;

      // Chỉ cho phép nhập tối đa 8 chữ số: ddmmyyyy
      const digits = value.replace(/\D/g, "").slice(0, 8);

      let formatted = "";

      if (digits.length > 0) {
        formatted = digits.slice(0, 2);
      }

      if (digits.length > 2) {
        formatted += "/" + digits.slice(2, 4);
      }

      if (digits.length > 4) {
        formatted += "/" + digits.slice(4, 8);
      }

      // Xác định vị trí con trỏ mới dựa trên số chữ số đã nhập
      let newPosition = 0;
      let digitCount = 0;

      while (
        newPosition < formatted.length &&
        digitCount < digitsBeforeCursor
      ) {
        if (/\d/.test(formatted[newPosition])) {
          digitCount++;
        }

        newPosition++;
      }

      // Khi nhập đủ ngày hoặc tháng, đặt con trỏ sau dấu /
      if (digitsBeforeCursor === 2 && digits.length >= 2) {
        newPosition = 3;
      } else if (digitsBeforeCursor === 4 && digits.length >= 4) {
        newPosition = 6;
      }

      pendingCursorRef.current = newPosition;

      setForm((previous) => ({
        ...previous,
        date_of_birth: formatted,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Enter chuyển sang phần tiếp theo khi đã nhập đủ chữ số
  function handleBirthDateKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const input = event.currentTarget;
    const value = input.value;
    const digits = value.replace(/\D/g, "");

    if (digits.length === 2) {
      const day = digits.slice(0, 2);

      pendingCursorRef.current = 3;

      setForm((previous) => ({
        ...previous,
        date_of_birth: day + "/",
      }));

      return;
    }

    if (digits.length === 4) {
      const day = digits.slice(0, 2);
      const month = digits.slice(2, 4);

      pendingCursorRef.current = 6;

      setForm((previous) => ({
        ...previous,
        date_of_birth: day + "/" + month + "/",
      }));
    }
  }

  // Kiểm tra các trường bắt buộc
  function validateForm() {
    const fullName = form.full_name.trim();
    const birthDate = form.date_of_birth.trim();
    const identityNumber = form.identity_number.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!fullName) {
      throw new Error("Vui lòng nhập họ và tên người thuê.");
    }

    if (!birthDate) {
      throw new Error("Vui lòng nhập ngày sinh.");
    }

    if (!identityNumber) {
      throw new Error("Vui lòng nhập số CCCD/CMND.");
    }

    if (!phone) {
      throw new Error("Vui lòng nhập số điện thoại.");
    }

    if (!address) {
      throw new Error("Vui lòng nhập địa chỉ.");
    }

    if (!/^0[0-9]{9}$/.test(phone)) {
      throw new Error("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.");
    }

    if (!/^[0-9]{9,12}$/.test(identityNumber)) {
      throw new Error("CCCD/CMND phải gồm từ 9 đến 12 chữ số.");
    }

    return {
      full_name: fullName,
      date_of_birth: convertDateToSQL(birthDate),
      identity_number: identityNumber,
      phone,
      address,
      contact_info: form.contact_info.trim() || null,
    };
  }

  // Gửi yêu cầu lên backend
  async function sendTenantRequest(url, method, data) {
    const token = getToken();

    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          (method === "POST"
            ? "Thêm người thuê thất bại."
            : "Cập nhật người thuê thất bại."),
      );
    }

    return result;
  }

  // Thêm người thuê
  async function handleAddSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    let data;

    try {
      data = validateForm();
    } catch (err) {
      setError(err.message);
      return;
    }

    try {
      setSaving(true);

      await sendTenantRequest(API_URL, "POST", data);

      setAdding(false);
      resetForm();
      setSuccess("Thêm người thuê thành công!");

      await loadTenants(keyword.trim());
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi thêm người thuê.");
    } finally {
      setSaving(false);
    }
  }

  // Lưu chỉnh sửa
  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    let data;

    try {
      data = validateForm();
    } catch (err) {
      setError(err.message);
      return;
    }

    try {
      setSaving(true);

      await sendTenantRequest(`${API_URL}/${editingId}`, "PUT", data);

      setEditingId(null);
      setSuccess("Cập nhật người thuê thành công!");

      await loadTenants(keyword.trim());
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi cập nhật.");
    } finally {
      setSaving(false);
    }
  }

  // Ô nhập ngày sinh dùng chung cho cả thêm và sửa
  function birthDateInput() {
    return (
      <div className="tenant-edit-field">
        <label>Ngày sinh *</label>
        <input
          ref={birthDateRef}
          type="text"
          name="date_of_birth"
          placeholder="dd/mm/yyyy"
          maxLength={10}
          value={form.date_of_birth}
          onChange={handleChange}
          onKeyDown={handleBirthDateKeyDown}
          required
          autoComplete="off"
          inputMode="numeric"
        />
      </div>
    );
  }

  return (
    <div className="tenants-page">
      <header className="tenants-header">
        <div>
          <h1>Quản lý người thuê</h1>
          <p>Quản lý thông tin người thuê tại nhà trọ.</p>
        </div>

        <Link to="/dashboard" className="tenants-back-button">
          ← Quay lại trang chủ
        </Link>
      </header>

      <section className="tenants-panel">
        <div className="tenants-toolbar">
          <form onSubmit={handleSearch} className="tenants-search">
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo họ tên, số điện thoại hoặc CCCD..."
              aria-label="Tìm kiếm người thuê"
            />

            <button type="submit">Tìm kiếm</button>

            <button
              type="button"
              className="tenants-reset-button"
              onClick={() => {
                setKeyword("");
                loadTenants("");
              }}
            >
              Làm mới
            </button>

            <button type="button" onClick={handleAdd}>
              + Thêm người thuê
            </button>
          </form>
        </div>

        {error && (
          <div className="tenants-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="tenants-success" role="status">
            {success}
          </div>
        )}

        {/* Biểu mẫu chỉnh sửa */}
        {editingId !== null && (
          <div className="tenant-edit-panel">
            <h2>Chỉnh sửa người thuê</h2>

            <form onSubmit={handleSave}>
              <div className="tenant-edit-grid">
                <div className="tenant-edit-field">
                  <label>Họ và tên *</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {birthDateInput()}

                <div className="tenant-edit-field">
                  <label>CCCD/CMND *</label>
                  <input
                    name="identity_number"
                    value={form.identity_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Số điện thoại *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Địa chỉ *</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Thông tin liên hệ</label>
                  <input
                    name="contact_info"
                    value={form.contact_info}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Hủy
              </button>
            </form>
          </div>
        )}

        {/* Biểu mẫu thêm người thuê */}
        {adding && (
          <div className="tenant-edit-panel">
            <h2>Thêm người thuê mới</h2>

            <form onSubmit={handleAddSave}>
              <div className="tenant-edit-grid">
                <div className="tenant-edit-field">
                  <label>Họ và tên *</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {birthDateInput()}

                <div className="tenant-edit-field">
                  <label>CCCD/CMND *</label>
                  <input
                    name="identity_number"
                    value={form.identity_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Số điện thoại *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Địa chỉ *</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tenant-edit-field">
                  <label>Thông tin liên hệ</label>
                  <input
                    name="contact_info"
                    value={form.contact_info}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Đang thêm..." : "Thêm người thuê"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  resetForm();
                  setError("");
                }}
                disabled={saving}
              >
                Hủy
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="tenants-message">Đang tải danh sách người thuê...</p>
        ) : (
          <>
            <div className="tenants-summary">
              Tổng số người thuê: <strong>{tenants.length}</strong>
            </div>

            <div className="tenants-table-wrapper">
              <table className="tenants-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và tên</th>
                    <th>Ngày sinh</th>
                    <th>CCCD</th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th>Thông tin liên hệ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {tenants.length > 0 ? (
                    tenants.map((tenant, index) => (
                      <tr key={tenant.tenant_id}>
                        <td>{index + 1}</td>
                        <td>{tenant.full_name}</td>
                        <td>{formatDate(tenant.date_of_birth)}</td>
                        <td>{tenant.identity_number || "—"}</td>
                        <td>{tenant.phone || "—"}</td>
                        <td>{tenant.address || "—"}</td>
                        <td>{tenant.contact_info || "—"}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleEdit(tenant)}
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="tenants-empty">
                        Không tìm thấy người thuê nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Định dạng ngày để nhập vào biểu mẫu dd/mm/yyyy
function formatDateInput(value) {
  if (!value) return "";

  const date = String(value).slice(0, 10);
  const sqlMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (sqlMatch) {
    return `${sqlMatch[3]}/${sqlMatch[2]}/${sqlMatch[1]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }

  return "";
}

// Định dạng ngày để hiển thị trong bảng
function formatDate(value) {
  if (!value) return "—";

  const date = String(value).slice(0, 10);
  const sqlMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (sqlMatch) {
    return `${sqlMatch[3]}/${sqlMatch[2]}/${sqlMatch[1]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }

  return date;
}

export default Tenants;
