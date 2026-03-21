import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import {
  Brain, BookMarked, Users, Calendar, Share2, GraduationCap,
  LogOut, ArrowRight, Home as HomeIcon,
  Video, Target, TrendingUp, Plus,
  Sparkles, ChevronRight, BookOpen, Activity,
  LayoutDashboard, Waves, Zap,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import "../styles/Dashboard.css";
import "../styles/Notifications.css";
import { confirmAction } from "../utils/toast";

export default function Dashboard() {
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", {
      confirmText: "Log out",
    });
    if (!confirmed) return;

    dispatch(logout());
    navigate("/login");
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };

  if (!user) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: isDark ? '#0a0f1a' : '#f5f7fa',
      color: isDark ? '#fff' : '#1e293b',
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
    }}>
      Loading...
    </div>
  );

  const primaryModules = [
    {
      icon: <Brain size={20} />, title: "AI Timetable",
      desc: "Generate practical weekly plans, reduce clashes, and keep your routine aligned with deadlines.",
      chips: ["AI Powered", "Calendar Sync", "Adaptive"],
      color: "#2a9d8f", gradient: "linear-gradient(135deg,#2a9d8f,#1f7a71)",
      pillColor: "#2a9d8f", pillBg: "rgba(42,157,143,.15)", pillBorder: "rgba(42,157,143,.3)",
      pill: "Core", path: "/timetable",
    },
    {
      icon: <BookMarked size={20} />, title: "Notes & Kuppi",
      desc: "Organize personal notes, discover shared content, and run focused peer sessions quickly.",
      chips: ["OneDrive", "Kuppi", "Social"],
      color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)",
      pillColor: "#3b82f6", pillBg: "rgba(59,130,246,.15)", pillBorder: "rgba(59,130,246,.3)",
      pill: "Available", path: "/notes",
    },
    {
      icon: <Users size={20} />, title: "Study Groups",
      desc: "Coordinate tasks in one place with faster communication and cleaner group collaboration.",
      chips: ["Channels", "Polls", "Collaboration"],
      color: "#2a9d8f", gradient: "linear-gradient(135deg,#2a9d8f,#256f66)",
      pillColor: "#2a9d8f", pillBg: "rgba(42,157,143,.12)", pillBorder: "rgba(42,157,143,.25)",
      pill: "Available", path: "/groups",
    },
  ];

  const secondaryModules = [
    { icon: <Target size={17} />, title: "Exam Mode", desc: "Structured exam preparation plans", color: "#2a9d8f", gradient: "linear-gradient(135deg,#2a9d8f,#1f7a71)", pill: "New", path: "/exam-mode" },
    { icon: <Calendar size={17} />, title: "Calendar", desc: "Events and study checkpoints", color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)", pill: null, path: "/calendar" },
    { icon: <Share2 size={17} />, title: "File Share", desc: "Fast resource sharing with peers", color: "#2a9d8f", gradient: "linear-gradient(135deg,#3ea89a,#2a7d73)", pill: null, path: "/files" },
  ];

  const stats = [
    { icon: <BookOpen size={16} />, val: "24", lbl: "Notes Shared", trend: "+12% this week", ac: "#00f5c4" },
    { icon: <Users size={16} />, val: "5", lbl: "Study Groups", trend: "2 active now", ac: "#00aaff" },
    { icon: <Calendar size={16} />, val: "8", lbl: "Events Today", trend: "Next at 2 PM", ac: "#7fffd4" },
    { icon: <Target size={16} />, val: "12", lbl: "Active Tasks", trend: "3 due soon", ac: "#00ccff" },
  ];

  const quickActions = [
    { icon: <Plus size={13} />, label: "New Timetable", path: "/timetable", primary: true },
    { icon: <BookMarked size={13} />, label: "Share Notes", path: "/notes" },
    { icon: <Video size={13} />, label: "Create Kuppi", path: "/kuppi" },
    { icon: <Users size={13} />, label: "New Group", path: "/groups" },
  ];

  const navLinks = [
    { icon: <HomeIcon size={14} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={14} />, label: "Dashboard", path: "/dashboard", active: true },
    { icon: <Brain size={14} />, label: "Timetable", path: "/timetable" },
    { icon: <BookMarked size={14} />, label: "Notes", path: "/notes" },
    { icon: <Video size={14} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={14} />, label: "Groups", path: "/groups" },
  ];

  const shortcuts = [
    { label: "Open Timetable", path: "/timetable" },
    { label: "Open Notes", path: "/notes" },
    { label: "Create Kuppi", path: "/kuppi" },
  ];

  return (
    <div className="db-root dashboard-page">
      {/* Simple gradient background – no Three.js */}
      <div className="db-bg-gradient" />

      <div className="db-layout">

        {/* ── Navbar ── */}
        <nav className="db-nav">
          <div className="db-nav__inner">
            <Link to="/dashboard" className="db-brand">
              <div>
                <div className="db-brand__name">Smart Campus Companion</div>
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
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="db-main">

          {/* Hero */}
          <section className="db-hero db-hero--modern">
            <div className="db-hero__left">
              <div className="db-hero__sys">{getGreeting()}</div>
              <h1 className="db-hero__name">{user.name}</h1>
              <p className="db-hero__sub">
                All your study tools are centralized here. Track your progress, access resources, and move quickly through your day.
              </p>

              <div className="db-shortcuts">
                {shortcuts.map((item) => (
                  <button key={item.path} className="db-shortcut-btn" onClick={() => navigate(item.path)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-clock">
              <div className="db-clock__label">Current Time</div>
              <div className="db-clock__time">
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
              <div className="db-clock__date">
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="db-stats">
            {stats.map((s, i) => (
              <div key={i} className="db-stat hover-glow" style={{ "--ac": s.ac }}>
                <div className="db-stat__icon">{s.icon}</div>
                <div>
                  <div className="db-stat__val">{s.val}</div>
                  <div className="db-stat__lbl">{s.lbl}</div>
                </div>
                <div className="db-stat__trend"><TrendingUp size={9} />{s.trend}</div>
              </div>
            ))}
          </section>

          {/* Grid */}
          <div className="db-grid">
            <div className="db-grid-left">
              {/* Primary */}
              <div className="db-sec-head">
                <span className="db-sec-title">Core Modules</span>
                <span className="db-sec-count">{primaryModules.length} Active</span>
              </div>
              <div className="db-cards-p">
                {primaryModules.map((m, i) => (
                  <Link key={i} to={m.path} className="db-card-p card-shine hover-glow">
                    <div className="db-card-p__head">
                      <div className="db-card-p__icon" style={{ background: m.gradient }}>
                        {m.icon}
                      </div>
                      <span className="db-card-p__pill" style={{
                        color: m.pillColor,
                        background: m.pillBg,
                        borderColor: m.pillBorder,
                      }}>{m.pill}</span>
                    </div>
                    <div className="db-card-p__title">{m.title}</div>
                    <div className="db-card-p__desc">{m.desc}</div>
                    <div className="db-card-p__chips">
                      {m.chips.map((c, ci) => (
                        <span key={ci} className="db-chip"><Zap size={8} /> {c}</span>
                      ))}
                    </div>
                    <div className="db-card-p__foot">
                      <span className="db-card-p__status">
                        <span className="bio-dot" /> Ready
                      </span>
                      <ArrowRight size={14} className="db-card-p__arrow" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Secondary */}
              <div className="db-sec-head" style={{ marginTop: "1.4rem" }}>
                <span className="db-sec-title">More Tools</span>
              </div>
              <div className="db-cards-s db-cards-s--modern">
                {secondaryModules.map((m, i) => (
                  <Link key={i} to={m.path} className="db-card-row card-shine hover-glow">
                    <div className="db-card-row__icon" style={{ background: m.gradient }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="db-card-row__title">
                        {m.title}
                        {m.pill && (
                          <span className="db-card-p__pill" style={{
                            fontSize: "8px", padding: "2px 6px",
                            color: m.color,
                            background: `${m.color}18`,
                            borderColor: `${m.color}35`,
                          }}>{m.pill}</span>
                        )}
                      </div>
                      <div className="db-card-row__desc">{m.desc}</div>
                    </div>
                    <ChevronRight size={14} className="db-card-row__arrow" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="db-sidebar db-sidebar--modern">
              <div className="db-side-card uiverse-glass">
                <div className="db-side-title">Quick Actions</div>
                <div className="db-qa-list">
                  {quickActions.map((a, i) => (
                    <button key={i}
                      className={`db-qa-btn${a.primary ? " db-qa-btn--primary" : ""}`}
                      onClick={() => navigate(a.path)}>
                      {a.icon}<span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="db-side-card uiverse-glass">
                <div className="db-side-title">Upcoming Events</div>
                <div className="db-empty">
                  <Calendar size={24} strokeWidth={1.2} className="db-empty__icon" />
                  <div className="db-empty__title">No Upcoming Events</div>
                  <div className="db-empty__sub">Your schedule is clear</div>
                </div>
              </div>

              <div className="db-side-card uiverse-glass">
                <div className="db-side-head-row">
                  <div className="db-side-title" style={{ marginBottom: 0 }}>Recent Activity</div>
                  <Link to="/notifications" className="db-side-link">View All <ChevronRight size={10} /></Link>
                </div>
                <div className="db-empty">
                  <Sparkles size={24} strokeWidth={1.2} className="db-empty__icon" />
                  <div className="db-empty__title">No Recent Activity</div>
                  <div className="db-empty__sub">You're all caught up</div>
                </div>
              </div>
            </aside>
          </div>

        </main>
      </div>
    </div>
  );
}