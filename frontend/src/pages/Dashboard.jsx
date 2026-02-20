import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Users, 
  Calendar, 
  Share2, 
  Vote, 
  GraduationCap,
  LogOut,
  ArrowRight,
  CheckCircle,
  Clock
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  const dashboardItems = [
    {
      icon: <BookOpen size={28} />,
      title: "Academic Schedule",
      description: "View your classes and attendance tracking",
      status: "coming-soon",
      color: "#667eea",
      path: null
    },
    {
      icon: <FileText size={28} />,
      title: "Assignments",
      description: "Track deadlines and manage submissions",
      status: "coming-soon",
      color: "#f5576c",
      path: null
    },
    {
      icon: <Brain size={28} />,
      title: "AI Timetable",
      description: "Generate personalized study schedules",
      status: "coming-soon",
      color: "#00f2fe",
      path: null
    },
    {
      icon: <Users size={28} />,
      title: "Study Groups",
      description: "Collaborate with peers in real-time",
      status: "available",
      color: "#43e97b",
      path: "/groups"
    },
    {
      icon: <Calendar size={28} />,
      title: "Calendar Integration",
      description: "Sync with Google Calendar and more",
      status: "coming-soon",
      color: "#fa709a",
      path: null
    },
    {
      icon: <Share2 size={28} />,
      title: "Notes Sharing",
      description: "Share and access study materials",
      status: "coming-soon",
      color: "#30cfd0",
      path: null
    },
    {
      icon: <Vote size={28} />,
      title: "Polls & Meetings",
      description: "Schedule and participate in group meetings",
      status: "coming-soon",
      color: "#a8edea",
      path: null
    },
    {
      icon: <GraduationCap size={28} />,
      title: "Exam Mode",
      description: "AI-powered exam preparation tools",
      status: "coming-soon",
      color: "#fbc2eb",
      path: null
    }
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav fade-in">
        <div className="nav-brand">
          <GraduationCap size={32} style={{ color: 'var(--color-primary-600)' }} />
          <h2>Smart Campus</h2>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">
            Dashboard
          </Link>
          <Link to="/groups" className="nav-link">
            Study Groups
          </Link>
          <Link to="/" className="nav-link">
            Home
          </Link>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section fade-in">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1>Welcome back, {user.name}! 👋</h1>
            <p className="user-info">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              {user.studentId && ` • ID: ${user.studentId}`}
              {user.department && ` • ${user.department}`}
              {user.year && ` • Year ${user.year}`}
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          {dashboardItems.map((item, index) => {
            const CardWrapper = item.path ? Link : 'div';
            const cardProps = item.path ? { to: item.path } : {};

            return (
              <CardWrapper
                key={index}
                {...cardProps}
                className={`dashboard-card ${item.path ? 'link-card' : ''} slide-in`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div 
                  style={{ 
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-xl)',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-md)',
                    color: item.color,
                    transition: 'all var(--transition-base)'
                  }}
                  className="card-icon"
                >
                  {item.icon}
                </div>
                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{item.title}</h3>
                <p style={{ marginBottom: 'var(--spacing-md)' }}>{item.description}</p>
                {item.status === 'available' ? (
                  <span className="available-now">
                    <CheckCircle size={14} />
                    Available Now
                    <ArrowRight size={14} />
                  </span>
                ) : (
                  <span className="coming-soon">
                    <Clock size={14} />
                    Coming Soon
                  </span>
                )}
              </CardWrapper>
            );
          })}
        </div>

        <div className="card profile-section fade-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h3 className="card-title">Your Profile</h3>
            <p className="card-description">Manage your account information</p>
          </div>
          <div className="profile-info">
            <div className="profile-info-item">
              <strong>Name:</strong>
              <span>{user.name}</span>
            </div>
            <div className="profile-info-item">
              <strong>Email:</strong>
              <span>{user.email}</span>
            </div>
            <div className="profile-info-item">
              <strong>Role:</strong>
              <span className="badge badge-primary">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
            {user.studentId && (
              <div className="profile-info-item">
                <strong>Student ID:</strong>
                <span>{user.studentId}</span>
              </div>
            )}
            {user.department && (
              <div className="profile-info-item">
                <strong>Department:</strong>
                <span>{user.department}</span>
              </div>
            )}
            {user.year && (
              <div className="profile-info-item">
                <strong>Year:</strong>
                <span>Year {user.year}</span>
              </div>
            )}
            <div className="profile-info-item">
              <strong>Account Status:</strong>
              <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                {user.isVerified ? (
                  <>
                    <CheckCircle size={12} />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock size={12} />
                    Pending
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
