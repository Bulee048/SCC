import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchGroupById, removeMember, leaveGroupAction,
    setFilters, clearError,
} from "../features/groups/groupSlice";
import { fetchMessages, sendMessage, clearCurrentGroup } from "../features/chat/chatSlice";
import {
    fetchGroupMeetups, createGroupMeetup,
    activateMeetup, voteOnMeetup, completeMeetup,
} from "../features/meetups/meetupSlice";
import { joinGroup, leaveGroup, getSocket } from "../socket/socket";
import * as fileService from "../services/fileService";
import * as groupService from "../services/groupService";
import {
    ArrowLeft, Send, Users, MessageSquare, File,
    Calendar, Plus, X, ChevronDown, ChevronUp,
    CheckCircle2, XCircle, Clock, Zap, MapPin,
    Link2, Award, Upload, Download, Trash2, Search,
    UserPlus, Crown, Shield, LogOut,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

// ══════════════════════════════════════════════════════════════
// MEETUP CARD component
// ══════════════════════════════════════════════════════════════
const STATUS_CFG = {
    Draft: { color: "var(--color-gray-400)", badge: "badge", icon: <Clock size={13} />, label: "Draft" },
    Active: { color: "var(--color-primary-500)", badge: "badge badge-info", icon: <Zap size={13} />, label: "Voting Open" },
    Confirmed: { color: "var(--color-success)", badge: "badge badge-success", icon: <CheckCircle2 size={13} />, label: "Confirmed" },
    Cancelled: { color: "var(--color-error)", badge: "badge badge-error", icon: <XCircle size={13} />, label: "Cancelled" },
    Completed: { color: "var(--color-secondary-500)", badge: "badge badge-purple", icon: <Award size={13} />, label: "Completed" },
};

function MeetupCard({ meetup, isAdmin, currentUserId, groupId, onRefresh }) {
    const dispatch = useDispatch();
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState(null);

    const cfg = STATUS_CFG[meetup.status] || STATUS_CFG.Draft;
    const votes = meetup.votes || [];
    const yesCount = meetup.yesCount ?? votes.filter((v) => v.response === "YES").length;
    const noCount = meetup.noCount ?? votes.filter((v) => v.response === "NO").length;
    const userVote = votes.find((v) => {
        const vid = v.user?._id || v.user;
        return vid?.toString() === currentUserId?.toString();
    });
    const progress = Math.min(100, Math.round((yesCount / (meetup.minConfirmations || 1)) * 100));
    const d = new Date(meetup.meetingDate);

    const act = async (key) => {
        if (busy) return;
        setBusy(key);
        try {
            if (key === "activate") await dispatch(activateMeetup({ meetupId: meetup._id, groupId })).unwrap();
            if (key === "yes") await dispatch(voteOnMeetup({ meetupId: meetup._id, groupId, response: "YES" })).unwrap();
            if (key === "no") await dispatch(voteOnMeetup({ meetupId: meetup._id, groupId, response: "NO" })).unwrap();
            if (key === "complete") await dispatch(completeMeetup({ meetupId: meetup._id, groupId })).unwrap();
            onRefresh?.();
        } catch (e) { console.error(e); }
        finally { setBusy(null); }
    };

    return (
        <div className={`card meetup-card-item ${meetup.status.toLowerCase()}`}
            style={{ overflow: "hidden", borderLeft: `4px solid ${cfg.color}` }}>

            {/* Collapsed header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "var(--spacing-md) var(--spacing-lg)", cursor: "pointer", gap: "var(--spacing-md)"
            }}
                onClick={() => setExpanded(p => !p)}>

                {/* Date block */}
                <div style={{
                    background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)", padding: "6px 10px", textAlign: "center", minWidth: "48px", flexShrink: 0
                }}>
                    <div style={{
                        fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                        color: "var(--color-primary-500)", letterSpacing: "0.5px"
                    }}>
                        {d.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div style={{
                        fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-extrabold)",
                        color: "var(--color-text-primary)", lineHeight: 1
                    }}>
                        {d.getDate()}
                    </div>
                </div>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                        fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px"
                    }}>
                        {meetup.title}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span className="badge badge-mode">
                            {meetup.mode === "ONLINE" ? "🌐" : meetup.mode === "PHYSICAL" ? "📍" : "🔀"} {meetup.mode}
                        </span>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                            🕐 {meetup.time} · {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {["Active", "Confirmed"].includes(meetup.status) && (
                            <span style={{ fontSize: "var(--font-size-xs)", color: cfg.color, fontWeight: 600 }}>
                                {yesCount}/{meetup.minConfirmations} ✓
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span className={cfg.badge} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        {cfg.icon} {cfg.label}
                    </span>
                    {expanded ? <ChevronUp size={15} style={{ color: "var(--color-text-tertiary)" }} />
                        : <ChevronDown size={15} style={{ color: "var(--color-text-tertiary)" }} />}
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div style={{ padding: "0 var(--spacing-lg) var(--spacing-lg)", borderTop: "1px solid var(--color-border)" }}>
                    {meetup.description && (
                        <p style={{
                            color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)",
                            lineHeight: 1.6, margin: "var(--spacing-md) 0"
                        }}>{meetup.description}</p>
                    )}
                    {meetup.location && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "6px"
                        }}>
                            <MapPin size={13} /> {meetup.location}
                        </div>
                    )}
                    {meetup.meetingLink && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--spacing-md)" }}>
                            <Link2 size={13} style={{ color: "var(--color-primary-500)", flexShrink: 0 }} />
                            <a href={meetup.meetingLink} target="_blank" rel="noopener noreferrer"
                                style={{ color: "var(--color-primary-500)", fontWeight: 600, fontSize: "var(--font-size-sm)", textDecoration: "none" }}
                                onClick={e => e.stopPropagation()}>
                                Join Online Meeting →
                            </a>
                        </div>
                    )}

                    {/* Voting section */}
                    {["Active", "Confirmed"].includes(meetup.status) && (
                        <div style={{
                            background: "var(--color-bg-secondary)", borderRadius: "var(--radius-lg)",
                            padding: "var(--spacing-md)", marginTop: "var(--spacing-md)", border: "1px solid var(--color-border)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>Confirmations</span>
                                <span style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", color: cfg.color }}>{yesCount}/{meetup.minConfirmations}</span>
                            </div>
                            {/* Progress */}
                            <div style={{
                                height: "5px", background: "var(--color-border)", borderRadius: "var(--radius-full)",
                                overflow: "hidden", marginBottom: "var(--spacing-md)"
                            }}>
                                <div style={{
                                    height: "100%", width: `${progress}%`,
                                    background: progress >= 100 ? "var(--color-success)" : "var(--color-primary-500)",
                                    borderRadius: "var(--radius-full)", transition: "width 0.4s ease"
                                }} />
                            </div>
                            <div style={{ display: "flex", gap: "var(--spacing-md)", fontSize: "var(--font-size-xs)", marginBottom: "var(--spacing-sm)" }}>
                                <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✓ {yesCount} YES</span>
                                <span style={{ color: "var(--color-error)", fontWeight: 600 }}>✕ {noCount} NO</span>
                                <span style={{ color: "var(--color-text-tertiary)" }}>{votes.length} voted</span>
                            </div>

                            {meetup.status === "Active" && (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        className={`btn btn-sm ${userVote?.response === "YES" ? "btn-primary" : "btn-secondary"}`}
                                        style={{ flex: 1 }}
                                        onClick={e => { e.stopPropagation(); act("yes"); }}
                                        disabled={!!busy}>
                                        {busy === "yes" ? "..." : <><CheckCircle2 size={15} /> YES</>}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        style={{ flex: 1, ...(userVote?.response === "NO" ? { background: "var(--color-error)", color: "#fff", border: "none" } : {}) }}
                                        onClick={e => { e.stopPropagation(); act("no"); }}
                                        disabled={!!busy}>
                                        {busy === "no" ? "..." : <><XCircle size={15} /> NO</>}
                                    </button>
                                </div>
                            )}
                            {userVote && (
                                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "6px", textAlign: "center" }}>
                                    Your vote: <strong style={{ color: userVote.response === "YES" ? "var(--color-success)" : "var(--color-error)" }}>
                                        {userVote.response}
                                    </strong>
                                    {meetup.status === "Active" && " · click to change"}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "var(--spacing-md)", flexWrap: "wrap" }}>
                            {meetup.status === "Draft" && (
                                <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); act("activate"); }} disabled={!!busy}>
                                    {busy === "activate" ? "Activating…" : <><Zap size={15} /> Activate Voting</>}
                                </button>
                            )}
                            {["Active", "Confirmed"].includes(meetup.status) && (
                                <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); act("complete"); }} disabled={!!busy}>
                                    {busy === "complete" ? "Completing…" : <><Award size={15} /> Mark Completed</>}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// CREATE MEETUP MODAL
