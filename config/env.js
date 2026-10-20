const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "khoa_bi_mat_cua_he_thong_nha_tro",
};
