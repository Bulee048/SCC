import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Select from 'react-select';
import "../styles/Home.css";

// ----------------------------------------------------------------------
// API endpoints – replace with your real URLs when ready
// ----------------------------------------------------------------------
const API = {
  weather: {
    current: (city) => `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=YOUR_API_KEY`,
    forecast: (city) => `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=YOUR_API_KEY`,
  },
  news: 'https://campus-api.example.com/news',
  events: 'https://campus-api.example.com/events',
  rooms: 'https://campus-api.example.com/rooms',
  analytics: 'https://campus-api.example.com/analytics',
  userActivity: 'wss://campus-api.example.com/activity',
};

// ----------------------------------------------------------------------
// Rich mock data (ensures no empty sections)
// ----------------------------------------------------------------------
const mockWeather = {
  current: { temp: 22, condition: 'Sunny', icon: '☀️' },
  forecast: [
    { day: 'Mon', temp: 23, icon: '☀️' },
    { day: 'Tue', temp: 21, icon: '⛅' },
    { day: 'Wed', temp: 19, icon: '🌧️' },
    { day: 'Thu', temp: 20, icon: '☁️' },
    { day: 'Fri', temp: 22, icon: '☀️' },
  ],
};

const mockNews = [
  { id: 1, title: 'New Library Hours', date: '2025-03-20', excerpt: 'Extended study hours during finals.' },
  { id: 2, title: 'Hackathon 2025', date: '2025-03-18', excerpt: 'Register now for the annual hackathon.' },
  { id: 3, title: 'Guest Lecture: AI in Education', date: '2025-03-15', excerpt: 'Dr. Smith shares insights.' },
];

const mockEvents = [
  { id: 1, title: 'CS50 Info Session', date: '2025-03-25', time: '3:00 PM', location: 'Zoom' },
  { id: 2, title: 'Career Fair', date: '2025-03-28', time: '10:00 AM', location: 'Student Union' },
  { id: 3, title: 'Yoga Class', date: '2025-03-22', time: '5:00 PM', location: 'Gym' },
];

const mockRooms = [
  { id: 'A101', available: true, capacity: 30 },
  { id: 'B202', available: false, capacity: 20 },
  { id: 'C303', available: true, capacity: 15 },
  { id: 'D404', available: true, capacity: 25 },
];

const mockAnalytics = [
  { month: 'Jan', completion: 65 },
  { month: 'Feb', completion: 70 },
  { month: 'Mar', completion: 80 },
  { month: 'Apr', completion: 78 },
  { month: 'May', completion: 85 },
];

const mockActivity = [
  { user: 'Alice', action: 'joined study group', time: '2 min ago' },
  { user: 'Bob', action: 'completed CS50 assignment', time: '5 min ago' },
  { user: 'Charlie', action: 'posted in forum', time: '10 min ago' },
  { user: 'Dana', action: 'created new event', time: '15 min ago' },
];

