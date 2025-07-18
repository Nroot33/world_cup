// src/pages/AdminLoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PASSWORD = "catdog0802"; // 👉 실제 운영에선 환경변수나 백엔드 인증으로 대체 필요

export default function AdminLoginPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (input === PASSWORD) {
      const expiresAt = new Date().getTime() + 2 * 60 * 60 * 1000; // 현재시간 + 2시간
      sessionStorage.setItem(
        "admin-auth",
        JSON.stringify({ authenticated: true, expiresAt })
      );
      navigate("/admin");
    } else {
      setError("❌ 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="admin-login">
      <h2>🔐 관리자 로그인</h2>
      <input
        type="password"
        placeholder="비밀번호 입력"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleLogin}>로그인</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
