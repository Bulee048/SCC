import React from "react";
import { useNavigate } from "react-router-dom";

function SessionEnd({ onClose }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (onClose) onClose();
    navigate("/");
  };

  return (
    <div className="session-end-modal" style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "#fff",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
        textAlign: "center"
      }}>
        <h2>Session Ended</h2>
        <p>Your session has expired due to inactivity.</p>
        <button onClick={handleGoHome} style={{
          marginTop: 16,
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 6,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer"
        }}>
          Go to Homepage
        </button>
      </div>
    </div>
  );
}

export default SessionEnd;