// ══════════════════════════════════════════════════════════════
function CreateMeetupModal({ groupId, memberCount, onClose }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        title: "", description: "", meetingDate: "", time: "", mode: "ONLINE",
        meetingLink: "", location: "", minConfirmations: Math.max(1, Math.floor(memberCount / 2)), duration: 60,
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const minDate = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split("T")[0]; })();

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setErr("Title is required");
        if (!form.meetingDate) return setErr("Date is required");
        if (!form.time) return setErr("Time is required");
        if (form.mode === "ONLINE" && !form.meetingLink) return setErr("Meeting link is required for online meetups");
        if (form.mode === "PHYSICAL" && !form.location) return setErr("Location is required for physical meetups");
        setBusy(true); setErr("");
        try {
            await dispatch(createGroupMeetup({ groupId, payload: form })).unwrap();
            onClose();
        } catch (e) { setErr(typeof e === "string" ? e : "Failed to create meetup"); }
        finally { setBusy(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content scale-in" style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Calendar size={22} style={{ color: "var(--color-primary-500)" }} /> Schedule Meetup
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <form id="meetup-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Title *</label>
                            <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Sprint planning session" required />
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)}
                                placeholder="Agenda and goals…" rows="2" style={{ resize: "vertical" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date *</label>
                                <input type="date" className="form-input" value={form.meetingDate}
                                    onChange={e => set("meetingDate", e.target.value)} min={minDate} required />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Time *</label>
                                <input type="time" className="form-input" value={form.time} onChange={e => set("time", e.target.value)} required />
                            </div>
                        </div>

                        {/* Mode selector */}
                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Mode</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {["ONLINE", "PHYSICAL", "HYBRID"].map(m => (
                                    <button key={m} type="button" onClick={() => set("mode", m)}
                                        style={{
                                            flex: 1, padding: "8px 4px", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-xs)",
                                            fontWeight: 600, cursor: "pointer", transition: "all var(--transition-fast)",
                                            border: `2px solid ${form.mode === m ? "var(--color-primary-500)" : "var(--color-border)"}`,
                                            background: form.mode === m ? "rgba(99,102,241,0.1)" : "var(--color-bg-primary)",
                                            color: form.mode === m ? "var(--color-primary-500)" : "var(--color-text-secondary)"
                                        }}>
                                        {m === "ONLINE" ? "🌐" : m === "PHYSICAL" ? "📍" : "🔀"} {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {["ONLINE", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Meeting Link {form.mode === "ONLINE" ? "*" : ""}</label>
                                <input className="form-input" value={form.meetingLink} onChange={e => set("meetingLink", e.target.value)}
                                    placeholder="https://meet.google.com/…" required={form.mode === "ONLINE"} />
                            </div>
                        )}
                        {["PHYSICAL", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Location {form.mode === "PHYSICAL" ? "*" : ""}</label>
                                <input className="form-input" value={form.location} onChange={e => set("location", e.target.value)}
                                    placeholder="Room 204, Library…" required={form.mode === "PHYSICAL"} />
                            </div>
                        )}

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Min Confirmations to Auto-Confirm ({form.minConfirmations})</label>
                            <input type="range" min={1} max={Math.max(memberCount, 1)} value={form.minConfirmations}
                                onChange={e => set("minConfirmations", parseInt(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--color-primary-500)" }} />
                            <span className="form-hint">Auto-confirms when {form.minConfirmations} member{form.minConfirmations !== 1 ? "s" : ""} vote YES</span>
                        </div>

                        {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", marginTop: 0 }}>{err}</p>}
                    </form>
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" form="meetup-form" className="btn btn-primary" disabled={busy}>
                        {busy ? "Creating…" : <><Calendar size={17} /> Create Meetup</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN GroupDetail PAGE
// ══════════════════════════════════════════════════════════════
const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const socket = getSocket();

    // State
    const { currentGroup, isLoading: groupLoading } = useSelector(s => s.groups);
    const { messages: messagesMap, isLoading: chatLoading } = useSelector(s => s.chat);
    const messages = messagesMap[groupId] || [];
    const { user } = useSelector(s => s.auth);
    const meetupsState = useSelector(s => s.meetups.byGroupId[groupId]);
    const meetups = meetupsState?.items || [];

    const searchParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(location.state?.tab || searchParams.get("tab") || "chat");
    const [newMessage, setNewMessage] = useState("");
    const [showCreateMeetup, setShowCreateMeetup] = useState(false);

    // Files state
    const [files, setFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Invite / member state
    const [inviteSearch, setInviteSearch] = useState("");
    const [inviteResults, setInviteResults] = useState([]);
    const [inviteSearching, setInviteSearching] = useState(false);
    const [inviting, setInviting] = useState({});

    const messagesEndRef = useRef(null);

    // ── Fetch data on mount ──
    useEffect(() => {
        dispatch(fetchGroupById(groupId));
        dispatch(fetchMessages({ groupId }));
        dispatch(fetchGroupMeetups(groupId));
        joinGroup(groupId);
        return () => {
            leaveGroup(groupId);
            dispatch(clearCurrentGroup());
        };
    }, [dispatch, groupId]);

    // ── Files: load when Files tab opens ──
    useEffect(() => {
        if (activeTab === "files") loadFiles();
    }, [activeTab, groupId]);

    const loadFiles = async () => {
        setFilesLoading(true);
        try {
            const res = await fileService.getFiles(groupId);
            setFiles(res.data || []);
        } catch (e) { console.error(e); }
        finally { setFilesLoading(false); }
    };

    // ── Socket: real-time chat ──
    useEffect(() => {
        if (!socket) return;
        const onMsg = (msg) => dispatch({ type: "chat/addMessage", payload: { groupId, message: msg } });
        const onEdited = (msg) => dispatch({ type: "chat/updateMessage", payload: { groupId, message: msg } });
        const onDeleted = ({ messageId }) => dispatch({ type: "chat/removeMessage", payload: { groupId, messageId } });
        const onFileUp = () => { if (activeTab === "files") loadFiles(); };
        socket.on("new-message", onMsg);
        socket.on("message-edited", onEdited);
        socket.on("message-deleted", onDeleted);
        socket.on("file-uploaded", onFileUp);
        socket.on("file-deleted", onFileUp);
        return () => {
            socket.off("new-message", onMsg);
            socket.off("message-edited", onEdited);
            socket.off("message-deleted", onDeleted);
            socket.off("file-uploaded", onFileUp);
            socket.off("file-deleted", onFileUp);
        };
    }, [socket, dispatch, groupId, activeTab]);

    // ── Auto-scroll chat ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        dispatch(sendMessage({ groupId, content: newMessage.trim() }));
        setNewMessage("");
    };

    // ── File upload ──
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await fileService.uploadFile(groupId, file);
            await loadFiles();
        } catch (err) { console.error(err); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const handleFileDelete = async (fileId) => {
        try {
            await fileService.deleteFile(fileId);
            setFiles(prev => prev.filter(f => f._id !== fileId));
        } catch (err) { console.error(err); }
    };

    const handleFileDownload = async (fileId, filename) => {
        try {
            const blob = await fileService.downloadFile(fileId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };

    // ── Invite search ──
    const handleInviteSearch = async (e) => {
        const q = e.target.value;
        setInviteSearch(q);
        if (q.length < 2) { setInviteResults([]); return; }
        setInviteSearching(true);
        try {
            const res = await groupService.searchUsers(q, groupId);
            setInviteResults(res.data || []);
        } catch (e) { console.error(e); }
        finally { setInviteSearching(false); }
    };

    const handleInvite = async (userId) => {
        setInviting(p => ({ ...p, [userId]: true }));
        try {
            await groupService.inviteMember(groupId, userId);
            setInviteResults(prev => prev.filter(u => u._id !== userId));
            dispatch(fetchGroupById(groupId));
        } catch (e) { console.error(e); }
        finally { setInviting(p => ({ ...p, [userId]: false })); }
    };

    // ── Computed values ──
    const isAdmin = currentGroup?.creator === user?._id
        || currentGroup?.admins?.some(a => (a._id || a)?.toString() === user?._id)
        || currentGroup?.members?.some(m => {
            const uid = m.user?._id || m.user;
            return uid?.toString() === user?._id && m.role === "admin";
        });
    const memberCount = currentGroup?.members?.length || 0;
    const isPrivateGroup = currentGroup && !currentGroup.isPublic;
    const activeMeetups = meetups.filter(m => m.status === "Active").length;

    if (groupLoading && !currentGroup) return (
        <div style={{ padding: "var(--spacing-2xl)" }}><LoadingSpinner text="Loading group…" /></div>
    );

    if (!currentGroup) return (
        <div className="groups-container">
            <button className="btn btn-secondary" onClick={() => navigate("/groups")}>
                <ArrowLeft size={18} /> Back to Groups
            </button>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--spacing-lg)" }}>Group not found.</p>
        </div>
    );

    const tabs = [
        { id: "chat", label: "Chat", icon: <MessageSquare size={17} /> },
        { id: "meetups", label: "Meetups", icon: <Calendar size={17} />, badge: activeMeetups },
        { id: "files", label: "Files", icon: <File size={17} /> },
        { id: "members", label: "Members", icon: <Users size={17} />, badge: memberCount },
    ];

    return (
        <div className="group-detail-wrapper fade-in">
            {/* ── Header ── */}
            <div className="group-detail-header">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/groups")}>
                    <ArrowLeft size={17} /> Groups
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)", marginBottom: "2px" }}>
                        {currentGroup.name}
                        {isPrivateGroup && (
                            <span className="badge" style={{ marginLeft: "8px", fontSize: "11px" }}>🔒 Private</span>
                        )}
                    </h2>
                    <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                        {currentGroup.subject ? ` · ${currentGroup.subject}` : ""}
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                        // Leader: delete group
                        if (window.confirm("Delete this group? This cannot be undone.")) {
                            await groupService.deleteGroup(groupId);
                            navigate("/groups");
                        }
                    }}>
                        <Trash2 size={16} /> Delete
                    </button>
                )}
                {!isAdmin && (
                    <button className="btn btn-secondary btn-sm" onClick={async () => {
                        if (window.confirm("Leave this group?")) {
                            await dispatch(leaveGroupAction(groupId));
                            navigate("/groups");
                        }
                    }}>
                        <LogOut size={16} /> Leave
                    </button>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="group-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={activeTab === tab.id ? "active" : ""}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {tab.icon}
                        {tab.label}
                        {tab.badge > 0 && (
                            <span style={{
                                background: "var(--color-primary-500)", color: "#fff",
                                borderRadius: "var(--radius-full)", padding: "0 5px", fontSize: "10px", fontWeight: 700
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══════ CHAT TAB ══════ */}
            {activeTab === "chat" && (
                <div className="chat-container">
                    <div className="messages-container">
                        {chatLoading && messages.length === 0 && (
                            <div style={{ textAlign: "center", padding: "var(--spacing-2xl)", color: "var(--color-text-tertiary)" }}>
                                Loading messages…
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isOwn = (msg.sender?._id || msg.sender) === user?._id;
                            return (
                                <div key={msg._id} className={`message ${isOwn ? "own" : ""}`}>
                                    {!isOwn && (
                                        <div className="message-avatar">
                                            {(msg.sender?.name || "?")[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {!isOwn && <div className="message-sender">{msg.sender?.name}</div>}
                                        <div className="message-bubble">{msg.content}</div>
                                        <div className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="message-input-form" onSubmit={handleSendMessage}>
                        <input type="text" placeholder="Type a message…" value={newMessage}
                            onChange={e => setNewMessage(e.target.value)} className="message-input" autoComplete="off" />
                        <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                            <Send size={19} />
                        </button>
                    </form>
                </div>
            )}

            {/* ══════ MEETUPS TAB ══════ */}
            {activeTab === "meetups" && (
                <div className="meetups-tab-container fade-in">
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: "var(--spacing-lg)", flexWrap: "wrap", gap: "var(--spacing-md)"
                    }}>
                        <div>
                            <h3 style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)" }}>
                                Group Meetups
                            </h3>
                            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
                                Hybrid meetings with smart polling · {meetups.length} scheduled
                            </p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateMeetup(true)}>
                            <Plus size={17} /> Schedule Meetup
                        </button>
                    </div>

                    {meetupsState?.loading && meetups.length === 0 ? (
                        <LoadingSpinner text="Loading meetups…" />
                    ) : meetups.length === 0 ? (
                        <div style={{
                            textAlign: "center", padding: "var(--spacing-2xl)",
                            background: "var(--color-bg-secondary)", borderRadius: "var(--radius-xl)",
                            border: "1px solid var(--color-border)"
                        }}>
                            <Calendar size={48} style={{ color: "var(--color-gray-400)", marginBottom: "var(--spacing-md)", display: "block", margin: "0 auto var(--spacing-md)" }} />
                            <h4 style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--spacing-sm)" }}>No meetups yet</h4>
                            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-lg)" }}>
                                Schedule the group's first hybrid meetup and poll members for attendance
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowCreateMeetup(true)}>
                                <Plus size={17} /> Schedule First Meetup
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                            {meetups.map(meetup => (
                                <MeetupCard key={meetup._id} meetup={meetup} isAdmin={isAdmin}
                                    currentUserId={user?._id} groupId={groupId}
                                    onRefresh={() => dispatch(fetchGroupMeetups(groupId))} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ FILES TAB ══════ */}
            {activeTab === "files" && (
                <div className="files-container fade-in">
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: "var(--spacing-lg)", flexWrap: "wrap", gap: "var(--spacing-md)"
                    }}>
                        <div>
                            <h3 style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)" }}>Shared Files</h3>
                            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>{files.length} file{files.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? "Uploading…" : <><Upload size={17} /> Upload File</>}
                        </button>
                        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileUpload} />
                    </div>

                    {filesLoading ? <LoadingSpinner text="Loading files…" /> :
                        files.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "var(--spacing-2xl)",
                                background: "var(--color-bg-secondary)", borderRadius: "var(--radius-xl)",
                                border: "1px solid var(--color-border)"
                            }}>
                                <File size={48} style={{ color: "var(--color-gray-400)", display: "block", margin: "0 auto var(--spacing-md)" }} />
                                <h4 style={{ color: "var(--color-text-primary)", marginBottom: "var(--spacing-sm)" }}>No files yet</h4>
                                <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-lg)" }}>
                                    Upload documents, notes, and resources to share with your group
                                </p>
                                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                                    <Upload size={17} /> Upload First File
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                                {files.map(file => (
                                    <div key={file._id} className="card" style={{
                                        display: "flex", alignItems: "center",
                                        gap: "var(--spacing-md)", padding: "var(--spacing-md) var(--spacing-lg)"
                                    }}>
                                        <div style={{
                                            background: "rgba(99,102,241,0.1)", borderRadius: "var(--radius-md)",
                                            padding: "10px", flexShrink: 0
                                        }}>
                                            <File size={20} style={{ color: "var(--color-primary-500)" }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                            }}>
                                                {file.originalName || file.filename}
                                            </div>
                                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                                                {file.size ? `${(file.size / 1024).toFixed(1)} KB · ` : ""}
                                                Uploaded {new Date(file.createdAt).toLocaleDateString()}
                                                {file.uploadedBy?.name ? ` by ${file.uploadedBy.name}` : ""}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => handleFileDownload(file._id, file.originalName || file.filename)}>
                                                <Download size={15} />
                                            </button>
                                            {(isAdmin || (file.uploadedBy?._id || file.uploadedBy) === user?._id) && (
                                                <button className="btn btn-danger btn-sm"
                                                    onClick={() => handleFileDelete(file._id)}>
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            )}

            {/* ══════ MEMBERS TAB ══════ */}
            {activeTab === "members" && (
                <div className="members-container fade-in">
                    <h3 style={{ fontWeight: "var(--font-weight-bold)", marginBottom: "var(--spacing-md)", color: "var(--color-text-primary)" }}>
                        Members ({memberCount})
                    </h3>

                    {/* Invite section — only for admins of private groups */}
                    {isAdmin && (
                        <div className="card" style={{ marginBottom: "var(--spacing-lg)", padding: "var(--spacing-lg)" }}>
                            <h4 style={{
                                fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--spacing-sm)",
                                color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px"
                            }}>
                                <UserPlus size={18} style={{ color: "var(--color-primary-500)" }} />
                                {isPrivateGroup ? "Invite Members" : "Add Members"}
                            </h4>
                            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", marginBottom: "var(--spacing-md)" }}>
                                Search for students by name or email to add them to the group
                            </p>
                            <div style={{ position: "relative" }}>
                                <Search size={16} style={{
                                    position: "absolute", left: "12px", top: "50%",
                                    transform: "translateY(-50%)", color: "var(--color-gray-400)", pointerEvents: "none"
                                }} />
                                <input className="form-input" value={inviteSearch}
                                    onChange={handleInviteSearch}
                                    placeholder="Search by name or email…"
                                    style={{ paddingLeft: "36px" }} />
                            </div>
                            {inviteSearching && (
                                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", marginTop: "8px" }}>Searching…</p>
                            )}
                            {inviteResults.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "var(--spacing-sm)" }}>
                                    {inviteResults.map(u => (
                                        <div key={u._id} style={{
                                            display: "flex", alignItems: "center", gap: "var(--spacing-md)",
                                            padding: "10px var(--spacing-md)", background: "var(--color-bg-secondary)",
                                            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)"
                                        }}>
                                            <div style={{
                                                width: "34px", height: "34px", borderRadius: "var(--radius-full)",
                                                background: "linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontWeight: 700, fontSize: "var(--font-size-sm)", flexShrink: 0
                                            }}>
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>{u.name}</div>
                                                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{u.email}</div>
                                            </div>
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => handleInvite(u._id)} disabled={inviting[u._id]}>
                                                {inviting[u._id] ? "Adding…" : <><UserPlus size={14} /> Add</>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Member list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                        {currentGroup.members?.map((m, idx) => {
                            const member = m.user || m;
                            const memberId = (member?._id || member)?.toString();
                            const isCreator = currentGroup.creator === memberId || currentGroup.creator?._id?.toString() === memberId;
                            const isAdminMember = m.role === "admin" || currentGroup.admins?.some(a => (a._id || a)?.toString() === memberId);
                            const isYou = memberId === user?._id;
                            return (
                                <div key={memberId || idx} className="card"
                                    style={{
                                        display: "flex", alignItems: "center", gap: "var(--spacing-md)",
                                        padding: "var(--spacing-md) var(--spacing-lg)"
                                    }}>
                                    <div style={{
                                        width: "40px", height: "40px", borderRadius: "var(--radius-full)",
                                        background: "linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#fff", fontWeight: 700, fontSize: "var(--font-size-base)", flexShrink: 0
                                    }}>
                                        {(member?.name || "M")[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {member?.name || "Member"}
                                            {isYou && <span style={{ fontSize: "10px", color: "var(--color-primary-500)", fontWeight: 600 }}>(You)</span>}
                                        </div>
                                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{member?.email || ""}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        {isCreator && (
                                            <span className="badge badge-info" style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                                <Crown size={11} /> Creator
                                            </span>
                                        )}
                                        {!isCreator && isAdminMember && (
                                            <span className="badge badge-purple" style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                                <Shield size={11} /> Admin
                                            </span>
                                        )}
                                        {isAdmin && !isCreator && !isYou && (
                                            <button className="btn btn-danger btn-sm"
                                                onClick={async () => {
                                                    if (window.confirm(`Remove ${member?.name} from the group?`)) {
                                                        await groupService.removeMember(groupId, memberId);
                                                        dispatch(fetchGroupById(groupId));
                                                    }
                                                }}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Meetup Modal */}
            {showCreateMeetup && (
                <CreateMeetupModal groupId={groupId} memberCount={memberCount}
                    onClose={() => setShowCreateMeetup(false)} />
            )}
        </div>
    );
};

export default GroupDetail;
