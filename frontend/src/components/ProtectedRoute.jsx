import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";
import { getAccessToken } from "../utils/authStorage.js";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // While verifying auth on page refresh, show loading instead of redirecting
  if (isLoading && !isAuthenticated && getAccessToken()) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
