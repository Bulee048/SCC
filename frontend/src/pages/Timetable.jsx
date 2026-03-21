import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import {
  Calendar,
  Brain,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2
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
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";
import "../styles/TimetableEditor.css";
import "../styles/TimetablePageUiverse.css";

/* ═══════════════════════════════════════════════════════════
   Ocean background (same vibe as Groups page)
   Uses Three.js with a full-screen canvas + vignette overlay.
   ═══════════════════════════════════════════════════════════ */
function useOceanBackground(wrapRef, canvasReady) {
  useEffect(() => {
    if (!canvasReady || !wrapRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    wrapRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a2134);
    scene.fog = new THREE.FogExp2(0x0d2940, 0.0165);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
    camera.position.set(0, 8, 55);
    camera.lookAt(0, 0, 0);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
    const fPos = floorGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const x = fPos.getX(i);
      const z = fPos.getZ(i);
      fPos.setY(i, Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.06) * 0.6);
    }
    fPos.needsUpdate = true;
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshBasicMaterial({ color: 0x102d42 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -18;
    scene.add(floor);

    // God rays
    const raysGroup = new THREE.Group();
    for (let r = 0; r < 7; r++) {
      const ray = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.05,
          3 + Math.random() * 4,
          60,
          6,
          1,
          true
        ),
        new THREE.MeshBasicMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.03 + Math.random() * 0.03,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ray.position.set(
        (Math.random() - 0.5) * 60,
        10,
        (Math.random() - 0.5) * 30 - 10
      );
      ray.rotation.z = (Math.random() - 0.5) * 0.15;
      raysGroup.add(ray);
    }
    scene.add(raysGroup);

    // Plankton
    const PLANKTON = 4500;
    const plankGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PLANKTON * 3);
    const pCol = new Float32Array(PLANKTON * 3);
    const pPhase = new Float32Array(PLANKTON);
    const cc = new THREE.Color();
    for (let i = 0; i < PLANKTON; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 100;
      pPos[i * 3 + 1] = -18 + Math.random() * 45;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      pPhase[i] = Math.random() * Math.PI * 2;
      cc.setHSL(Math.random() > 0.4 ? 0.47 : 0.58, 1, 0.55 + Math.random() * 0.25);
      pCol[i * 3] = cc.r;
      pCol[i * 3 + 1] = cc.g;
      pCol[i * 3 + 2] = cc.b;
    }
    plankGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    plankGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const plankMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    const plankton = new THREE.Points(plankGeo, plankMat);
    scene.add(plankton);

    let frame = 0;
    let animId;
    const plankPos = plankton.geometry.attributes.position;

    const animate = () => {
      frame++;
      const t = frame * 0.001;
      camera.position.x = Math.sin(t * 0.15) * 10;
      camera.position.z = 55 + Math.sin(t * 0.09) * 8;
      camera.position.y = 8 + Math.sin(t * 0.2) * 3;
      camera.lookAt(0, 2, 0);

      for (let i = 0; i < PLANKTON; i++) {
        plankPos.array[i * 3] += Math.sin(t * 1.2 + pPhase[i]) * 0.004;
        plankPos.array[i * 3 + 1] += 0.006;
        plankPos.array[i * 3 + 2] += Math.cos(t * 0.9 + pPhase[i]) * 0.004;
        if (plankPos.array[i * 3 + 1] > 28) {
          plankPos.array[i * 3 + 1] = -18;
          plankPos.array[i * 3] = (Math.random() - 0.5) * 100;
          plankPos.array[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      plankPos.needsUpdate = true;
      plankMat.opacity = 0.55 + Math.sin(t * 2.5) * 0.15;

      raysGroup.children.forEach((ray, ri) => {
        ray.material.opacity = 0.02 + Math.sin(t * 0.8 + ri * 0.9) * 0.018;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (wrapRef.current?.contains(renderer.domElement)) {
        wrapRef.current.removeChild(renderer.domElement);
      }
    };
  }, [canvasReady, wrapRef]);
}

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
    return `${day} ${st} - ${et}`;
  };

  // Primary: use generated study/work blocks directly.
  if (studyBlocks.length > 0) {
    return studyBlocks
      .slice(0, 8)
      .map((b) => {
        const s = asDate(b.start);
        const e = asDate(b.end);
        const subject = b.subjectCode || b.title?.split(" - ")[0] || "this subject";
        return `${formatSlot(s, e)}: no lecture conflict, study ${subject}.`;
      });
  }

  // Fallback: derive suggestions from class timetable free time (evening window).
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
      suggestions.push(`${formatSlot(slotStart, slotEnd)}: free slot found, study ${subject}.`);
    }
  }

  return suggestions.slice(0, 8);
}