// ----------------------------------------------------------------------
// Static content (features, how‑it‑works, etc.)
// ----------------------------------------------------------------------
const pageData = {
  sections: {
    featuresBadge: 'POWERFUL FEATURES',
    featuresTitle: 'Everything you need to ',
    featuresTitleHighlight: 'excel academically',
    howItWorksBadge: 'HOW IT WORKS',
    howItWorksTitle: 'Get started in ',
    howItWorksTitleHighlight: 'three simple steps',
    useCasesBadge: 'USE CASES',
    useCasesTitle: 'Built for every ',
    useCasesTitleHighlight: 'campus workflow',
    testimonialsBadge: 'TESTIMONIALS',
    testimonialsTitle: 'Trusted by ',
    testimonialsTitleHighlight: 'students and educators',
    pricingBadge: 'PRICING',
    pricingTitle: 'One plan. ',
    pricingTitleHighlight: 'Forever free.',
    faqBadge: 'FAQ',
    faqTitle: 'Questions? ',
    faqTitleHighlight: 'We have answers',
    blogBadge: 'BLOG',
    blogTitle: 'From the ',
    blogTitleHighlight: 'CampusIQ team',
  },
  features: [
    { icon: '🎓', title: 'Smart Planning', description: 'Plan classes and deadlines intelligently.', stats: 'Always organized' },
    { icon: '🤝', title: 'Group Collaboration', description: 'Create and manage study groups with ease.', stats: 'Faster teamwork' },
    { icon: '📊', title: 'Progress Insights', description: 'Track academic momentum and completion trends.', stats: 'Clear progress' },
  ],
  howItWorks: [
    { step: '1', title: 'Create Account', description: 'Sign up and set your academic profile.' },
    { step: '2', title: 'Connect Tools', description: 'Add courses, groups, and schedules.' },
    { step: '3', title: 'Stay on Track', description: 'Use reminders, analytics, and collaboration.' },
  ],
  useCases: [
    { icon: '🗓️', title: 'Schedule Management', description: 'Organize class schedules and deadlines in one place.' },
    { icon: '💬', title: 'Peer Communication', description: 'Share updates and coordinate with classmates.' },
    { icon: '📚', title: 'Study Coordination', description: 'Plan sessions and monitor shared progress.' },
  ],
  pricing: {
    title: 'CampusIQ Free',
    subtitle: 'All core features included for students and educators.',
    features: ['Unlimited groups', 'Smart reminders', 'Analytics dashboard', 'Collaboration tools'],
  },
  faqs: [
    { question: 'Is CampusIQ really free?', answer: 'Yes. Core features are free with no trial window.' },
    { question: 'Can I use it with classmates?', answer: 'Yes. You can create groups and collaborate in real time.' },
    { question: 'Does it work on mobile?', answer: 'Yes. The app is designed to be responsive across devices.' },
  ],
};

const testimonials = [
  { name: 'Maya Chen', role: 'Student, Engineering', rating: 5, content: 'CampusIQ helps me manage classes and projects without chaos.' },
  { name: 'Noah Patel', role: 'Teaching Assistant', rating: 5, content: 'Group coordination and reminders are extremely useful.' },
  { name: 'Dr. Elena Ruiz', role: 'Professor', rating: 5, content: 'A practical platform for improving student organization.' },
];

const blogPosts = [
  { title: 'How to Build a Better Study Routine', date: '2026-02-01', excerpt: 'Simple structure for consistent weekly progress.', slug: 'better-study-routine' },
  { title: 'Managing Group Work Without Burnout', date: '2026-01-22', excerpt: 'Use shared ownership and smart deadlines.', slug: 'group-work-without-burnout' },
  { title: 'Three Metrics That Actually Matter', date: '2026-01-10', excerpt: 'Focus on completion, consistency, and collaboration.', slug: 'three-metrics-that-matter' },
];

