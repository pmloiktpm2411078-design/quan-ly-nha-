async function writeAuditLog(connection, req, entry) {
  const {
    userId,
    actionType,
    tableName,
    recordId,
    oldData = null,
    newData = null,
    description,
  } = entry;

  await connection.execute(
    `INSERT INTO audit_logs
       (user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      actionType,
      tableName,
      recordId,
      oldData === null ? null : JSON.stringify(oldData),
      newData === null ? null : JSON.stringify(newData),
      description,
      req.ip || null,
    ],
  );
}

module.exports = writeAuditLog;
