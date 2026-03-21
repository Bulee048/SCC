import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchGroups, createGroup, joinGroup, setFilters, clearError,
} from "../features/groups/groupSlice";
import { logout } from "../features/auth/authSlice";
import {
  Plus, Search, Users, Lock, Globe, Tag, BookOpen,
  X, ChevronRight, SlidersHorizontal, Waves, LogOut,
  Home as HomeIcon, Brain, BookMarked, Video, LayoutDashboard,
  Shield, GraduationCap, Activity, Radio, Layers, Filter,
  UserPlus, Hash,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import * as THREE from "three";
import "../styles/Dashboard.css";
import "../styles/Groups.css";
import "../styles/Notifications.css";
import { confirmAction } from "../utils/toast";

/* ═══════════════════════════════════════════════════════════
   Ocean Background (reused from Dashboard)
═══════════════════════════════════════════════════════════ */
function useOceanBackground(wrapRef, canvasReady) {
  useEffect(() => {
    if (!canvasReady || !wrapRef.current) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    wrapRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a2134);
    scene.fog = new THREE.FogExp2(0x0d2940, 0.0165);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 8, 55);
    camera.lookAt(0, 0, 0);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
    const fPos = floorGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const x = fPos.getX(i), z = fPos.getZ(i);
      fPos.setY(i, Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.06) * 0.6);
    }
    fPos.needsUpdate = true;
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ color: 0x102d42 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -18;
    scene.add(floor);

    // God rays
    const raysGroup = new THREE.Group();
    for (let r = 0; r < 7; r++) {
      const ray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 3 + Math.random() * 4, 60, 6, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.03 + Math.random() * 0.03, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ray.position.set((Math.random() - 0.5) * 60, 10, (Math.random() - 0.5) * 30 - 10);
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
      pCol[i * 3] = cc.r; pCol[i * 3 + 1] = cc.g; pCol[i * 3 + 2] = cc.b;
    }
    plankGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    plankGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const plankMat = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const plankton = new THREE.Points(plankGeo, plankMat);
    scene.add(plankton);

    let frame = 0, animId;
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
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (wrapRef.current?.contains(renderer.domElement))
        wrapRef.current.removeChild(renderer.domElement);
    };
  }, [canvasReady]);
}

// ──────────────────────────────────────────────
// CREATE GROUP MODAL
// ──────────────────────────────────────────────
function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "", description: "", subject: "", courseCode: "",
    tags: "", isPublic: true, maxMembers: 30,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Group name is required");
    setBusy(true); setErr("");
    try {
      const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      await dispatch(createGroup({ ...form, tags })).unwrap();
      onClose();
    } catch (e) { setErr(typeof e === "string" ? e : "Failed to create group"); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content scale-in" style={{ maxWidth: "520px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={22} style={{ color: "var(--bio)" }} /> Create Study Group
          </h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <form id="create-group-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Group Name *</label>
              <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="CS3020 Study Group" maxLength={80} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject} onChange={e => set("subject", e.target.value)}
                  placeholder="Software Engineering" />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Course Code</label>
                <input className="form-input" value={form.courseCode} onChange={e => set("courseCode", e.target.value)}
                  placeholder="CS3020" />
              </div>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="What this group is about…" rows="2" style={{ resize: "vertical" }} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" value={form.tags} onChange={e => set("tags", e.target.value)}
                placeholder="algorithms, exam, project" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Visibility</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => set("isPublic", true)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "var(--radius-md)", cursor: "pointer",
                      border: `2px solid ${form.isPublic ? "var(--color-primary-500)" : "var(--color-border)"}`,
                      background: form.isPublic ? "rgba(42,157,143,0.15)" : "var(--color-bg-primary)",
                      color: form.isPublic ? "var(--bio)" : "var(--color-text-secondary)",
                      fontSize: "var(--font-size-xs)", fontWeight: 600
                    }}>
                    <Globe size={14} style={{ display: "inline", marginRight: "4px" }} /> Public
                  </button>
                  <button type="button" onClick={() => set("isPublic", false)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "var(--radius-md)", cursor: "pointer",
                      border: `2px solid ${!form.isPublic ? "var(--color-primary-500)" : "var(--color-border)"}`,
                      background: !form.isPublic ? "rgba(42,157,143,0.15)" : "var(--color-bg-primary)",
                      color: !form.isPublic ? "var(--bio)" : "var(--color-text-secondary)",
                      fontSize: "var(--font-size-xs)", fontWeight: 600
                    }}>
                    <Lock size={14} style={{ display: "inline", marginRight: "4px" }} /> Private
                  </button>
                </div>
                <span className="form-hint">{form.isPublic ? "Anyone can discover and join" : "Leader sends invitations"}</span>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Members ({form.maxMembers})</label>
                <input type="range" min={2} max={100} value={form.maxMembers}
                  onChange={e => set("maxMembers", parseInt(e.target.value))}
                  style={{ width: "100%", marginTop: "8px", accentColor: "var(--bio)" }} />
                <span className="form-hint">{form.maxMembers} students max</span>
              </div>
            </div>
            {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)" }}>{err}</p>}
          </form>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-group-form" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : <><Plus size={17} /> Create Group</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// GROUP CARD — Ocean HUD style
