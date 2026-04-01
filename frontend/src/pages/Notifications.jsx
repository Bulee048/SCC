import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, ArrowLeft, MessageSquare, ThumbsUp,
  Video, Info, Calendar, Users, Check, ExternalLink,
  Zap, CheckCircle2, XCircle, Award,
} from "lucide-react";
import {
  fetchNotifications,
  markAsReadAction,
  markAllAsReadAction,
} from "../features/notifications/notificationsSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import "../styles/Notifications.css";

// Notification type → icon + color config
const NOTIF_CONFIG = {
  note_reaction: { icon: ThumbsUp, color: "notif-reaction", label: "Reaction" },
  note_comment: { icon: MessageSquare, color: "notif-comment", label: "Comment" },
  kuppi_scheduled: { icon: Video, color: "notif-kuppi", label: "Kuppi" },
  general: { icon: Users, color: "notif-general", label: "General" },
  group_meetup_created: { icon: Calendar, color: "notif-meetup", label: "Meetup Created" },
  group_meetup_activated: { icon: Zap, color: "notif-meetup", label: "Voting Open" },
  group_meetup_confirmed: { icon: CheckCircle2, color: "notif-confirmed", label: "Confirmed" },
  group_meetup_cancelled: { icon: XCircle, color: "notif-cancelled", label: "Cancelled" },
  group_meetup_completed: { icon: Award, color: "notif-completed", label: "Completed" },
  group_meetup_vote: { icon: CheckCheck, color: "notif-meetup", label: "Vote" },
};

const getConfig = (type) => NOTIF_CONFIG[type] || { icon: Info, color: "notif-general", label: "Notification" };

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, pagination } = useSelector(
    (state) => state.notifications
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  const handleMarkRead = (id) => dispatch(markAsReadAction(id));
  const handleMarkAllRead = () => dispatch(markAllAsReadAction());

  const handleNotifNavigate = (notif) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    if (notif.type?.startsWith("group_meetup") || notif.relatedModel === "Meeting") {
      navigate("/groups");
    } else if (notif.relatedModel === "Group" || notif.type === "general") {
      navigate("/groups");
    } else if (notif.relatedModel === "KuppiPost") {
      navigate("/kuppi");
    } else if (notif.relatedModel === "Note" || notif.relatedModel === "Comment") {
      navigate("/notes");
    }
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div className="notifications-header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1><Bell size={24} /> Notifications</h1>
            <p>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </header>

      {loading && <LoadingSpinner text="Loading notifications..." />}

      {!loading && notifications.length === 0 && (
        <EmptyState
          icon="🔔"
          title="No notifications"
          description="You'll receive notifications for meetups, reactions, comments, and group updates"
        />
      )}

      {!loading && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((notif) => {
            const cfg = getConfig(notif.type);
            const Icon = cfg.icon;
            return (
              <div
                key={notif._id}
                className={`notification-item hover-glow ${!notif.isRead ? "unread" : ""} ${cfg.color} fade-in`}
              >
                <div className={`notif-icon-wrapper ${cfg.color}`}>
                  <Icon size={18} />
                </div>
                <div className="notif-content">
                  <div className="notif-title-row">
                    <span className="notif-title">{notif.title}</span>
                    <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="notif-message">{notif.message}</p>

                  {/* Contextual action links */}
                  {(notif.type?.startsWith("group_meetup") || notif.relatedModel === "Meeting") && (
                    <button className="notif-action-link" onClick={() => handleNotifNavigate(notif)}>
                      View Group Meetups <ExternalLink size={14} />
                    </button>
                  )}
                  {(notif.relatedModel === "Group" || notif.type === "general") && (
                    <button className="notif-action-link" onClick={() => handleNotifNavigate(notif)}>
                      View Groups <ExternalLink size={14} />
                    </button>
                  )}
                  {notif.relatedId && notif.relatedModel === "KuppiPost" && (
                    <button className="notif-action-link" onClick={() => navigate("/kuppi")}>
                      View Kuppi <ExternalLink size={14} />
                    </button>
                  )}
                  {notif.relatedId && (notif.relatedModel === "Note" || notif.relatedModel === "Comment") && (
                    <button className="notif-action-link" onClick={() => navigate("/notes")}>
                      View Note <ExternalLink size={14} />
                    </button>
                  )}

                  {/* Type badge */}
                  <span className={`badge badge-${cfg.color.replace("notif-", "")} notif-type-badge`}>
                    {cfg.label}
                  </span>
                </div>
                {!notif.isRead && (
                  <button
                    className="notif-mark-read"
                    onClick={() => handleMarkRead(notif._id)}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="notifications-pagination">
          <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
          <span>Page {currentPage} of {pagination.pages}</span>
          <button disabled={currentPage >= pagination.pages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default Notifications;
