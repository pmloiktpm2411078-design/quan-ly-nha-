function isValidSqlDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function validateContractInput(body = {}) {
  const contractCode = String(body.contract_code ?? "").trim();
  const tenantId = Number(body.tenant_id);
  const roomId = Number(body.room_id);
  const startDate = body.start_date;
  const endDate = body.end_date;
  const monthlyRent = Number(body.monthly_rent);
  const securityDeposit =
    body.security_deposit === undefined || body.security_deposit === ""
      ? 0
      : Number(body.security_deposit);

  if (!contractCode || contractCode.length > 50) {
    return { error: "Mã hợp đồng là bắt buộc và tối đa 50 ký tự." };
  }

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return { error: "Người thuê không hợp lệ." };
  }

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return { error: "Phòng không hợp lệ." };
  }

  if (
    !isValidSqlDate(startDate) ||
    !isValidSqlDate(endDate) ||
    endDate <= startDate
  ) {
    return {
      error: "Ngày kết thúc phải sau ngày bắt đầu và cả hai ngày phải hợp lệ.",
    };
  }

  if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    return { error: "Tiền thuê tháng phải là số lớn hơn 0." };
  }

  if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
    return { error: "Tiền cọc phải là số không âm." };
  }

  return {
    data: {
      contractCode,
      tenantId,
      roomId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
    },
  };
}