// ──────────────────────────────────────────────
function GroupCard({ group, currentUserId, onJoin, onOpen, joining }) {
  const isMember = group.members?.some(m => {
    const uid = m.user?._id || m.user;
    return uid?.toString() === currentUserId;
  });
  const memberCount = group.members?.length || 0;
  const isPrivate = !group.isPublic;

  return (
    <div
      className="grp-card"
      onClick={() => isMember && onOpen(group._id)}
      style={{ cursor: isMember ? "pointer" : "default" }}
    >
      {/* Top accent bar */}
      <div className="grp-card__accent" />

      {/* Header */}
      <div className="grp-card__head">
        <div className="grp-card__icon-wrap">
          <Users size={18} color="var(--abyss)" />
        </div>
        <span className={`grp-card__badge ${isPrivate ? "grp-card__badge--private" : "grp-card__badge--public"}`}>
          {isPrivate ? <><Lock size={10} /> Private</> : <><Globe size={10} /> Public</>}
        </span>
      </div>

      {/* Title */}
      <h3 className="grp-card__title">{group.name}</h3>

      {/* Meta */}
      <div className="grp-card__meta">
        {group.courseCode && (
          <span className="grp-card__meta-item">
            <BookOpen size={11} /> {group.courseCode}
          </span>
        )}
        {group.subject && (
          <span className="grp-card__meta-item">
            <Hash size={11} /> {group.subject}
          </span>
        )}
        <span className="grp-card__meta-item">
          <Users size={11} /> {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Description */}
      {group.description && (
        <p className="grp-card__desc">{group.description}</p>
      )}

      {/* Tags */}
      {group.tags?.length > 0 && (
        <div className="grp-card__tags">
          {group.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="grp-card__tag">
              <Tag size={9} /> {tag}
            </span>
          ))}
          {group.tags.length > 3 && (
            <span className="grp-card__tag">+{group.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="grp-card__foot">
        {isMember ? (
          <button className="grp-card__btn grp-card__btn--open"
            onClick={e => { e.stopPropagation(); onOpen(group._id); }}>
            Open <ChevronRight size={14} />
          </button>
        ) : isPrivate ? (
          <span className="grp-card__locked">
            <Lock size={11} /> Invite only
          </span>
        ) : (
          <button className="grp-card__btn grp-card__btn--join"
            disabled={joining[group._id]}
            onClick={e => { e.stopPropagation(); onJoin(group._id); }}>
            {joining[group._id] ? "Joining…" : <><UserPlus size={14} /> Join</>}
          </button>
        )}
        {isMember && (
          <span className="grp-card__member-badge">
            <span className="bio-dot" style={{ width: "5px", height: "5px" }} /> Member
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN Groups PAGE — Full-page Ocean Dashboard
// ──────────────────────────────────────────────
const Groups = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups, isLoading, error, filters } = useSelector(s => s.groups);
  const { user, isAuthenticated } = useSelector(s => s.auth);

  const [showCreate, setShowCreate] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [joining, setJoining] = useState({});

  const wrapRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRefCallback = (node) => {
    wrapRef.current = node;
    if (node) setCanvasReady(true);
  };
  useOceanBackground(wrapRef, canvasReady);

  useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(fetchGroups({ search: filters.search, myGroups: filters.myGroups }));
  }, [dispatch, filters.search, filters.myGroups]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setLocalSearch(val);
    dispatch(setFilters({ search: val }));
  }, [dispatch]);

  const handleJoin = async (groupId) => {
    setJoining(p => ({ ...p, [groupId]: true }));
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      navigate(`/groups/${groupId}`);
    } catch (e) { console.error(e); }
    finally { setJoining(p => ({ ...p, [groupId]: false })); }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", { confirmText: "Log out" });
    if (!confirmed) return;
    dispatch(logout());
    navigate("/login");
  };

  const navLinks = [
    { icon: <HomeIcon size={14} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={14} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Brain size={14} />, label: "Timetable", path: "/timetable" },
    { icon: <BookMarked size={14} />, label: "Notes", path: "/notes" },
    { icon: <Video size={14} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={14} />, label: "Groups", path: "/groups", active: true },
  ];

  const myGroupCount = groups.filter(g => g.members?.some(m => {
    const uid = m.user?._id || m.user;
    return uid?.toString() === user?._id;
  })).length;

  const publicCount = groups.filter(g => g.isPublic).length;

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#010810", color: "#2a9d8f", fontFamily: "Inter, sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <div className="db-root dashboard-page">
      {/* Ocean canvas */}
      <div className="db-canvas-wrap" ref={canvasRefCallback} />
      <div className="db-overlay-vignette" />

      <div className="db-layout">
        {/* ── Navbar ── */}
        <nav className="db-nav">
          <div className="db-nav__inner">
            <Link to="/dashboard" className="db-brand">
              <div className="db-brand__mark">
                <Waves size={16} color="#00f5c4" />
              </div>
              <div>
                <div className="db-brand__name">Smart Campus</div>
                <div className="db-brand__sub">Student Collaboration Hub</div>
              </div>
            </Link>

            <div className="db-nav__links">
              {navLinks.map((l, i) => (
                <Link key={i} to={l.path} className={`db-nav__link${l.active ? " db-nav__link--active" : ""}`}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>

            <div className="db-nav__right">
              <NotificationBell />
              <button className="db-top-btn" onClick={() => navigate("/profile")}>My Profile</button>
              <button className="db-top-btn db-top-btn--danger" onClick={handleLogout}>
                <LogOut size={13} /><span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="db-main">

          {/* ── Hero section ── */}
          <section className="db-hero db-hero--modern" style={{ animation: "riseIn .65s .05s ease both" }}>
            <div className="db-hero__left">
              <div className="db-hero__sys">
                <Users size={14} /> Study Groups
              </div>
              <h1 className="db-hero__name">Collaborate & Connect</h1>
              <p className="db-hero__sub">
                Join study groups, schedule hybrid meetups, share documents, and coordinate with your peers — all in one place.
              </p>
              <div className="db-hero__badges">
                {user.role && <span className="db-badge"><GraduationCap size={10} />{user.role}</span>}
                {user.department && <span className="db-badge"><Radio size={10} />{user.department}</span>}
                {user.year && <span className="db-badge"><Activity size={10} />Year {user.year}</span>}
                {user.studentId && <span className="db-badge"><Shield size={10} />{user.studentId}</span>}
              </div>
              <div className="db-shortcuts" style={{ marginTop: "1.2rem" }}>
                <button className="db-shortcut-btn" onClick={() => setShowCreate(true)}>
                  + Create Group
                </button>
                <button className="db-shortcut-btn" onClick={() => dispatch(setFilters({ myGroups: !filters.myGroups }))}>
                  {filters.myGroups ? "Browse All" : "My Groups"}
                </button>
              </div>
            </div>
            <div className="db-clock">
              <div className="db-clock__label">Quick Stats</div>
              <div className="db-clock__time" style={{ fontSize: "2.8rem" }}>{groups.length}</div>
              <div className="db-clock__date">Total Groups</div>
            </div>
          </section>

          {/* ── Stats row ── */}
          <section className="db-stats" style={{ animation: "riseIn .65s .15s ease both" }}>
            <div className="db-stat hover-glow" style={{ "--ac": "#2a9d8f" }}>
              <div className="db-stat__icon"><Users size={16} /></div>
              <div>
                <div className="db-stat__val">{groups.length}</div>
                <div className="db-stat__lbl">Available Groups</div>
              </div>
              <div className="db-stat__trend"><Layers size={9} /> Browse all</div>
            </div>
            <div className="db-stat hover-glow" style={{ "--ac": "#3b82f6" }}>
              <div className="db-stat__icon"><Shield size={16} /></div>
              <div>
                <div className="db-stat__val">{myGroupCount}</div>
                <div className="db-stat__lbl">My Groups</div>
              </div>
              <div className="db-stat__trend"><Activity size={9} /> Joined</div>
            </div>
            <div className="db-stat hover-glow" style={{ "--ac": "#7dd3fc" }}>
              <div className="db-stat__icon"><Globe size={16} /></div>
              <div>
                <div className="db-stat__val">{publicCount}</div>
                <div className="db-stat__lbl">Public Groups</div>
              </div>
              <div className="db-stat__trend"><UserPlus size={9} /> Join free</div>
            </div>
            <div className="db-stat hover-glow" style={{ "--ac": "#00ccff" }}>
              <div className="db-stat__icon"><Lock size={16} /></div>
              <div>
                <div className="db-stat__val">{groups.length - publicCount}</div>
                <div className="db-stat__lbl">Private Groups</div>
              </div>
              <div className="db-stat__trend"><Shield size={9} /> Invite only</div>
            </div>
          </section>

          {/* ── Filter bar ── */}
          <div className="grp-filter-bar" style={{ animation: "riseIn .65s .2s ease both" }}>
            <div className="grp-search-wrap">
              <Search size={15} className="grp-search-icon" />
              <input
                className="grp-search-input"
                value={localSearch}
                onChange={handleSearch}
                placeholder="Search groups by name, subject, or course…"
              />
            </div>
            <button
              className={`grp-filter-btn ${filters.myGroups ? "grp-filter-btn--active" : ""}`}
              onClick={() => dispatch(setFilters({ myGroups: !filters.myGroups }))}
            >
              <Filter size={14} />
              {filters.myGroups ? "My Groups" : "All Groups"}
            </button>
            <button className="grp-filter-btn grp-filter-btn--create" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Group
            </button>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="alert alert-error" style={{ animation: "riseIn .3s ease both" }}>
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => dispatch(clearError())}><X size={15} /></button>
            </div>
          )}

          {/* ── Content area ── */}
          <div style={{ animation: "riseIn .65s .3s ease both" }}>
            {/* Loading */}
            {isLoading && <LoadingSpinner text="Loading groups…" />}

            {/* Empty state */}
            {!isLoading && groups.length === 0 && (
              <div className="grp-empty">
                <div className="grp-empty__icon">
                  <Users size={52} strokeWidth={1} />
                </div>
                <h3 className="grp-empty__title">
                  {filters.myGroups ? "You haven't joined any groups yet" : "No groups found"}
                </h3>
                <p className="grp-empty__sub">
                  {filters.myGroups
                    ? "Create your own group or browse public groups to join"
                    : "Be the first to create a study group and start collaborating"}
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                  <button className="db-qa-btn db-qa-btn--primary" onClick={() => setShowCreate(true)} style={{ width: "auto", padding: "10px 20px" }}>
                    <Plus size={15} /> Create Group
                  </button>
                  {filters.myGroups && (
                    <button className="db-qa-btn" onClick={() => dispatch(setFilters({ myGroups: false }))} style={{ width: "auto", padding: "10px 20px" }}>
                      <Users size={15} /> Browse All
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Groups grid */}
            {!isLoading && groups.length > 0 && (
              <>
                <div className="grp-section-head">
                  <span className="db-sec-title">
                    {filters.myGroups ? "My Groups" : "All Study Groups"}
                  </span>
                  <span className="db-sec-count">{groups.length} group{groups.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grp-grid">
                  {groups.map(group => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      currentUserId={user?._id}
                      onJoin={handleJoin}
                      onOpen={(id) => navigate(`/groups/${id}`)}
                      joining={joining}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

        </main>
      </div>

      {/* Create Group Modal */}
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default Groups;
