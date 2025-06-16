// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import VoteStartPage from "./pages/VoteStartPage"; // 🆕 고양이/강아지 선택 페이지
import VotePage from "./pages/VotePage"; // 🆕 실제 투표 진행 페이지 (mode 포함)
import AdminPage from "./pages/AdminPage";
import BroadcastPage from "./pages/BroadcastPage";

import { isMobileDevice } from "./utils/isMobile";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 최초 접속 시 모바일이면 /vote, PC면 /admin */}
        <Route
          path="/"
          element={
            isMobileDevice() ? (
              <Navigate to="/vote" replace />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />

        {/* 🟡 투표자 라우팅 */}
        <Route path="/vote" element={<VoteStartPage />} />
        <Route path="/vote/:mode" element={<VotePage />} />

        {/* 🟢 관리자 라우팅 */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:mode" element={<BroadcastPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
