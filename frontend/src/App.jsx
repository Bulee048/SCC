import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store/store";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";

// Pages
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Styles
import "./App.css";
import "./styles/Uiverse.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;