// src/routes/AdminRoute.tsx
import React from "react"; // ✅ JSX 타입 인식 위해 추가
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const session = sessionStorage.getItem("admin-auth");

  if (session) {
    const { authenticated, expiresAt } = JSON.parse(session);
    const now = new Date().getTime();

    if (authenticated && now < expiresAt) {
      return children;
    }
  }

  return <Navigate to="/admin-login" />;
}
