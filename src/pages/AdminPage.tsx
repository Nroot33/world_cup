// src/pages/AdminPage.tsx
import { useNavigate } from "react-router-dom";
import "./AdminPage.css"; // ✅ CSS 따로 분리

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-container">
      <div className="admin-title" />

      <div className="admin-button-group">
        <button
          className="admin-button cat"
          onClick={() => navigate("/admin/cat")}
        >
          🐱 고양이 월드컵
        </button>
        <button
          className="admin-button dog"
          onClick={() => navigate("/admin/dog")}
        >
          🐶 강아지 월드컵
        </button>
      </div>
    </div>
  );
}
