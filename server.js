// === server.js ===
const express = require("express");
const cors = require("cors");
const xlsx = require("xlsx");
const axios = require("axios");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(cors());

// 🔄 Hàm tải lại file Excel từ Google Sheets và lưu về data.xlsx
async function fetchAndSaveSheet() {
  try {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1xenlH4FIlTO2ThwFYPIYrIWFNPU65hc0/export?format=xlsx"; // 🔁 Đổi ID sheet thật của đại ca
    const response = await axios.get(sheetUrl, { responseType: "arraybuffer" });
    fs.writeFileSync("data.xlsx", response.data);
    console.log("✅ Đã cập nhật dữ liệu từ Google Sheets!");
  } catch (err) {
    console.error("❌ Lỗi khi fetch sheet:", err.message);
  }
}

// 🧠 Gọi lấy sheet trước khi chạy server
fetchAndSaveSheet().then(() => {
  // Load file Excel (local)
  const workbook = xlsx.readFile("data.xlsx");
  const sheets = workbook.SheetNames;

  app.get("/search", (req, res) => {
    const keyword = (req.query.q || "").toLowerCase();
    if (keyword.length < 3) return res.json([]);

    const results = [];

    sheets.forEach(sheet => {
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: "" });

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowText = row.map(cell => String(cell || '')).join(' ').toLowerCase();
        if (rowText.includes(keyword)) {
          const columns = row.map((val, index) => ({ col: String.fromCharCode(65 + index), value: val }));
          const shownColumns = columns.filter(col => col.value !== undefined && col.value !== "");

          // Collect expandable rows for each shown column
          const expandable = {};
          shownColumns.forEach(col => {
            const colIndex = col.col.charCodeAt(0) - 65;
            const expandRows = [];
            for (let j = i + 1; j < data.length; j++) {
              const nextRow = data[j];
              if (!nextRow || (nextRow[colIndex] !== undefined && nextRow[colIndex] !== "")) break;
              if (nextRow.some(cell => cell !== undefined && cell !== "")) {
                expandRows.push({
                  rowIndex: j + 1,
                  columns: nextRow.map((val, k) => ({ col: String.fromCharCode(65 + k), value: val })).filter(c => c.value !== undefined && c.value !== "")
                });
              }
            }
            if (expandRows.length > 0) expandable[col.col] = expandRows;
          });

          results.push({
            type: "match_row",
            sheet,
            rowIndex: i + 1,
            columns: shownColumns,
            expandable
          });
        }
      }
    });

    res.json(results);
  });

  app.get("/sheets", (req, res) => {
    res.json(sheets);
  });

  app.get("/sheet-data", (req, res) => {
    const sheetName = req.query.sheet;
    if (!sheets.includes(sheetName)) return res.status(404).json({ error: "Sheet not found" });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
    res.json({ sheet: sheetName, data });
  });

  app.use(express.static("public"));

  app.listen(PORT, () => console.log(`🔥 Server chạy ở http://localhost:${PORT}`));
});
