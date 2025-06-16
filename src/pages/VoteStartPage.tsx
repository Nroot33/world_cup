import { useNavigate } from "react-router-dom";
import "./VoteStartPage.css"; // 외부 CSS 파일 분리 (아래 작성)

export default function VoteStartPage() {
  const navigate = useNavigate();

  return (
    <div className="vote-start-container">
      <h2 className="vote-title">
        월드컵 모드를 <br />
        선택해주세요
      </h2>
      <div className="vote-button-group">
        <button
          onClick={() => navigate("/vote/cat")}
          className="vote-button cat"
        >
          🐱 고양이 월드컵
        </button>
        <button
          onClick={() => navigate("/vote/dog")}
          className="vote-button dog"
        >
          🐶 강아지 월드컵
        </button>
      </div>
    </div>
  );
}
