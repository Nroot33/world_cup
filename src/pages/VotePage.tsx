import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./VotePage.css"; // 외부 CSS로 관리

interface Candidate {
  id: string;
  title: string;
  imageUrl: string;
  artist?: string;
}

interface MatchInfo {
  matchNumber: number;
  candidates: Candidate[];
}

export default function VoterPage() {
  const { mode } = useParams(); // 'cat' or 'dog'
  const navigate = useNavigate();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const voterIdRef = useRef("");

  // ✅ UUID 준비 (localStorage)
  useEffect(() => {
    if (!mode) return;

    const storageKey = `voter_uuid_${mode}`;
    let saved = localStorage.getItem(storageKey);

    if (!saved) {
      const shortId = uuidv4().replace(/-/g, "").slice(0, 8);
      saved = `voter_${mode}_${shortId}`;
      localStorage.setItem(storageKey, saved);
    }

    voterIdRef.current = saved;
  }, [mode]);

  // ✅ WebSocket 연결
  useEffect(() => {
    if (!voterIdRef.current || !mode) return;

    const ws = new WebSocket("ws://13.209.65.222:8080");
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "REGISTER",
          role: "voter",
          voterId: voterIdRef.current,
          mode,
        })
      );
    };
    setSocket(ws);

    return () => ws.close();
  }, [mode]);

  // ✅ WebSocket 메시지 수신
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_MATCH") {
        setMatch({
          matchNumber: data.matchNumber,
          candidates: data.candidates,
        });
      }
    };
  }, [socket]);

  // ✅ 투표 처리
  async function handleVote(selectedId: string) {
    if (!socket || !match || !mode) return;

    // WebSocket: 중계자에게 전송
    socket.send(
      JSON.stringify({
        type: "VOTE",
        voterId: voterIdRef.current,
        matchNumber: match.matchNumber,
        selectedId,
      })
    );

    // REST API: 서버에 투표 저장
    try {
      const response = await fetch("http://13.209.65.222:8080/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId: voterIdRef.current,
          matchNumber: match.matchNumber,
          selectedCandidateId: selectedId,
          mode,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(`⚠️ 투표 실패: ${result.message}`);
      } else {
        console.log("✅ 투표 성공");
        setMatch(null); // 투표 완료 → 대기 화면
      }
    } catch (err) {
      console.error("❌ 투표 전송 실패:", err);
      alert("서버 오류로 투표에 실패했습니다.");
    }
  }

  // ✅ 뒤로가기 버튼 처리
  function handleBack() {
    const storageKey = `voter_uuid_${mode}`;
    localStorage.removeItem(storageKey);
    socket?.close();
    navigate("/vote");
  }

  return (
    <div className="vote-page">
      <h2 className="vote-title">
        {mode === "cat" ? "🐱 고양이 월드컵" : "🐶 강아지 월드컵"}
      </h2>

      <p className="voter-id">
        🆔 : <code>{voterIdRef.current}</code>
      </p>

      {match ? (
        <div className="match-section">
          <h3 className="match-title">📡 {match.matchNumber}번째 대결</h3>

          <div className="horizontal-vote-box">
            {match.candidates.map((cat) => (
              <button
                key={cat.id}
                className="horizontal-vote-button"
                onClick={() => handleVote(cat.id)}
              >
                <div className="button-title">{cat.title}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="waiting-message">⏳ 대기 중입니다...</p>
      )}

      <button className="back-button" onClick={handleBack}>
        ⬅ 뒤로가기
      </button>
    </div>
  );
}
