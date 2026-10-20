const express = require("express");
const cors = require("cors");
const roomsRouter = require("./routes/rooms");
const tenantsRouter = require("./routes/tenants");
const holdsRouter = require("./routes/holds");
const authRouter = require("./routes/auth");
const roomTypesRouter = require("./routes/roomTypes");
const auditLogsRouter = require("./routes/auditLogs");
const roomTypePricesRouter = require("./routes/roomTypePrices");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", authRouter);
app.use("/api/room-types", roomTypesRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/holds", holdsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/room-type-prices", roomTypePricesRouter);

// Khởi chạy server

app.listen(3000, () => {
  console.log("Server đang chạy tại: http://localhost:3000");
});
