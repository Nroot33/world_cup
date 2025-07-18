const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ CORS 추가

const app = express();
const server = http.createServer(app);

// ✅ JSON 및 CORS 처리
app.use(cors()); // ← 이거 꼭 필요
app.use(express.json());

// 📦 WebSocket 서버 연결
const wss = new WebSocket.Server({ server });

let clients = [];

// ✅ WebSocket 연결 처리
wss.on("connection", function connection(ws) {
  ws.role = null;
  ws.voterId = null;
  clients.push(ws);
  console.log("✅ 새로운 클라이언트 연결됨");

  ws.on("message", function incoming(message) {
    try {
      const data = JSON.parse(message);
      console.log("📩 받은 메시지:", data);

      if (data.type === "REGISTER") {
        // 중복 voter 제거
        if (data.role === "voter" && data.voterId) {
          clients = clients.filter((client) => {
            const isDuplicate =
              client.voterId === data.voterId && client !== ws;
            if (isDuplicate) {
              console.log(`⚠️ 중복 voter 제거됨: ${client.voterId}`);
              client.close(); // 기존 연결 종료
            }
            return !isDuplicate;
          });
        }

        ws.role = data.role === "broadcaster" ? "broadcaster" : "voter";

        if (ws.role === "voter") ws.voterId = data.voterId;
        if (ws.role === "broadcaster") ws.broadcasterId = data.broadcasterId;

        console.log(
          `🆔 역할 등록됨: ${ws.role} (ID: ${
            ws.voterId || ws.broadcasterId || "비식별"
          })`
        );
        broadcastStatus();
      }

      // 🎯 [추가] 중계자의 NEW_MATCH 메시지 처리
      if (data.type === "NEW_MATCH" && ws.role === "broadcaster") {
        broadcastToVoters({
          type: "NEW_MATCH",
          matchNumber: data.matchNumber,
          candidates: data.candidates,
        });
        console.log(`🚀 NEW_MATCH 라운드 ${data.matchNumber} 전송됨`);
      }

      if (data.type === "NEXT_MATCH_READY") {
        broadcastAll({ type: "NEXT_MATCH_READY" });
      }
    } catch (e) {
      console.error("⚠️ JSON 파싱 실패:", e);
    }
  });

  ws.on("close", () => {
    console.log("❌ 클라이언트 연결 종료");
    clients = clients.filter((client) => client !== ws);
    broadcastStatus();
  });
});

// 📡 브로드캐스트 전송
function broadcastAll(data) {
  const json = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// 📡 voter 전용 브로드캐스트 함수
function broadcastToVoters(data) {
  const json = JSON.stringify(data);
  const voters = clients.filter(
    (c) => c.readyState === WebSocket.OPEN && c.role === "voter"
  );
  console.log(`📡 브로드캐스트 대상 voter 수: ${voters.length}`);

  voters.forEach((client) => {
    console.log(`📤 voter에게 전송 중...`);
    client.send(json);
  });
}

// 👥 접속자 수 갱신
function broadcastStatus() {
  const voterCount = clients.filter((c) => c.role === "voter").length;
  const broadcasterCount = clients.filter(
    (c) => c.role === "broadcaster"
  ).length;

  const statusMsg = {
    type: "STATUS_UPDATE",
    voterCount,
    broadcasterCount,
  };

  broadcastAll(statusMsg);
}

// server.js
setInterval(() => {
  clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      clients = clients.filter((c) => c !== client);
    }
  });
  broadcastStatus(); // 항상 최신 접속자 수 반영
}, 5000);

// ✅ 투표 API 라우터 추가
app.post("/api/vote", (req, res) => {
  const { voterId, matchNumber, selectedCandidateId } = req.body;

  console.log(
    `🗳️ 투표 수신 → Voter: ${voterId}, Match: ${matchNumber}, Selected: ${selectedCandidateId}`
  );

  // 🛠️ 여기서 DB 저장 또는 로깅 처리 가능
  // 예: voteLog.push({ voterId, matchNumber, selectedCandidateId });

  // 💬 투표 완료 시점에서 클라이언트 대기화면 진입용 별도 전송은 필요 없음
  res.status(200).json({ success: true });
});

// 🌐 서버 시작
const PORT = 8080;
// 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 서버 실행 중 ");
});
