import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./BroadcastPage.css";
export default function BroadcastPage() {
  const { mode } = useParams();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState("접속 안 됨");
  const [items, setItems] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[][][]>([]); // 경기 정보 형식: [ [ [a,b], [c,d] ], [ [e,f], [g,h] ] ]
  const [roundIndex, setRoundIndex] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [voterCount, setVoterCount] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [roundWinners, setRoundWinners] = useState<string[][]>([]);

  const title = mode === "cat" ? "🐱 냥냥이 월드컵" : "🐶 댕댕이 월드컵";
  const timestamp = Date.now();
  const jsonUrl = `https://catworldcup.s3.ap-northeast-2.amazonaws.com/${mode}worldcup.json?ts=${timestamp}`;

  useEffect(() => {
    const ws = new WebSocket("ws://13.209.65.222:8080");
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "REGISTER",
          role: "broadcaster",
          broadcasterId: `broadcaster_${mode}`,
          mode,
        })
      );
      setStatus(`✅ ${title} 중계 등록 완료`);
    };
    // ✅ WebSocket 메시지 수신 추가 (기존 useEffect 안에)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log(data);

      if (data.type === "STATUS_UPDATE" && data.mode === mode) {
        setVoterCount(data.voterCount);
      }

      if (data.type === "ROUND_PROGRESS" && data.mode === mode) {
        console.log(data);
        setVotedCount(data.votedCount);
      }

      // ✅ 새로운 투표자가 등록되면 현재 매치를 다시 보냄
      if (
        data.type === "NEXT_MATCH_READY" &&
        hasStarted &&
        rounds[roundIndex]?.[matchIndex]
      ) {
        sendMatch(
          rounds[roundIndex][matchIndex],
          roundIndex * 100 + matchIndex + 1
        );
      }
    };

    ws.onerror = () => setStatus("❌ WebSocket 오류 발생");
    setSocket(ws);
    return () => ws.close();
  }, [mode]);

  useEffect(() => {
    fetch(jsonUrl)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => setStatus("❌ 데이터 로딩 실패"));
  }, [jsonUrl]);

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  function buildRounds(list: any[]): any[][][] {
    const rounds = [];
    let current = [...list];
    while (current.length > 1) {
      const pairs = [];
      for (let i = 0; i < current.length; i += 2) {
        pairs.push([current[i], current[i + 1]]);
      }
      rounds.push(pairs);
      current = pairs.map(() => null); // 결과 통화 이후 바꾸기
    }
    return rounds;
  }

  function startWorldCup() {
    const shuffled = shuffle(items);
    const testItems = shuffled.slice(0, 8); // ⬅️ 여기만 수정하면 됨

    const allRounds = buildRounds(testItems);
    setRounds(allRounds);
    setRoundIndex(0);
    setMatchIndex(0);
    setHasStarted(true);
    setWinnerData(null);
    sendMatch(allRounds[0][0], 1);
  }

  function sendMatch(pair: any[], matchNumber: number) {
    if (!socket) return;
    setVotedCount(0);
    setWinnerData(null);

    socket.send(
      JSON.stringify({
        type: "NEW_MATCH",
        mode, // ✅ 누락된 mode를 반드시 포함
        matchNumber,
        candidates: pair.map((c) => ({
          id: c.id,
          title: c.title,
          imageUrl: c.imageUrl,
          artist: c.artist,
        })),
      })
    );
  }

  async function showResult() {
    try {
      const res = await fetch(
        `http://13.209.65.222:8080/api/winner/${mode}/${
          roundIndex * 100 + matchIndex + 1
        }`
      );
      const json = await res.json();
      setWinnerData(json);

      // ✅ 현재 라운드 승자 저장
      setRoundWinners((prev) => {
        const updated = [...prev];
        updated[roundIndex] = [...(updated[roundIndex] || [])];
        updated[roundIndex][matchIndex] = json.winnerId;
        return updated;
      });
    } catch (err) {
      console.error("❌ 결과 가져오기 실패:", err);
      setStatus("❌ 결과 불러오기 실패");
    }
  }

  function goToNextMatch() {
    const currentRound = rounds[roundIndex];
    const nextMatchIndex = matchIndex + 1;

    if (nextMatchIndex < currentRound.length) {
      setMatchIndex(nextMatchIndex);
      sendMatch(
        currentRound[nextMatchIndex],
        roundIndex * 100 + nextMatchIndex + 1
      );
    } else {
      const winners = roundWinners[roundIndex] || [];
      if (winners.length !== currentRound.length) {
        setStatus("⚠️ 모든 경기 결과를 확인해주세요");
        return;
      }

      if (roundIndex + 1 < rounds.length) {
        const nextPairs = [];
        for (let i = 0; i < winners.length; i += 2) {
          const a = currentRound[i]?.find((c: any) => c.id === winners[i]);
          const b = currentRound[i + 1]?.find(
            (c: any) => c.id === winners[i + 1]
          );
          if (!a || !b) {
            console.warn("🚨 다음 라운드 후보 구성 실패", a, b);
            continue;
          }
          nextPairs.push([a, b]);
        }

        const newRounds = [...rounds];
        newRounds[roundIndex + 1] = nextPairs;
        setRounds(newRounds);
        setRoundIndex(roundIndex + 1);
        setMatchIndex(0);
        setWinnerData(null);
        sendMatch(nextPairs[0], (roundIndex + 1) * 100 + 1);
      } else {
        setStatus("🏁 모든 라운드 종료!");
      }
    }
  }

  const currentPair = rounds[roundIndex]?.[matchIndex] || [];
  const votePercent = voterCount
    ? Math.round((votedCount / voterCount) * 100)
    : 0;

  return (
    <div
      className={mode === "cat" ? `broadcast-cat-page` : `broadcast-dog-page`}
    >
      <h2 className="broadcast-title">
        {mode === "cat" ? `냥 냥 이 월 드 컵` : `댕 댕 이 월 드 컵`}
      </h2>
      <div className="broadcast-main">
        {winnerData && rounds.length - 1 === roundIndex ? (
          <div>
            <h2>🎉 우승자</h2>
            <div
              style={{
                textAlign: "center",
                border: "6px solid gold",
                padding: 10,
                borderRadius: 16,
                width: 240,
                margin: "0 auto",
              }}
            >
              <img
                src={
                  currentPair.find((c) => c.id === winnerData.winnerId)
                    ?.imageUrl
                }
                alt="우승자"
                style={{ width: "100%", borderRadius: 12 }}
              />
              <h3>
                {currentPair.find((c) => c.id === winnerData.winnerId)?.title}
              </h3>
              <p>
                {currentPair.find((c) => c.id === winnerData.winnerId)?.artist}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="match-candidates">
              {hasStarted && currentPair.length === 2 && (
                <div
                  className={
                    "candidate-card" +
                    (winnerData?.winnerId === currentPair[0].id
                      ? " winner"
                      : "")
                  }
                >
                  <img
                    src={currentPair[0].imageUrl}
                    alt={currentPair[0].title}
                  />

                  <h3>{currentPair[0].title}</h3>
                  <p>{currentPair[0].artist}</p>

                  {winnerData && (
                    <p style={{ fontWeight: "bold" }}>
                      {(
                        (Number(winnerData.allVotes?.[currentPair[0].id] ?? 0) /
                          ((
                            Object.values(winnerData.allVotes || {}) as number[]
                          ).reduce((a, b) => a + b, 0) || 1)) *
                        100
                      ).toFixed(0)}
                      % 투표
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="broadcast-status-card">
              <p className="broadcast-status">{status}</p>
              <p className="broadcast-progress">👥 참여인원: {voterCount} 명</p>
              <p className="broadcast-progress">
                {hasStarted ? (
                  <>
                    🎯{" "}
                    {rounds[roundIndex]?.length === 1
                      ? "결승전"
                      : `${rounds[roundIndex]?.length * 2}강 ${
                          matchIndex + 1
                        }라운드`}{" "}
                    - {votedCount}/{voterCount} ({votePercent}%)
                  </>
                ) : (
                  <>⚙️ 월드컵 준비 중...</>
                )}
              </p>
              <p>
                투표율 {votedCount}/{voterCount} ({votePercent}%)
              </p>

              {!hasStarted && (
                <div className="broadcast-controls">
                  <button onClick={startWorldCup} className="start-btn">
                    🚀 시작하기
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="back-btn"
                  >
                    ⬅️ 돌아가기
                  </button>
                </div>
              )}

              {!winnerData && hasStarted && (
                <button onClick={showResult} className="result-btn">
                  🏆 결과 보기
                </button>
              )}

              {winnerData && rounds.length - 1 !== roundIndex && (
                <button className="next-btn" onClick={goToNextMatch}>
                  ⏭️ 다음 라운드
                </button>
              )}
            </div>
            <div className="match-candidates">
              {hasStarted && currentPair.length === 2 && (
                <div
                  className={
                    "candidate-card" +
                    (winnerData?.winnerId === currentPair[1].id
                      ? " winner"
                      : "")
                  }
                >
                  <img
                    src={currentPair[1].imageUrl}
                    alt={currentPair[1].title}
                  />

                  <h3>{currentPair[1].title}</h3>
                  <p>{currentPair[1].artist}</p>

                  {winnerData && (
                    <p style={{ fontWeight: "bold" }}>
                      {(
                        (Number(winnerData.allVotes?.[currentPair[1].id] ?? 0) /
                          ((
                            Object.values(winnerData.allVotes || {}) as number[]
                          ).reduce((a, b) => a + b, 0) || 1)) *
                        100
                      ).toFixed(0)}
                      % 투표
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