// ----------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------
const getWeatherIcon = (code) => {
  const map = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️', '03d': '☁️',
    '04d': '☁️', '09d': '🌧️', '10d': '🌦️', '11d': '⛈️', '13d': '❄️', '50d': '🌫️',
  };
  return map[code] || '☀️';
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const Home = () => {
  // UI state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Data state
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Loading & error
  const [loading, setLoading] = useState({
    weather: false,
    news: false,
    events: false,
    rooms: false,
    analytics: false,
  });
  const [error, setError] = useState({});

  // Data source toggle
  const [useMock, setUseMock] = useState(true);

  // City selector
  const [city, setCity] = useState('New York');
  const cityOptions = [
    { value: 'New York', label: 'New York' },
    { value: 'London', label: 'London' },
    { value: 'Tokyo', label: 'Tokyo' },
    { value: 'Sydney', label: 'Sydney' },
  ];

  // Refs for scrolling
  const heroRef = useRef(null);
  const weatherRef = useRef(null);
  const newsRef = useRef(null);
  const roomsRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  // --------------------------------------------------------------------
  // AOS animation simulation (since we don't import AOS library)
  // --------------------------------------------------------------------
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-aos]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // --------------------------------------------------------------------
  // Data fetching functions
  // --------------------------------------------------------------------
  const fetchWeather = useCallback(async (selectedCity) => {
    if (useMock) {
      setWeather(mockWeather.current);
      setForecast(mockWeather.forecast);
      return;
    }
    setLoading(prev => ({ ...prev, weather: true }));
    setError(prev => ({ ...prev, weather: null }));
    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(API.weather.current(selectedCity)),
        fetch(API.weather.forecast(selectedCity)),
      ]);
      if (!currentRes.ok || !forecastRes.ok) throw new Error('Weather fetch failed');
      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      setWeather({
        temp: currentData.main.temp,
        condition: currentData.weather[0].main,
        icon: getWeatherIcon(currentData.weather[0].icon),
      });

      // Get one forecast per day (approx.)
      const daily = forecastData.list.filter((_, idx) => idx % 8 === 0).map(item => ({
        day: new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' }),
        temp: item.main.temp,
        icon: getWeatherIcon(item.weather[0].icon),
      }));
      setForecast(daily);
    } catch (err) {
      setError(prev => ({ ...prev, weather: err.message }));
      // Fallback to mock
      setWeather(mockWeather.current);
      setForecast(mockWeather.forecast);
    } finally {
      setLoading(prev => ({ ...prev, weather: false }));
    }
  }, [useMock]);

  const fetchNews = useCallback(async () => {
    if (useMock) {
      setNews(mockNews);
      return;
    }
    setLoading(prev => ({ ...prev, news: true }));
    setError(prev => ({ ...prev, news: null }));
    try {
      const res = await fetch(API.news);
      if (!res.ok) throw new Error('News fetch failed');
      const data = await res.json();
      setNews(data);
    } catch (err) {
      setError(prev => ({ ...prev, news: err.message }));
      setNews(mockNews);
    } finally {
      setLoading(prev => ({ ...prev, news: false }));
    }
  }, [useMock]);

  const fetchEvents = useCallback(async () => {
    if (useMock) {
      setEvents(mockEvents);
      return;
    }
    setLoading(prev => ({ ...prev, events: true }));
    setError(prev => ({ ...prev, events: null }));
    try {
      const res = await fetch(API.events);
      if (!res.ok) throw new Error('Events fetch failed');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(prev => ({ ...prev, events: err.message }));
      setEvents(mockEvents);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [useMock]);

  const fetchRooms = useCallback(async () => {
    if (useMock) {
      setRooms(mockRooms);
      return;
    }
    setLoading(prev => ({ ...prev, rooms: true }));
    setError(prev => ({ ...prev, rooms: null }));
    try {
      const res = await fetch(API.rooms);
      if (!res.ok) throw new Error('Rooms fetch failed');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError(prev => ({ ...prev, rooms: err.message }));
      setRooms(mockRooms);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, [useMock]);

  const fetchAnalytics = useCallback(async () => {
    if (useMock) {
      setAnalytics(mockAnalytics);
      return;
    }
    setLoading(prev => ({ ...prev, analytics: true }));
    setError(prev => ({ ...prev, analytics: null }));
    try {
      const res = await fetch(API.analytics);
      if (!res.ok) throw new Error('Analytics fetch failed');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(prev => ({ ...prev, analytics: err.message }));
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [useMock]);

  // Live activity simulation
  useEffect(() => {
    let interval;
    if (!useMock) {
      // WebSocket or polling
      interval = setInterval(() => {
        const newActivity = {
          user: `User${Math.floor(Math.random() * 100)}`,
          action: ['joined study group', 'completed task', 'posted question'][Math.floor(Math.random() * 3)],
          time: new Date().toLocaleTimeString(),
        };
        setActivityLog(prev => [...prev.slice(-4), newActivity]);
      }, 5000);
    } else {
      setActivityLog(mockActivity);
    }
    return () => clearInterval(interval);
  }, [useMock]);

  // Initial data load
  useEffect(() => {
    fetchWeather(city);
    fetchNews();
    fetchEvents();
    fetchRooms();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMock]); // city not included to avoid re-fetch on city change (handled separately)

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // Stats for hero area (dynamic)
  const statsData = [
    { icon: '👥', value: '10K+', label: 'Active Students' },
    { icon: '📰', value: news.length || 3, label: 'Campus Updates' },
    { icon: '📅', value: events.length || 3, label: 'Upcoming Events' },
    { icon: '🏫', value: rooms.filter(r => r.available).length || 2, label: 'Rooms Available' },
  ];

  return (
    <div className="home">
      {/* -------------------- Navigation -------------------- */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">Campus<span className="logo-highlight">IQ</span></span>
          </Link>

          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span><span></span><span></span>
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
            <button onClick={() => scrollToSection(weatherRef)} className="nav-link">Weather</button>
            <button onClick={() => scrollToSection(newsRef)} className="nav-link">News</button>
            <button onClick={() => scrollToSection(roomsRef)} className="nav-link">Rooms</button>
            <button onClick={() => scrollToSection(pricingRef)} className="nav-link">Pricing</button>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="nav-login">Sign In</Link>
            <Link to="/register" className="nav-register">Get Started – It's Free</Link>
          </div>
        </div>
      </nav>

      {/* -------------------- Hero Section -------------------- */}
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-particles">
            {Array.from({ length: 16 }).map((_, idx) => (
              <span
                key={idx}
                className="particle"
                style={{
                  left: `${(idx % 8) * 12 + 5}%`,
                  top: `${Math.floor(idx / 8) * 30 + 20}%`,
                  animationDelay: `${idx * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">✨ FREE FOR EVERYONE</span>
            <h1 className="hero-title">
              Study smarter with <span className="gradient-text">CampusIQ</span>
            </h1>
            <p className="hero-description">
              Organize classes, collaborate with peers, and track progress — all in one modern student workspace, completely free.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="cta-primary">Get Started Free</Link>
              <Link to="/login" className="cta-secondary">Sign In</Link>
            </div>
            <div className="hero-trust">
              <span>✓ No credit card</span>
              <span>•</span>
              <span>✓ Free forever</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-1">📚 Smart Planning</div>
            <div className="floating-card card-2">🤝 Group Study</div>
            <div className="floating-card card-3">📈 Live Insights</div>
          </div>
        </div>

        <button className="hero-scroll" onClick={() => scrollToSection(weatherRef)}>
          Explore live widgets
          <span className="scroll-dot"></span>
        </button>
      </section>

      {/* -------------------- Quick Stats -------------------- */}
      <section className="stats">
        <div className="stats-container">
          {statsData.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Data Source Toggle -------------------- */}
      <div className="data-source-toggle">
        <span>Data source:</span>
        <button className={useMock ? 'active' : ''} onClick={() => setUseMock(true)}>Mock</button>
        <button className={!useMock ? 'active' : ''} onClick={() => setUseMock(false)}>Live API</button>
      </div>

      {/* -------------------- Weather Widget -------------------- */}
      <section className="weather-widget" ref={weatherRef}>
        <div className="section-header">
          <span className="section-badge">LIVE WEATHER</span>
          <h2 className="section-title">Campus <span className="gradient-text">Weather</span></h2>
        </div>
        <div className="weather-container">
          <div className="city-selector">
            <Select
              options={cityOptions}
              value={cityOptions.find(opt => opt.value === city)}
              onChange={(opt) => { setCity(opt.value); fetchWeather(opt.value); }}
              isDisabled={loading.weather}
              className="react-select"
              classNamePrefix="react-select"
            />
            <button onClick={() => fetchWeather(city)} disabled={loading.weather} className="refresh-btn">
              🔄
            </button>
          </div>
          {loading.weather && <p className="info">Loading weather...</p>}
          {error.weather && <p className="error">⚠️ {error.weather} (using mock)</p>}
          {weather && (
            <>
              <div className="weather-current">
                <span className="weather-icon">{weather.icon}</span>
                <div>
                  <div className="weather-temp">{weather.temp}°C</div>
                  <div className="weather-condition">{weather.condition}</div>
                </div>
              </div>
              <div className="weather-forecast">
                {forecast.map((day, idx) => (
                  <div key={idx} className="forecast-day">
                    <span>{day.day}</span>
                    <span className="forecast-icon">{day.icon}</span>
                    <span>{Math.round(day.temp)}°</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* -------------------- Campus News Feed -------------------- */}
      <section className="news-feed" ref={newsRef}>
        <div className="section-header">
          <span className="section-badge">CAMPUS NEWS</span>
          <h2 className="section-title">Latest <span className="gradient-text">Updates</span></h2>
        </div>
        <div className="news-container">
          {loading.news && <p className="info">Loading news...</p>}
          {error.news && <p className="error">⚠️ {error.news} (using mock)</p>}
          <div className="news-grid">
            {news.map(item => (
              <div key={item.id} className="news-card">
                <h4>{item.title}</h4>
                <span className="news-date">{item.date}</span>
                <p>{item.excerpt}</p>
                <Link to={`/news/${item.id}`} className="news-link">Read more →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- Study Room Availability -------------------- */}
      <section className="room-availability" ref={roomsRef}>
        <div className="section-header">
          <span className="section-badge">REAL‑TIME</span>
          <h2 className="section-title">Study Room <span className="gradient-text">Availability</span></h2>
        </div>
        <div className="rooms-container">
          {loading.rooms && <p className="info">Loading rooms...</p>}
          {error.rooms && <p className="error">⚠️ {error.rooms} (using mock)</p>}
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className={`room-card ${room.available ? 'available' : 'occupied'}`}>
                <div className="room-header">
                  <span className="room-name">{room.id}</span>
                  <span className="room-status">{room.available ? '🟢 Free' : '🔴 Occupied'}</span>
                </div>
                <div className="room-capacity">👥 {room.capacity} seats</div>
                {room.available && <button className="book-btn">Book now</button>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- Upcoming Events -------------------- */}
      <section className="upcoming-events">
        <div className="section-header">
          <span className="section-badge">CALENDAR</span>
          <h2 className="section-title">Upcoming <span className="gradient-text">Events</span></h2>
        </div>
        <div className="events-container">
          {loading.events && <p className="info">Loading events...</p>}
          {error.events && <p className="error">⚠️ {error.events} (using mock)</p>}
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-date">
                  <span className="event-day">{new Date(event.date).getDate()}</span>
                  <span className="event-month">{new Date(event.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="event-details">
                  <h4>{event.title}</h4>
                  <p>{event.time} · {event.location}</p>
                </div>
                <button className="event-remind">🔔 Remind</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- Analytics Chart -------------------- */}
      <section className="analytics-chart">
        <div className="section-header">
          <span className="section-badge">TRENDS</span>
          <h2 className="section-title">Course Completion <span className="gradient-text">Analytics</span></h2>
        </div>
        <div className="chart-container">
          {loading.analytics && <p className="info">Loading chart...</p>}
          {error.analytics && <p className="error">⚠️ {error.analytics} (using mock)</p>}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completion" stroke="#5a67d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* -------------------- Live User Activity -------------------- */}
      <section className="live-activity">
        <div className="section-header">
          <span className="section-badge">LIVE</span>
          <h2 className="section-title">User <span className="gradient-text">Activity</span></h2>
        </div>
        <div className="activity-container">
          <div className="activity-log">
            {activityLog.map((act, idx) => (
              <div key={idx} className="activity-item">
                <span className="activity-user">{act.user}</span>
                <span className="activity-action">{act.action}</span>
                <span className="activity-time">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- Features Section -------------------- */}
      <section className="features" ref={featuresRef}>
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.featuresBadge}</span>
          <h2 className="section-title">
            {pageData.sections.featuresTitle}
            <span className="gradient-text">{pageData.sections.featuresTitleHighlight}</span>
          </h2>
          <p className="section-subtitle">All features are completely free – no upgrades, no hidden costs.</p>
        </div>

        <div className="features-grid">
          {pageData.features.map((feature, idx) => (
            <div key={idx} className="feature-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="feature-icon" style={{ background: `hsl(${idx * 60}, 70%, 60%)` }}>{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <span className="feature-stats">{feature.stats}</span>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- How It Works -------------------- */}
      <section className="how-it-works" ref={howRef}>
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.howItWorksBadge}</span>
          <h2 className="section-title">
            {pageData.sections.howItWorksTitle}
            <span className="gradient-text">{pageData.sections.howItWorksTitleHighlight}</span>
          </h2>
        </div>

        <div className="steps-container">
          {pageData.howItWorks.map((step, idx) => (
            <div key={idx} className="step-card" data-aos="fade-up" data-aos-delay={idx * 150}>
              <div className="step-number">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Use Cases -------------------- */}
      <section className="use-cases">
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.useCasesBadge}</span>
          <h2 className="section-title">
            {pageData.sections.useCasesTitle}
            <span className="gradient-text">{pageData.sections.useCasesTitleHighlight}</span>
          </h2>
        </div>

        <div className="use-cases-grid">
          {pageData.useCases.map((item, idx) => (
            <div key={idx} className="use-case-card" data-aos="fade-up" data-aos-delay={idx * 150}>
              <div className="use-case-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Testimonials -------------------- */}
      <section className="testimonials">
        <div className="section-header center" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.testimonialsBadge}</span>
          <h2 className="section-title">
            {pageData.sections.testimonialsTitle}
            <span className="gradient-text">{pageData.sections.testimonialsTitleHighlight}</span>
          </h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card" data-aos="fade-up" data-aos-delay={idx * 150}>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < t.rating ? "star filled" : "star"}>★</span>
                ))}
              </div>
              <p className="testimonial-content">"{t.content}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>{t.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Pricing -------------------- */}
      <section className="pricing" ref={pricingRef}>
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.pricingBadge}</span>
          <h2 className="section-title">
            {pageData.sections.pricingTitle}
            <span className="gradient-text">{pageData.sections.pricingTitleHighlight}</span>
          </h2>
        </div>

        <div className="pricing-card" data-aos="zoom-in">
          <div className="pricing-badge">🔥 100% Free</div>
          <h3 className="pricing-name">{pageData.pricing.title}</h3>
          <p className="pricing-description">{pageData.pricing.subtitle}</p>
          <ul className="pricing-features">
            {pageData.pricing.features.map((feat, i) => (
              <li key={i}>✓ {feat}</li>
            ))}
          </ul>
          <Link to="/register" className="cta-primary large">Get Started – It's Free</Link>
          <p className="pricing-note">No credit card required. No time limits.</p>
        </div>
      </section>

      {/* -------------------- FAQ -------------------- */}
      <section className="faq" ref={faqRef}>
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.faqBadge}</span>
          <h2 className="section-title">
            {pageData.sections.faqTitle}
            <span className="gradient-text">{pageData.sections.faqTitleHighlight}</span>
          </h2>
        </div>

        <div className="faq-container">
          {pageData.faqs.map((item, idx) => (
            <div key={idx} className="faq-item" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="faq-question" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <h4>{item.question}</h4>
                <span className="faq-icon">{activeFaq === idx ? '−' : '+'}</span>
              </div>
              {activeFaq === idx && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Blog Preview -------------------- */}
      <section className="blog-preview">
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">{pageData.sections.blogBadge}</span>
          <h2 className="section-title">
            {pageData.sections.blogTitle}
            <span className="gradient-text">{pageData.sections.blogTitleHighlight}</span>
          </h2>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post, idx) => (
            <div key={idx} className="blog-card" data-aos="fade-up" data-aos-delay={idx * 150}>
              <h4>{post.title}</h4>
              <span className="blog-date">{post.date}</span>
              <p>{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="blog-link">Read more →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Final CTA -------------------- */}
      <section className="cta-section">
        <div className="cta-container" data-aos="zoom-in">
          <h2 className="cta-title">Join the free education revolution</h2>
          <p className="cta-description">Start using CampusIQ today – no strings attached.</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-primary large">Create Free Account</Link>
            <Link to="/contact" className="cta-secondary large">Contact Us</Link>
          </div>
          <div className="cta-features">
            <span>✓ No credit card</span>
            <span>✓ All features included</span>
            <span>✓ Cancel anytime (but you won't)</span>
          </div>
        </div>
      </section>

      {/* -------------------- Footer -------------------- */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">Campus<span className="logo-highlight">IQ</span></span>
            </Link>
            <p>Free academic tools for everyone.</p>
            <div className="social-links">
              <a href="#" aria-label="Twitter">𝕏</a>
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="GitHub">GH</a>
            </div>
          </div>
          {["Product", "Company", "Resources", "Legal"].map((col, i) => (
            <div key={i} className="footer-column">
              <h4>{col}</h4>
              <ul>
                {["Features","How it works","Pricing","FAQ"].map(link => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CampusIQ. Free for everyone.</p>
          <div>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;