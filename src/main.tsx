// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import VoteStartPage from "./pages/VoteStartPage";
import VotePage from "./pages/VotePage";
import AdminPage from "./pages/AdminPage";
import BroadcastPage from "./pages/BroadcastPage";
import AdminLoginPage from "./pages/AdminLoginPage"; // 🔐 로그인 페이지 추가
import AdminRoute from "./routes/AdminRoute"; // 🔐 보호 라우트

import { isMobileDevice } from "./utils/isMobile";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ⛳ 초기 접속: 기기 따라 자동 라우팅 */}
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

        {/* 🟡 투표자용 라우팅 */}
        <Route path="/vote" element={<VoteStartPage />} />
        <Route path="/vote/:mode" element={<VotePage />} />

        {/* 🔐 관리자 로그인 페이지 */}
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* 🛡️ 관리자 보호 라우팅 */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/:mode"
          element={
            <AdminRoute>
              <BroadcastPage />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
