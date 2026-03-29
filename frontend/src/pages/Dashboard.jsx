// Dashboard.jsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import {
  Brain, BookMarked, Users, Calendar, Share2, GraduationCap,
  LogOut, ArrowRight, Home as HomeIcon,
  Video, Target, TrendingUp, Plus,
  Sparkles, ChevronRight, BookOpen, Activity,
  LayoutDashboard, Zap, Clock, Award,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
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

  if (!user) {
    return (
      <div className="dashboard-loading" data-theme={theme}>
        Loading...
      </div>
    );
  }

  // Core modules – primary tools
  const primaryModules = [
    {
      icon: <Brain size={24} />,
      title: "AI Timetable",
      desc: "Generate adaptive weekly plans, avoid clashes, and sync with deadlines.",
      color: "#2a9d8f",
      path: "/timetable",
      badge: "AI Powered",
    },
    {
      icon: <BookMarked size={24} />,
      title: "Notes & Kuppi",
      desc: "Organise personal notes, share resources, and run peer sessions.",
      color: "#3b82f6",
      path: "/notes",
      badge: "Collaborative",
    },
    {
      icon: <Users size={24} />,
      title: "Study Groups",
      desc: "Chat, share files, and coordinate tasks with your group members.",
      color: "#8b5cf6",
      path: "/groups",
      badge: "Active",
    },
  ];

  // Secondary tools – compact cards
  const secondaryModules = [
    { icon: <Target size={18} />, title: "Exam Mode", desc: "Focused preparation plans", color: "#f97316", path: "/exam-mode" },
    { icon: <Calendar size={18} />, title: "Calendar", desc: "Events and study deadlines", color: "#06b6d4", path: "/calendar" },
    { icon: <Share2 size={18} />, title: "File Share", desc: "Fast resource sharing", color: "#10b981", path: "/files" },
  ];

  // Stats – key metrics
  const stats = [
    { icon: <BookOpen size={20} />, value: "24", label: "Notes Shared", trend: "+12% this week", color: "#10b981" },
    { icon: <Users size={20} />, value: "5", label: "Study Groups", trend: "2 active now", color: "#3b82f6" },
    { icon: <Calendar size={20} />, value: "8", label: "Events Today", trend: "Next at 2 PM", color: "#8b5cf6" },
    { icon: <Target size={20} />, value: "12", label: "Active Tasks", trend: "3 due soon", color: "#f59e0b" },
  ];

  // Quick actions
  const quickActions = [
    { icon: <Plus size={16} />, label: "New Timetable", path: "/timetable", primary: true },
    { icon: <Video size={16} />, label: "Create Kuppi", path: "/kuppi" },
    { icon: <Users size={16} />, label: "New Group", path: "/groups" },
    { icon: <Share2 size={16} />, label: "Share Notes", path: "/notes" },
  ];

  // Nav links (used in header)
  const navLinks = [
    { icon: <HomeIcon size={16} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", path: "/dashboard", active: true },
    { icon: <Brain size={16} />, label: "Timetable", path: "/timetable" },
    { icon: <BookMarked size={16} />, label: "Notes", path: "/notes" },
    { icon: <Video size={16} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={16} />, label: "Groups", path: "/groups" },
  ];

  return (
    <div className="dashboard" data-theme={theme}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link to="/dashboard" className="dashboard-logo">
            <span className="dashboard-logo__icon">🧠</span>
            <span className="dashboard-logo__text">Smart Campus</span>
          </Link>

          <nav className="dashboard-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`dashboard-nav__link ${link.active ? "active" : ""}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="dashboard-actions">
            <NotificationBell />
            <button className="dashboard-profile-btn" onClick={() => navigate("/profile")}>
              <span className="dashboard-avatar">
                {user.name?.charAt(0) || "U"}
              </span>
              <span className="dashboard-profile-name">{user.name?.split(" ")[0]}</span>
            </button>
            <button className="dashboard-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Hero Section */}
          <section className="dashboard-hero">
            <div>
              <div className="dashboard-hero__greeting">{getGreeting()}</div>
              <h1 className="dashboard-hero__name">{user.name}</h1>
              <p className="dashboard-hero__desc">
                Your study hub is ready. Track progress, access tools, and stay on top of your goals.
              </p>
              <div className="dashboard-hero__shortcuts">
                <button onClick={() => navigate("/timetable")}>Open Timetable</button>
                <button onClick={() => navigate("/notes")}>View Notes</button>
                <button onClick={() => navigate("/groups")}>Study Groups</button>
              </div>
            </div>
            <div className="dashboard-time">
              <div className="dashboard-time__label">
                <Clock size={14} /> Current Time
              </div>
              <div className="dashboard-time__value">
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="dashboard-time__date">
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="dashboard-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card" style={{ "--accent": stat.color }}>
                <div className="stat-card__icon">{stat.icon}</div>
                <div>
                  <div className="stat-card__value">{stat.value}</div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
                <div className="stat-card__trend">
                  <TrendingUp size={12} />
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Two‑column layout */}
          <div className="dashboard-grid">
            {/* Left column: Modules */}
            <div className="dashboard-modules">
              {/* Primary modules */}
              <div className="section-header">
                <h2>Core Tools</h2>
                <span className="section-badge">{primaryModules.length} active</span>
              </div>
              <div className="primary-modules">
                {primaryModules.map((mod, idx) => (
                  <Link key={idx} to={mod.path} className="primary-card">
                    <div className="primary-card__icon" style={{ backgroundColor: mod.color + "15", color: mod.color }}>
                      {mod.icon}
                    </div>
                    <div className="primary-card__content">
                      <div className="primary-card__title">
                        {mod.title}
                        {mod.badge && <span className="primary-card__badge">{mod.badge}</span>}
                      </div>
                      <p className="primary-card__desc">{mod.desc}</p>
                      <div className="primary-card__action">
                        <span>Explore</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Secondary modules */}
              <div className="section-header" style={{ marginTop: "2rem" }}>
                <h2>More Tools</h2>
              </div>
              <div className="secondary-modules">
                {secondaryModules.map((mod, idx) => (
                  <Link key={idx} to={mod.path} className="secondary-card">
                    <div className="secondary-card__icon" style={{ backgroundColor: mod.color + "15", color: mod.color }}>
                      {mod.icon}
                    </div>
                    <div className="secondary-card__info">
                      <div className="secondary-card__title">{mod.title}</div>
                      <div className="secondary-card__desc">{mod.desc}</div>
                    </div>
                    <ChevronRight size={16} className="secondary-card__arrow" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="dashboard-sidebar">
              {/* Quick Actions */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Quick Actions</div>
                <div className="quick-actions">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`quick-action ${action.primary ? "primary" : ""}`}
                      onClick={() => navigate(action.path)}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming Events – placeholder */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Upcoming Events</div>
                <div className="placeholder-state">
                  <Calendar size={32} strokeWidth={1.2} />
                  <p>No events scheduled</p>
                  <span>Your calendar is clear</span>
                </div>
              </div>

              {/* Recent Activity – placeholder */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Recent Activity</div>
                <div className="placeholder-state">
                  <Sparkles size={32} strokeWidth={1.2} />
                  <p>Nothing new</p>
                  <span>You're all caught up</span>
                </div>
              </div>

              {/* Optional: Study streak */}
              <div className="sidebar-card streak-card">
                <div className="streak-icon">
                  <Award size={24} />
                </div>
                <div>
                  <div className="streak-value">7 day streak</div>
                  <div className="streak-label">Keep it going! 🔥</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}