const defaultPreferredStudyHours = {
  // Match the week calendar visible range so work plan blocks fill free time.
  startHour: 6,
  endHour: 22
};

const Timetable = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Ocean canvas refs (same style as Groups page)
  const wrapRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRefCallback = (node) => {
    wrapRef.current = node;
    if (node) setCanvasReady(true);
  };
  useOceanBackground(wrapRef, canvasReady);

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    // Accept either ISO strings or already-formatted datetime-local strings.
    // datetime-local expects: YYYY-MM-DDTHH:mm (no timezone designator).
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
  const [preferredStudyHours, setPreferredStudyHours] = useState(
    defaultPreferredStudyHours
  );
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEventsLoading, setGoogleEventsLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, lastSyncedAt: null });
  const [googleEvents, setGoogleEvents] = useState([]);

  // Timetable import (OCR)
  const [importFile, setImportFile] = useState(null);

  /** True once we know a timetable document exists on the server (load, save, AI, import, generate). */
  const [hasSavedTimetableOnServer, setHasSavedTimetableOnServer] = useState(false);

  /** Bumps after delete so WeekTimetableCalendar remounts (clears modal / internal state). */
  const [calendarMountKey, setCalendarMountKey] = useState(0);

  /**
   * Invalidates in-flight GET /timetable so a slow response can't repopulate the UI after delete.
   */
  const timetableFetchGenRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated]);

  // Match Home navbar "scrolled" height/background behavior.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        // Only reset when the server says there is no timetable (avoid wiping on random network errors).
        if (err?.response?.status === 404) {
          setUniversitySchedule([]);
          setOptimizedSchedule([]);
          setHasSavedTimetableOnServer(false);
        }
      } finally {
        if (gen === timetableFetchGenRef.current) {
          setLoading(false);
        }
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
      // Backend Google auth URL endpoint is protected and requires:
      // Authorization: Bearer <accessToken>
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
      {
        title: "",
        subjectCode: "",
        type: "lecture",
        start: "",
        end: "",
        location: ""
      }
    ]);
  };

  const handleRemoveEvent = async (index) => {
    setError("");
    setSuccess("");

    const nextSchedule = universitySchedule.filter((_, i) => i !== index);
    setUniversitySchedule(nextSchedule);

    // If nothing has been saved yet, local edit is enough.
    if (!hasSavedTimetableOnServer) return;

    try {
      setSaving(true);

      // If user removed the final row, remove the saved timetable too so refresh stays empty.
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
        .map((e) => ({
          ...e,
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString()
        }));

      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, {
          difficultyLevels,
          preferredStudyHours
        });

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(
        hasConflicts
          ? "Row removed and timetable updated. Some overlaps remain."
          : "Row removed and timetable updated."
      );
    } catch (err) {
      setError(err.message || "Failed to persist row removal");
      // Restore authoritative server state if persistence failed.
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
      prev.map((event, i) =>
        i === index
          ? {
              ...event,
              [field]: value
            }
          : event
      )
    );
  };

  const handleChangeDifficulty = (subjectCode, value) => {
    setDifficultyLevels((prev) => ({
      ...prev,
      [subjectCode]: value
    }));
  };

  /** Save (first time) or update (existing) — same API; backend overwrites latest timetable. */
  const handleDeleteEntireTimetable = async () => {
    const confirmed = await confirmAction(
      "Remove your SCC timetable from this app? This deletes university + AI data in Smart Campus Companion. If Google is connected with the latest permissions, SCC will also try to delete the events it previously synced to your Google Calendar (not your other personal events).",
      { confirmText: "Delete SCC timetable", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setConflicts([]);
    // Invalidate any in-flight GET so it cannot repaint old rows after we clear.
    timetableFetchGenRef.current += 1;

    // Optimistic UI: clear the table immediately (fixes "button does nothing" feel).
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
      const googlePart =
        gAttempted > 0
          ? ` Removed ${gRemoved} SCC-synced event(s) from Google Calendar (${gAttempted} tracked).`
          : "";
      setSuccess(
        deleted > 0
          ? `SCC timetable removed (university + AI plan).${googlePart}`
          : `SCC timetable cleared. (Server had nothing to delete — UI was reset.)${googlePart}`
      );
    } catch (err) {
      setError(err.message || "Failed to delete timetable");
      // Restore from server if delete failed
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

  /** Deletes only optimizedSchedule (AI / rule-based plan). Keeps university rows in SCC. */
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
      const googlePart =
        gAttempted > 0
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
        .map((e) => ({
          ...e,
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString()
        }));

      if (normalizedSchedule.length === 0) {
        setError("Add at least one complete row (title, start, end) before saving.");
        return;
      }

      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, {
          difficultyLevels,
          preferredStudyHours
        });

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      if (isUpdate) {
        setSuccess(
          hasConflicts
            ? "Timetable updated and optimized plan regenerated. Some overlaps need review."
            : "Timetable updated and optimized plan generated."
        );
      } else {
        setSuccess(
          hasConflicts
            ? "Timetable saved and optimized plan generated. Some overlaps need review."
            : "Timetable saved and optimized plan generated."
        );
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
      const {
        timetable,
        conflicts: foundConflicts = [],
        hasConflicts
      } = await generateOptimizedTimetable({
        difficultyLevels,
        preferredStudyHours
      });
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(
        hasConflicts
          ? "Optimized timetable generated with some overlapping events to review."
          : "Optimized timetable generated."
      );
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

      // If user did not type a prompt but has timetable rows, use a smart default:
      // generate balanced free-time work-plan with priority.
      const effectivePrompt = aiPrompt.trim() || "Generate a balanced study/work plan in my free time. Prioritize hard subjects first, avoid overload per day, and respect personal commitments if mentioned.";

      setAiLoading(true);
      const {
        timetable,
        conflicts: foundConflicts = [],
        hasConflicts
      } = await aiTimetableChat({
        message: effectivePrompt,
        universitySchedule:
          normalizedUniversitySchedule.length > 0
            ? normalizedUniversitySchedule
            : undefined
      });

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(
        hasConflicts
          ? "AI created an optimized timetable with some overlaps to review."
          : "AI created an optimized timetable for you."
      );
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

      const {
        timetable,
        conflicts: foundConflicts = [],
        hasConflicts
      } = await importTimetableFromFile({
        file: importFile,
        // Reuse the prompt textarea so user can say "make it more suitable..."
        prompt: aiPrompt
      });

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(
        hasConflicts
          ? "Imported timetable + generated working plan (with study time)."
          : "Imported timetable + generated working plan."
      );

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

  if (!user) {
    return <LoadingSpinner text="Loading timetable..." />;
  }

  return (
    <div className="db-root dashboard-page">
      {/* Ocean canvas + vignette overlay (behind UI) */}
      <div className="db-canvas-wrap" ref={canvasRefCallback} />
      <div className="db-overlay-vignette" />

      <div className="dashboard-container timetable-uiverse-page" style={{ position: "relative", zIndex: 10 }}>
      <nav className={`timetable-topnav fade-in${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          {/* Brand (same layout as Home) */}
          <Link to="/" className="nav-brand">
            <span className="nav-brand-logo">S</span>
            <span className="nav-brand-name">
              Smart<span> Campus Companion</span>
            </span>
          </Link>

          {/* Center Links – dashboard only */}
          <div className="nav-center">
            <Link className="nav-link" to="/dashboard">
              🏠 Dashboard
            </Link>
          </div>

          {/* Right side – profile */}
          <div className="nav-right">
            <Link className="home-signin-btn" to="/profile">
              ⚙️ Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div
          className="welcome-section card-shine hover-glow fade-in"
          style={{ marginBottom: "2rem" }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 className="neon-text">
              Smart timetable for{" "}
              {user.name.split(" ")[0]}
            </h1>
            <p className="user-info">
              Feed your raw university schedule, then let the{" "}
              <strong>rule-based engine</strong> generate a personalized study
              plan you can sync to Google Calendar.
            </p>
          </div>
        </div>

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
              Detected {conflicts.length} overlapping time slot
              {conflicts.length > 1 ? "s" : ""}. Review your timetable to avoid
              clashes.
            </span>
          </div>
        )}

        <div
          className="card card-shine hover-glow fade-in"
          style={{ marginBottom: "2rem", animationDelay: "40ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Brain size={20} style={{ marginRight: 8 }} />
              AI timetable assistant
            </h3>
            <p className="card-description">
              Type your request and optionally upload your semester timetable (image or PDF).
              The AI can build a separate free-time work plan, prioritize subjects, and respect commitments
              like gym/work when you mention them in your prompt.
            </p>
          </div>
          <div className="card-body">
            <div className="form-field">
              <label className="form-label">Tell the AI about your schedule</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Example: I have gym Mon/Wed/Fri 6-7pm. Prioritize DBMS and Maths. Build a balanced study plan in my free time."
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
                Upload a clear screenshot/photo of your weekly lectures timetable.
                If it's a PDF with selectable text, SCC can extract it. If it's scanned, upload an image instead.
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
              <Sparkles size={16} />
              {importFile ? "Import file & generate timetable" : "Generate timetable from AI chat"}
            </button>
          </div>
        </div>

        <div
          className="card card-shine hover-glow fade-in"
          style={{ marginBottom: "2rem", animationDelay: "80ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Brain size={20} style={{ marginRight: 8 }} />
              University timetable
            </h3>
            <p className="card-description">
              Edit your <strong>university class rows</strong> here (this is not the AI plan). To remove
              only the AI-generated study blocks and week view, use{" "}
              <strong>Remove AI / optimized plan</strong> in the calendar section below.{" "}
              <strong>Delete SCC timetable</strong> removes everything in SCC (classes + AI plan) but does{" "}
              <strong>not</strong> change Google Calendar.
            </p>
          </div>

          {universitySchedule.length === 0 && (
            <EmptyState
              title="No timetable yet"
              description="Add your first subject block to get started."
            />
          )}

          <div className="card-body">
            <div className="tt-editor-table-wrap">
              <table className="tt-editor-table">
                <thead>
                  <tr>
                    <th style={{ width: 260 }}>Title</th>
                    <th style={{ width: 160 }}>Code</th>
                    <th style={{ width: 210 }}>Start</th>
                    <th style={{ width: 210 }}>End</th>
                    <th style={{ width: 200 }}>Location</th>
                    <th style={{ width: 160 }}>Difficulty</th>
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
                          onChange={(e) =>
                            handleChangeEventField(index, "title", e.target.value)
                          }
                          placeholder="e.g. Data Structures Lecture"
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          value={event.subjectCode}
                          onChange={(e) =>
                            handleChangeEventField(index, "subjectCode", e.target.value)
                          }
                          placeholder="e.g. CS201"
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={toDateTimeLocalValue(event.start)}
                          onChange={(e) =>
                            handleChangeEventField(index, "start", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={toDateTimeLocalValue(event.end)}
                          onChange={(e) =>
                            handleChangeEventField(index, "end", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          value={event.location}
                          onChange={(e) =>
                            handleChangeEventField(index, "location", e.target.value)
                          }
                          placeholder="e.g. Room B12"
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={
                            difficultyLevels[event.subjectCode || event.title] ||
                            "medium"
                          }
                          onChange={(e) =>
                            handleChangeDifficulty(
                              event.subjectCode || event.title,
                              e.target.value
                            )
                          }
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-outline tt-editor-add-btn"
              onClick={handleAddEmptyEvent}
            >
              <Plus size={16} />
              Add subject block
            </button>
          </div>

          <div
            className="card-footer"
            style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}
          >
            <button
              type="button"
              className={`btn btn-outline ${saving ? "loading" : ""}`}
              onClick={() => persistUniversityTimetable({ isUpdate: true })}
              disabled={saving || universitySchedule.length === 0}
              title={
                "Push your edited rows to the server"
              }
            >
              <RefreshCw size={16} />
              Update timetable
            </button>
            <button
              type="button"
              className={`btn btn-outline ${deletingTimetable ? "loading" : ""}`}
              onClick={handleDeleteEntireTimetable}
              disabled={deletingTimetable}
              title="Removes SCC data and tries to delete events SCC previously synced to Google (tracked IDs only)."
            >
              <Trash2 size={16} />
              Delete SCC timetable
            </button>
          </div>
          <p className="form-hint" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            “Delete SCC timetable” clears SCC data and removes Google events that SCC created and still has on file.
            Use <strong>Reconnect Google</strong> if cleanup fails (permissions).
          </p>
        </div>

        <div
          className="card card-shine hover-glow fade-in"
          style={{ marginBottom: "2rem", animationDelay: "240ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} style={{ marginRight: 8 }} />
              Optimized schedule preview
            </h3>
            <p className="card-description">
              When you generate with AI or rules, this shows <strong>classes + study blocks</strong>. If
              you only see classes, the AI plan was cleared — your editable table above still has your
              university rows. Syncing to Google uses this view when an optimized plan exists.
            </p>
          </div>

          <div className="card-body">
            {!hasTimetable && (
              <EmptyState
                title="No schedule yet"
                description="Save a base timetable and generate an optimized plan to see your upcoming events."
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
            <div
              className="card-footer"
              style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}
            >
              <button
                type="button"
                className={`btn btn-outline btn-danger ${clearingAiPlan ? "loading" : ""}`}
                onClick={handleClearAiGeneratedPlan}
                disabled={clearingAiPlan}
                title="Keeps your university timetable table; removes only AI / optimized study blocks from SCC."
              >
                <Trash2 size={16} />
                Remove AI / optimized plan
              </button>
              <p className="form-hint" style={{ margin: 0, flex: "1 1 220px" }}>
                Removes the <strong>generated</strong> plan only — not your editable class rows. If you synced
                this plan to Google, SCC will try to delete those synced events (not unrelated personal events).
              </p>
            </div>
          )}
        </div>

        <div
          className="card card-shine hover-glow fade-in"
          style={{ marginBottom: "2rem", animationDelay: "280ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Sparkles size={20} style={{ marginRight: 8 }} />
              AI study advice
            </h3>
            <p className="card-description">
              Plain-language suggestions based on your classes and generated plan.
            </p>
          </div>
          <div className="card-body">
            {studySuggestions.length === 0 ? (
              <EmptyState
                title="No advice yet"
                description="Save or generate timetable first, then SCC will suggest study times in free slots."
              />
            ) : (
              <div className="profile-info">
                {studySuggestions.map((line, idx) => (
                  <div key={idx} className="profile-info-item">
                    <strong>Suggestion {idx + 1}</strong>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card card-shine hover-glow fade-in" style={{ marginBottom: "2rem", animationDelay: "320ms" }}>
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={20} style={{ marginRight: 8 }} />
              Google Calendar (read-only)
            </h3>
            <p className="card-description">
              This is your real Google Calendar. When you <strong>sync</strong>, SCC stores the IDs of events it
              creates so that <strong>Delete SCC timetable</strong> or <strong>Remove AI / optimized plan</strong>{" "}
              can remove those synced events automatically. Use <strong>Reconnect Google</strong> after an app update
              so your account has permission to delete those events. Events SCC synced before this feature (or if you
              never reconnected) may still need to be deleted manually in Google Calendar.
            </p>
          </div>

          <div className="card-body">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "var(--color-bg-primary)",
                    marginBottom: 16
                  }}
                >
                  <iframe
                    title="Google Calendar"
                    src={
                      import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL ||
                      "https://calendar.google.com/calendar/embed?mode=WEEK&wkst=1&bgcolor=%23ffffff&ctz=UTC"
                    }
                    style={{ width: "100%", height: 620, border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {googleEventsLoading ? (
                  <div className="loading-text">Loading Google events...</div>
                ) : googleEvents.length === 0 ? (
                  <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                    <h3 style={{ marginBottom: 6 }}>No upcoming Google events</h3>
                    <p style={{ margin: 0 }}>Your Google Calendar looks clear for now.</p>
                  </div>
                ) : (
                  <div className="profile-info">
                    {googleEvents.map((e) => (
                      <div key={e.id} className="profile-info-item">
                        <strong>{e.summary}</strong>
                        <span>
                          {e.start ? new Date(e.start).toLocaleString() : "—"} –{" "}
                          {e.end ? new Date(e.end).toLocaleString() : "—"}
                        </span>
                        {e.location ? <span>{e.location}</span> : null}
                        {e.htmlLink ? (
                          <a href={e.htmlLink} target="_blank" rel="noreferrer" className="nav-link" style={{ padding: 0 }}>
                            Open in Google Calendar
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card card-shine hover-glow fade-in" style={{ animationDelay: "360ms" }}>
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} style={{ marginRight: 8 }} />
              Tip
            </h3>
            <p className="card-description">
              Keep your timetable up to date. The calendar above updates automatically after you save or generate an optimized plan.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Timetable;

