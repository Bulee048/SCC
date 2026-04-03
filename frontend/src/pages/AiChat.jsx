import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { getAiModels, sendAiMessage } from "../services/aiService";
import "../styles/AiChat.css";
import "../styles/Dashboard.css";
import LoadingSpinner from "../components/LoadingSpinner";

const AiChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  const quickPrompts = [
    "Make a 7-day study plan for my upcoming exams.",
    "Break my assignments into daily tasks with priority.",
    "Suggest a balanced timetable for classes and revision.",
    "Give me a focus plan for today (2-3 study blocks)."
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await getAiModels();
        setModels(data.models || []);
        setSelectedModel(data.defaultModel || "");
      } catch {
        // ignore model list errors; we can still chat with backend default
      }
    };

    if (isAuthenticated) {
      loadModels();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return <LoadingSpinner text="Loading AI assistant..." />;
  }

  const handleSend = async () => {
    setError("");
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);
      const reply = await sendAiMessage({
        message: userMessage.content,
        model: selectedModel || undefined
      });
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: reply
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        handleSend();
      }
    }
  };

  return (
    <div className="db-root dashboard-page ai-chat-page">
      <div className="db-bg-gradient" />

      <div className="db-layout">
        <nav className="db-nav">
          <div className="db-nav__inner">
            <div className="db-nav__left" style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <Link to="/dashboard" className="db-brand">
                <div>
                  <div className="db-brand__name">Smart Campus Companion</div>
                </div>
              </Link>
            </div>

            <div className="db-nav__center" style={{ flex: 1 }}></div>

            <div className="db-nav__right" style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <button className="db-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} style={{ marginRight: "6px" }} />
                Back
              </button>
            </div>
          </div>
        </nav>

        <main className="db-main">
          <div className="dashboard-content">
            <div className="welcome-section fade-in">
              <div style={{ position: "relative", zIndex: 1 }}>
                <h1>Chat with your campus AI</h1>
                <p className="user-info">
                  Ask questions about study plans, time management, or anything related to your
                  university life. The AI will keep answers short and practical.
                </p>
                <div className="ai-quick-prompts">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ai-quick-prompt"
                      onClick={() => setInput(p)}
                      disabled={loading}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {models.length > 0 && (
              <div className="card fade-in" style={{ marginBottom: "1.5rem" }}>
                <div className="card-body" style={{ marginBottom: 0 }}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Model</label>
                      <select
                        className="form-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={loading}
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="card fade-in ai-chat-shell">
              <div className="card-body ai-chat-messages">
                {messages.length === 0 && (
                  <div className="empty-state">
                    <p style={{ opacity: 0.8 }}>
                      Start the conversation by telling the AI what you&apos;re working on today.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
                  >
                    <div className="chat-bubble-content">{msg.content}</div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-bubble chat-bubble-ai">
                    <div className="chat-bubble-content" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Loader2 size={16} className="spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="ai-chat-input-footer">
                <div className="form-field">
                  <textarea
                    className="form-textarea"
                    rows={1}
                    placeholder="Ask anything about your schedule, exams, or study plan..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    className="ai-chat-send-btn"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AiChat;

