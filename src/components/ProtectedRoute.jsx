import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component.
 * Wraps routes that require authentication.
 * If the user is logged in, renders the children.
 * If the user is NOT logged in, redirects them to /login.
 */
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // If still checking authentication status on page reload, show a clean loader
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If not logged in, redirect to /login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
