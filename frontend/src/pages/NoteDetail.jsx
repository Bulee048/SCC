import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Tag,
  Calendar,
  BookOpen,
  Send,
  User,
  ChevronRight,
} from "lucide-react";
import {
  reactToNoteAction,
  fetchCommentsAction,
  addCommentAction,
  fetchNotes,
} from "../features/notes/notesSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import "../styles/Notes.css";

const NoteDetail = () => {
  const { noteId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notes, comments, commentsLoading } = useSelector(
    (state) => state.notes
  );

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const note = notes.find((n) => n._id === noteId);
  const noteComments = comments[noteId] || [];

  useEffect(() => {
    if (!note) {
      dispatch(fetchNotes({}));
    }
    dispatch(fetchCommentsAction({ noteId }));
  }, [dispatch, noteId, note]);

  const handleReaction = (type) => {
    dispatch(reactToNoteAction({ noteId, type }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await dispatch(addCommentAction({ noteId, commentText: commentText.trim() }));
    setCommentText("");
    setSubmitting(false);
  };

  if (!note) {
    return (
      <div className="notes-page">
        <header className="notes-header">
          <div className="notes-header-left">
            <button onClick={() => navigate("/notes")} className="back-btn">
              <ArrowLeft size={20} />
            </button>
            <h1>Note Details</h1>
          </div>
        </header>
        <LoadingSpinner text="Loading note..." />
      </div>
    );
  }

  const authorName = note.userId?.name || "Anonymous";
  const authorDept = note.userId?.department || "";
  const authorEmail = note.userId?.email || "";
  const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="notes-page">
      {/* Decorative Background: Profile-style Orbs */}
      <div className="pr-canvas" />

      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link to="/dashboard" className="dashboard-logo">
            <span className="dashboard-logo__text">Neural Nexus</span>
          </Link>
          <div className="dashboard-actions">
            <NotificationBell />
            <button
              className="dashboard-profile-btn"
              onClick={() => navigate("/profile")}
            >
              <span className="dashboard-avatar">
                {user?.name?.charAt(0) || "U"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="notes-container">
        {/* Top Bar / Breadcrumbs */}
        <div className="pr-topbar">
          <div className="pr-topbar__left">
            <button className="pr-back-btn" onClick={() => navigate("/notes")} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div className="pr-topbar__breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <ChevronRight size={16} style={{ color: 'var(--n-text-muted)' }} />
              <Link to="/notes">Notes</Link>
              <ChevronRight size={16} style={{ color: 'var(--n-text-muted)' }} />
              <span className="pr-topbar__page">{note.title}</span>
            </div>
          </div>
          <div className="pr-topbar__meta">
            <span>Published on {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="note-detail-card" style={{ padding: '3rem' }}>
          <div className="note-detail-header" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div className="note-avatar large" style={{ borderRadius: '16px', background: 'var(--n-accent-soft)', color: 'var(--n-accent)', border: 'none' }}>
              <span>{authorName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>{note.title}</h2>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--n-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                <span>By {authorName}</span>
                {note.subject && <span>• {note.subject}</span>}
                {note.year && <span>• Year {note.year}</span>}
              </div>
            </div>
          </div>

          <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--n-text-dim)', marginBottom: '3rem', whiteSpace: 'pre-wrap' }}>
            {note.description}
          </div>

          {note.tags && note.tags.length > 0 && (
            <div className="note-tags" style={{ marginBottom: '3rem', display: 'flex', gap: '0.6rem' }}>
              {note.tags.map((tag, i) => (
                <span key={i} className="note-tag" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--n-border-light)', paddingTop: '2.5rem' }}>
            {note.onedriveLink && (
              <a
                href={note.onedriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-new-note"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <ExternalLink size={18} />
                Access Resource Files
              </a>
            )}
            <button
              className={`btn-new-note ${note._userReaction === "like" ? "active" : ""}`}
              onClick={() => handleReaction("like")}
              style={{ flex: 1, justifyContent: 'center', background: note._userReaction === "like" ? 'var(--n-accent)' : 'rgba(255,255,255,0.05)', color: note._userReaction === "like" ? 'white' : 'var(--n-text-main)' }}
            >
              <ThumbsUp size={18} />
              <span>{note.reactionsCount?.likes || 0} Helpful</span>
            </button>
          </div>
        </div>

        {/* Community Discussion Timeline */}
        <div style={{ maxWidth: '800px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageSquare size={20} color="var(--n-accent)" />
            Discussion ({note.commentsCount || 0})
          </h3>

          <form onSubmit={handleComment} style={{ marginBottom: '3rem' }}>
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="Share your thoughts or ask a question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--n-text-main)', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="action-btn"
                style={{ background: 'var(--n-accent)', color: 'white', border: 'none' }}
              >
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="comments-list">
            {noteComments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="comment-author">{comment.userId?.name || "Scholar"}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--n-text-muted)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ color: 'var(--n-text-dim)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {comment.commentText}
                </div>
              </div>
            ))}
            {noteComments.length === 0 && (
              <p style={{ color: 'var(--n-text-muted)', textAlign: 'center', padding: '2rem' }}>No comments yet. Start the discussion!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
