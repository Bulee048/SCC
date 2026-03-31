import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  Calendar,
  Brain,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  Home as HomeIcon,
  LayoutDashboard,
  BookMarked,
  Video,
  Users,
  LogOut,
  Lightbulb
} from "lucide-react";
import {
  createRawTimetable,
  generateOptimizedTimetable,
  getUserTimetable,
  getGoogleAuthUrl,
  getGoogleCalendarStatus,
  getGoogleCalendarEvents,
  aiTimetableChat,
  importTimetableFromFile,
  deleteUserTimetable,
  clearOptimizedSchedule
} from "../services/timetableService";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import WeekTimetableCalendar from "../components/WeekTimetableCalendar";
import NotificationBell from "../components/NotificationBell";
import { confirmAction } from "../utils/toast";
import "../styles/Timetable.css";
import "../styles/TimetableEditor.css";
import "../styles/TimetablePageUiverse.css";


function toDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildStudySuggestions(universitySchedule = [], optimizedSchedule = []) {
  const asDate = (v) => new Date(v);
  const studyBlocks = (optimizedSchedule || []).filter((e) => {
    if (!e) return false;
    const t = String(e.type || "").toLowerCase();
    const title = String(e.title || "").toLowerCase();
    return t === "study" || title.includes("work plan") || title.includes("study");
  });

  const formatSlot = (start, end) => {
    const day = start.toLocaleDateString(undefined, { weekday: "short" });
    const st = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const et = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${day} ${st} – ${et}`;
  };

  if (studyBlocks.length > 0) {
    return studyBlocks
      .slice(0, 8)
      .map((b) => {
        const s = asDate(b.start);
        const e = asDate(b.end);
        const subject = b.subjectCode || b.title?.split(" - ")[0] || "this subject";
        return { slot: formatSlot(s, e), subject };
      });
  }

  const uni = (universitySchedule || [])
    .map((e) => ({ ...e, _start: asDate(e.start), _end: asDate(e.end) }))
    .filter((e) => !Number.isNaN(e._start.getTime()) && !Number.isNaN(e._end.getTime()) && e._end > e._start);

  if (uni.length === 0) return [];

  const dayMap = new Map();
  for (const e of uni) {
    const key = toDayKey(e._start);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key).push(e);
  }

  const suggestions = [];
  for (const events of dayMap.values()) {
    events.sort((a, b) => a._start - b._start);
    const dayDate = new Date(events[0]._start);

    const windowStart = new Date(dayDate);
    windowStart.setHours(18, 0, 0, 0);
    const windowEnd = new Date(dayDate);
    windowEnd.setHours(22, 0, 0, 0);

    let slotStart = new Date(windowStart);
    for (const evt of events) {
      if (evt._end <= slotStart) continue;
      if (evt._start <= slotStart && evt._end > slotStart) {
        slotStart = new Date(evt._end);
      }
    }

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 2, slotStart.getMinutes(), 0, 0);
    if (slotStart >= windowStart && slotEnd <= windowEnd) {
      const subject = events[0].subjectCode || events[0].title || "next topic";
      suggestions.push({ slot: formatSlot(slotStart, slotEnd), subject });
    }
  }

  return suggestions.slice(0, 8);
}

const defaultPreferredStudyHours = {
  startHour: 6,
  endHour: 22
};

const Timetable = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.length === 16 && value.includes("T")) {
      return value;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingTimetable, setDeletingTimetable] = useState(false);
  const [clearingAiPlan, setClearingAiPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [universitySchedule, setUniversitySchedule] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState({});
  const [preferredStudyHours, setPreferredStudyHours] = useState(defaultPreferredStudyHours);
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEventsLoading, setGoogleEventsLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, lastSyncedAt: null });
  const [googleEvents, setGoogleEvents] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [hasSavedTimetableOnServer, setHasSavedTimetableOnServer] = useState(false);
  const [calendarMountKey, setCalendarMountKey] = useState(0);
  const timetableFetchGenRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated]);

  const navLinks = [
    { icon: <HomeIcon size={18} strokeWidth={2.3} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={18} strokeWidth={2.3} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Brain size={18} strokeWidth={2.3} />, label: "Timetable", path: "/timetable", active: true },
    { icon: <BookMarked size={18} strokeWidth={2.3} />, label: "Notes", path: "/notes" },
    { icon: <Video size={18} strokeWidth={2.3} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={18} strokeWidth={2.3} />, label: "Groups", path: "/groups" },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const googleError = params.get("google_error");
    if (googleConnected === "1") {
      setSuccess("Google Calendar connected.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (googleError) {
      setError(`Google connection failed: ${googleError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const fetchTimetable = async () => {
      if (!user?._id) return;
      const gen = ++timetableFetchGenRef.current;
      try {
        setLoading(true);
        const data = await getUserTimetable(user._id);
        if (gen !== timetableFetchGenRef.current) return;
        setUniversitySchedule(data.universitySchedule || []);
        setOptimizedSchedule(data.optimizedSchedule || []);
        setHasSavedTimetableOnServer(true);
      } catch (err) {
        if (gen !== timetableFetchGenRef.current) return;
        if (err?.response?.status === 404) {
          setUniversitySchedule([]);
          setOptimizedSchedule([]);
          setHasSavedTimetableOnServer(false);
        }
      } finally {
        if (gen === timetableFetchGenRef.current) setLoading(false);
      }
    };

    const fetchGoogle = async () => {
      try {
        const status = await getGoogleCalendarStatus();
        setGoogleStatus(status);
        if (status.connected) {
          setGoogleEventsLoading(true);
          const { events } = await getGoogleCalendarEvents({ maxResults: 15 });
          setGoogleEvents(events || []);
        } else {
          setGoogleEvents([]);
        }
      } catch {
        // ignore
      } finally {
        setGoogleEventsLoading(false);
      }
    };

    fetchTimetable();
    fetchGoogle();
  }, [isAuthenticated, navigate, user?._id]);

  const handleConnectGoogle = async () => {
    setError("");
    setSuccess("");
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Please login again to connect Google Calendar.");
        navigate("/login");
        return;
      }
      setGoogleLoading(true);
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Failed to start Google connection");
      setGoogleLoading(false);
    }
  };

  const handleAddEmptyEvent = () => {
    setUniversitySchedule((prev) => [
      ...prev,
      { title: "", subjectCode: "", type: "lecture", start: "", end: "", location: "" }
    ]);
  };

  const handleRemoveEvent = async (index) => {
    setError("");
    setSuccess("");
    const nextSchedule = universitySchedule.filter((_, i) => i !== index);
    setUniversitySchedule(nextSchedule);
    if (!hasSavedTimetableOnServer) return;
    try {
      setSaving(true);
      if (nextSchedule.length === 0) {
        await deleteUserTimetable();
        setOptimizedSchedule([]);
        setConflicts([]);
        setHasSavedTimetableOnServer(false);
        setCalendarMountKey((k) => k + 1);
        setSuccess("Last row removed. SCC timetable deleted.");
        return;
      }
      const normalizedSchedule = nextSchedule
        .filter((e) => e.title && e.start && e.end)
        .map((e) => ({ ...e, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() }));
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, { difficultyLevels, preferredStudyHours });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts ? "Row removed. Some overlaps remain." : "Row removed and timetable updated.");
    } catch (err) {
      setError(err.message || "Failed to persist row removal");
      if (user?._id) {
        try {
          const data = await getUserTimetable(user._id);
          setUniversitySchedule(data.universitySchedule || []);
          setOptimizedSchedule(data.optimizedSchedule || []);
          setHasSavedTimetableOnServer(true);
        } catch {
          setHasSavedTimetableOnServer(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEventField = (index, field, value) => {
    setUniversitySchedule((prev) =>
      prev.map((event, i) => i === index ? { ...event, [field]: value } : event)
    );
  };

  const handleChangeDifficulty = (subjectCode, value) => {
    setDifficultyLevels((prev) => ({ ...prev, [subjectCode]: value }));
  };

  const handleDeleteEntireTimetable = async () => {
    const confirmed = await confirmAction(
      "Remove your SCC timetable from this app? This deletes university + AI data in Smart Campus Companion. If Google is connected with the latest permissions, SCC will also try to delete the events it previously synced to your Google Calendar (not your other personal events).",
      { confirmText: "Delete SCC timetable", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setConflicts([]);
    timetableFetchGenRef.current += 1;
    setUniversitySchedule([]);
    setOptimizedSchedule([]);
    setDifficultyLevels({});
    setPreferredStudyHours({ ...defaultPreferredStudyHours });
    setImportFile(null);
    setAiPrompt("");
    setHasSavedTimetableOnServer(false);
    setCalendarMountKey((k) => k + 1);

    try {
      setDeletingTimetable(true);
      const res = await deleteUserTimetable();
      const deleted = res?.data?.deletedCount ?? 0;
      const gRemoved = res?.data?.googleEventsRemoved ?? 0;
      const gAttempted = res?.data?.googleEventsRemovalAttempted ?? 0;
      const googlePart = gAttempted > 0
        ? ` Removed ${gRemoved} SCC-synced event(s) from Google Calendar (${gAttempted} tracked).`
        : "";
      setSuccess(deleted > 0
        ? `SCC timetable removed (university + AI plan).${googlePart}`
        : `SCC timetable cleared. (Server had nothing to delete — UI was reset.)${googlePart}`
      );
    } catch (err) {
      setError(err.message || "Failed to delete timetable");
      if (user?._id) {
        try {
          const data = await getUserTimetable(user._id);
          setUniversitySchedule(data.universitySchedule || []);
          setOptimizedSchedule(data.optimizedSchedule || []);
          setHasSavedTimetableOnServer(true);
        } catch {
          setHasSavedTimetableOnServer(false);
        }
      }
    } finally {
      setDeletingTimetable(false);
    }
  };

  const handleClearAiGeneratedPlan = async () => {
    const confirmed = await confirmAction(
      "Remove only your AI / optimized plan? Your editable university timetable stays in SCC. If Google is connected, SCC will also try to remove the events it previously synced from that plan.",
      { confirmText: "Remove AI plan only", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setConflicts([]);
    const prevOptimized = optimizedSchedule;
    setOptimizedSchedule([]);
    setCalendarMountKey((k) => k + 1);

    try {
      setClearingAiPlan(true);
      const payload = await clearOptimizedSchedule();
      const gRemoved = payload?.googleEventsRemoved ?? 0;
      const gAttempted = payload?.googleEventsRemovalAttempted ?? 0;
      const googlePart = gAttempted > 0
        ? ` Removed ${gRemoved} SCC-synced event(s) from Google (${gAttempted} tracked).`
        : "";
      setSuccess(`AI / optimized plan removed. University timetable unchanged.${googlePart}`);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 404) {
        setSuccess("Nothing saved on the server yet — the generated plan was cleared from this page.");
      } else {
        setError(err.message || "Failed to remove AI plan");
        setOptimizedSchedule(prevOptimized);
      }
    } finally {
      setClearingAiPlan(false);
    }
  };

  const persistUniversityTimetable = async ({ isUpdate = false } = {}) => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setSaving(true);
      const normalizedSchedule = universitySchedule
        .filter((e) => e.title && e.start && e.end)
        .map((e) => ({ ...e, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() }));
      if (normalizedSchedule.length === 0) {
        setError("Add at least one complete row (title, start, end) before saving.");
        return;
      }
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, { difficultyLevels, preferredStudyHours });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      if (isUpdate) {
        setSuccess(hasConflicts
          ? "Timetable updated and optimized plan regenerated. Some overlaps need review."
          : "Timetable updated and optimized plan generated.");
      } else {
        setSuccess(hasConflicts
          ? "Timetable saved and optimized plan generated. Some overlaps need review."
          : "Timetable saved and optimized plan generated.");
      }
    } catch (err) {
      setError(err.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOptimized = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setGenerating(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await generateOptimizedTimetable({ difficultyLevels, preferredStudyHours });
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "Optimized timetable generated with some overlapping events to review."
        : "Optimized timetable generated.");
    } catch (err) {
      setError(err.message || "Failed to generate optimized timetable");
    } finally {
      setGenerating(false);
    }
  };

  const handleAiChatGenerate = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      const normalizedUniversitySchedule = (universitySchedule || [])
        .filter((e) => e && e.title && e.start && e.end)
        .map((e) => ({
          title: e.title,
          subjectCode: e.subjectCode || "",
          type: e.type || "lecture",
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString(),
          location: e.location || ""
        }));

      if (!aiPrompt.trim() && normalizedUniversitySchedule.length === 0) {
        setError("Please describe your classes or study plan for the AI.");
        return;
      }

      const effectivePrompt = aiPrompt.trim() ||
        "Generate a balanced study/work plan in my free time. Prioritize hard subjects first, avoid overload per day, and respect personal commitments if mentioned.";

      setAiLoading(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } = await aiTimetableChat({
        message: effectivePrompt,
        universitySchedule: normalizedUniversitySchedule.length > 0 ? normalizedUniversitySchedule : undefined
      });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "AI created an optimized timetable with some overlaps to review."
        : "AI created an optimized timetable for you.");
    } catch (err) {
      setError(err.message || "Failed to generate timetable from AI chat");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportTimetable = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    if (!importFile) {
      setError("Please upload a timetable image or PDF.");
      return;
    }
    try {
      setImporting(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await importTimetableFromFile({ file: importFile, prompt: aiPrompt });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "Imported timetable + generated working plan (with study time)."
        : "Imported timetable + generated working plan.");
      setImportFile(null);
    } catch (err) {
      setError(err.message || "Failed to import timetable");
    } finally {
      setImporting(false);
    }
  };

  const hasTimetable = useMemo(
    () => universitySchedule.length > 0 || optimizedSchedule.length > 0,
    [universitySchedule.length, optimizedSchedule.length]
  );

  const studySuggestions = useMemo(
    () => buildStudySuggestions(universitySchedule, optimizedSchedule),
    [universitySchedule, optimizedSchedule]
  );

  if (!user) return <LoadingSpinner text="Loading timetable..." />;

  return (
    <div className="db-root dashboard-page">
      <div className="temporal-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="dashboard-container timetable-uiverse-page" style={{ position: "relative", zIndex: 10 }}>

        {/* HEADER REMOVED for minimal, focused timetable view */}

        {/* ── PAGE CONTENT ─────────────────────────────────────── */}
        <div className="dashboard-content">

          {/* Hero HUD */}
          <div className="welcome-section fade-in">
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="dashboard-hero__system-status">
                <div className="dashboard-hero__system-dot"></div>
                <span className="dashboard-hero__system-text">Temporal Nexus Online</span>
              </div>
              <h1 className="neon-text">STRATEGIC CHRONOS: {user.name.split(" ")[0].toUpperCase()}</h1>
              <p className="user-info">
                Welcome to the <strong>Temporal Nexus</strong>. Deploy your university intelligence vectors 
                and let the <strong>Neural Strategy Engine</strong> calibrate your optimal study trajectory.
                Sync directly to your primary calendar array.
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <Sparkles size={16} />
              <span>{success}</span>
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="alert alert-warning">
              <AlertCircle size={16} />
              <span>
                Detected {conflicts.length} overlapping time slot{conflicts.length > 1 ? "s" : ""}.
                Review your timetable to avoid clashes.
              </span>
            </div>
          )}

          {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
          <div className="tt-page-grid">

            {/* ── LEFT COLUMN ─────────────────────────── */}
            <div className="tt-col-main">

              {/* NEURAL STRATEGY ENGINE CARD */}
              <div className="card card--ai fade-in" style={{ animationDelay: "40ms" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Brain size={18} />
                    Neural Strategy Engine
                  </h3>
                  <p className="card-description">
                    Input your temporal constraints or upload your lecture array (OCR support). 
                    The AI will architect a high-efficiency study plan, prioritizing critical 
                    subjects while respecting your baseline biological resets (gym, rest).
                  </p>
                </div>
                <div className="card-body">
                  <div className="form-field">
                    <label className="form-label">Describe your schedule or request</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="e.g. I have gym Mon/Wed/Fri 6–7 pm. Prioritise DBMS and Maths. Build a balanced study plan in my free time."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  <div className="form-field" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Semester timetable file (optional)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="form-input"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <p className="form-hint">
                      Upload a screenshot or PDF of your weekly lecture timetable.
                      {importFile && <strong> "{importFile.name}" ready to import.</strong>}
                    </p>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    type="button"
                    className={`btn btn-success ${(aiLoading || importing) ? "loading" : ""}`}
                    onClick={importFile ? handleImportTimetable : handleAiChatGenerate}
                    disabled={aiLoading || importing}
                  >
                    <Sparkles size={15} />
                    {importing ? "Importing…" : aiLoading ? "Generating…" :
                      importFile ? "Import file & generate timetable" : "Generate timetable from AI"}
                  </button>
                </div>
              </div>

              {/* UNIVERSITY REGISTRY ARRAY CARD */}
              <div className="card card--editor fade-in" style={{ animationDelay: "80ms" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Calendar size={18} />
                    University Registry Array
                  </h3>
                  <p className="card-description">
                    Calibrate your <strong>core lecture data</strong> here. Modifications to the 
                    registry will trigger a recalculation of the Neural Plan. Use safeguards to 
                    reset or purge specific temporal layers.
                  </p>
                </div>

                {universitySchedule.length === 0 && (
                  <div className="card-body" style={{ paddingBottom: 0 }}>
                    <EmptyState title="No timetable yet" description="Add your first subject block to get started." />
                  </div>
                )}

                {universitySchedule.length > 0 && (
                  <div className="card-body">
                    <div className="tt-editor-table-wrap">
                      <table className="tt-editor-table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: 220 }}>Title</th>
                            <th style={{ minWidth: 120 }}>Code</th>
                            <th style={{ minWidth: 185 }}>Start</th>
                            <th style={{ minWidth: 185 }}>End</th>
                            <th style={{ minWidth: 160 }}>Location</th>
                            <th style={{ minWidth: 120 }}>Difficulty</th>
                            <th className="tt-editor-col-actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {universitySchedule.map((event, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  className="form-input"
                                  value={event.title}
                                  onChange={(e) => handleChangeEventField(index, "title", e.target.value)}
                                  placeholder="Data Structures Lecture"
                                />
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  value={event.subjectCode}
                                  onChange={(e) => handleChangeEventField(index, "subjectCode", e.target.value)}
                                  placeholder="CS201"
                                />
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  className="form-input"
                                  value={toDateTimeLocalValue(event.start)}
                                  onChange={(e) => handleChangeEventField(index, "start", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  className="form-input"
                                  value={toDateTimeLocalValue(event.end)}
                                  onChange={(e) => handleChangeEventField(index, "end", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  value={event.location}
                                  onChange={(e) => handleChangeEventField(index, "location", e.target.value)}
                                  placeholder="Room B12"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select"
                                  value={difficultyLevels[event.subjectCode || event.title] || "medium"}
                                  onChange={(e) => handleChangeDifficulty(event.subjectCode || event.title, e.target.value)}
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </td>
                              <td className="tt-editor-actions">
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRemoveEvent(index)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="card-body" style={{ paddingTop: universitySchedule.length > 0 ? 0 : undefined }}>
                  <button
                    type="button"
                    className="btn btn-outline tt-editor-add-btn"
                    onClick={handleAddEmptyEvent}
                  >
                    <Plus size={15} />
                    Add subject block
                  </button>
                </div>

                <div className="card-footer">
                  <button
                    type="button"
                    className={`btn btn-outline ${saving ? "loading" : ""}`}
                    onClick={() => persistUniversityTimetable({ isUpdate: true })}
                    disabled={saving || universitySchedule.length === 0}
                  >
                    <RefreshCw size={15} />
                    {saving ? "Saving…" : "Update timetable"}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-danger ${deletingTimetable ? "loading" : ""}`}
                    onClick={handleDeleteEntireTimetable}
                    disabled={deletingTimetable}
                  >
                    <Trash2 size={15} />
                    Delete SCC timetable
                  </button>
                </div>
                <p className="form-hint" style={{ padding: "0 1.75rem 1.1rem" }}>
                  "Delete SCC timetable" clears SCC data and removes Google events SCC created.
                  Use <strong>Reconnect Google</strong> if cleanup fails.
                </p>
              </div>

            </div>{/* end tt-col-main */}

            {/* ── RIGHT SIDEBAR ────────────────────────── */}
            <div className="tt-col-aside">

              {/* TEMPORAL METRICS */}
              <div className="tt-stat-row">
                <div className="tt-mini-stat">
                  <span className="tt-mini-stat__label">Registry Count</span>
                  <span className={`tt-mini-stat__value ${universitySchedule.length > 0 ? "emerald" : ""}`}>
                    {universitySchedule.length}
                  </span>
                </div>
                <div className="tt-mini-stat">
                  <span className="tt-mini-stat__label">Neural Slots</span>
                  <span className={`tt-mini-stat__value ${optimizedSchedule.length > 0 ? "cyan" : ""}`}>
                    {optimizedSchedule.filter(e => {
                      const t = String(e?.type || "").toLowerCase();
                      return t === "study" || String(e?.title || "").toLowerCase().includes("study");
                    }).length}
                  </span>
                </div>
                <div className="tt-mini-stat">
                  <span className="tt-mini-stat__label">Conflict Vectors</span>
                  <span className={`tt-mini-stat__value ${conflicts.length > 0 ? "amber" : ""}`}>
                    {conflicts.length}
                  </span>
                </div>
                <div className="tt-mini-stat">
                  <span className="tt-mini-stat__label">Optimal Paths</span>
                  <span className={`tt-mini-stat__value ${studySuggestions.length > 0 ? "violet" : ""}`}>
                    {studySuggestions.length}
                  </span>
                </div>
              </div>

              {/* NEURAL RECOMMENDATIONS CARD */}
              <div className="card card--advice fade-in" style={{ animationDelay: "120ms" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Lightbulb size={18} />
                    Neural Recommendations
                  </h3>
                  <p className="card-description">
                    Adaptive study vectors derived from current temporal availability.
                  </p>
                </div>
                <div className="card-body">
                  {studySuggestions.length === 0 ? (
                    <EmptyState
                      title="No vectors found"
                      description="Initialize your registry to generate neural advisories."
                    />
                  ) : (
                    <div className="profile-info">
                      {studySuggestions.map((item, idx) => (
                        <div key={idx} className="profile-info-item">
                          <strong>Vector {idx + 1}</strong>
                          <span>
                            {typeof item === "string"
                              ? item
                              : `${item.slot}: Focus on ${item.subject}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* NEXUS PROTOCOL CARD */}
              <div className="card card--tip fade-in" style={{ animationDelay: "200ms" }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Clock size={18} />
                    Nexus Protocol
                  </h3>
                </div>
                <div className="card-body">
                  <div className="tt-tip-body">
                    <div className="tt-tip-icon">💠</div>
                    <p className="tt-tip-text">
                      Maintain registry integrity. The projection array synchronizes 
                      automatically upon neural plan commit. Manual override for Google Matrix 
                      sync is available below.
                    </p>
                  </div>
                </div>
              </div>

            </div>{/* end tt-col-aside */}

            {/* ── FULL-WIDTH ROWS BELOW GRID ─────────────────── */}

            {/* TEMPORAL PROJECTION ARRAY */}
            <div className="card card--cal fade-in tt-full-width" style={{ animationDelay: "160ms" }}>
              <div className="card-header">
                <h3 className="card-title">
                  <Clock size={18} />
                  Temporal Projection Array
                </h3>
                <p className="card-description">
                  Visualizing <strong>synchronized lecture + neural study blocks</strong>. 
                  This is your real-time strategy matrix.
                </p>
              </div>
              <div className="card-body">
                {!hasTimetable && (
                  <EmptyState
                    title="No schedule yet"
                    description="Save a base timetable and generate an optimised plan to see your upcoming events."
                  />
                )}
                {hasTimetable && (
                  <WeekTimetableCalendar
                    key={calendarMountKey}
                    title="Timetable calendar"
                    events={optimizedSchedule.length > 0 ? optimizedSchedule : universitySchedule}
                    minHour={6}
                    maxHour={22}
                  />
                )}
              </div>
              {hasTimetable && optimizedSchedule.length > 0 && (
                <div className="card-footer">
                  <button
                    type="button"
                    className={`btn btn-danger ${clearingAiPlan ? "loading" : ""}`}
                    onClick={handleClearAiGeneratedPlan}
                    disabled={clearingAiPlan}
                  >
                    <Trash2 size={15} />
                    Remove AI / optimized plan
                  </button>
                  <p className="form-hint" style={{ margin: 0, flex: "1 1 200px" }}>
                    Removes the <strong>generated</strong> plan only — not your editable class rows.
                    SCC will try to delete synced Google events (not unrelated personal events).
                  </p>
                </div>
              )}
            </div>

            {/* EXTERNAL MATRIX LINK (GOOGLE CALENDAR) */}
            <div className="card card--google fade-in tt-full-width" style={{ animationDelay: "240ms" }}>
              <div className="card-header">
                <h3 className="card-title">
                  <Calendar size={18} />
                  External Matrix Link
                </h3>
                <p className="card-description">
                  Establish a secure tunnel to <strong>Google Calendar</strong>. Syncing 
                  neural plans will create verifiable temporal entries in your external array.
                </p>
              </div>
              <div className="card-body">
                <div className="google-connect-row">
                  <button
                    type="button"
                    className={`btn btn-outline ${googleLoading ? "loading" : ""}`}
                    onClick={handleConnectGoogle}
                    disabled={googleLoading}
                  >
                    {googleStatus.connected ? "Reconnect Google" : "Connect Google"}
                  </button>
                  <span className={`badge ${googleStatus.connected ? "badge-success" : "badge-warning"}`}>
                    {googleStatus.connected ? "Connected" : "Not connected"}
                  </span>
                </div>

                {googleStatus.connected && (
                  <>
                    <div className="google-iframe-wrap">
                      <iframe
                        title="Google Calendar"
                        src={
                          import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL ||
                          "https://calendar.google.com/calendar/embed?mode=WEEK&wkst=1&bgcolor=%23ffffff&ctz=UTC"
                        }
                        style={{ width: "100%", height: 560, border: 0, display: "block" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    {googleEventsLoading ? (
                      <div className="loading-text">Loading Google events…</div>
                    ) : googleEvents.length === 0 ? (
                      <EmptyState title="No upcoming Google events" description="Your Google Calendar looks clear for now." />
                    ) : (
                      <div className="profile-info">
                        {googleEvents.map((e) => (
                          <div key={e.id} className="profile-info-item">
                            <strong>{e.summary}</strong>
                            <span>
                              {e.start ? new Date(e.start).toLocaleString() : "—"} –{" "}
                              {e.end ? new Date(e.end).toLocaleString() : "—"}
                            </span>
                            {e.location && <span>{e.location}</span>}
                            {e.htmlLink && (
                              <a href={e.htmlLink} target="_blank" rel="noreferrer" className="nav-link" style={{ padding: 0 }}>
                                Open in Google Calendar ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>{/* end tt-page-grid */}
        </div>{/* end dashboard-content */}
      </div>
    </div>
  );
};

export default Timetable;