data.xlsx – file Excel chứa dữ liệu

public/index.html – giao diện frontend

server.js – server backend đọc file Excel và xử lý tìm kiếm


https://nodejs.org/en







npm install -g cloudflared
cd ten-repo
npm install



node server.js
cloudflared login
cloudflared tunnel --url http://localhost:3000
