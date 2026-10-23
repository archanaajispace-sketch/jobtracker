import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Header — top navigation bar showing app branding,
 * navigation links (Tracker / Job Search), user email badge, and Log Out.
 */
function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <header className="header">
      <div className="header__brand">
        <Link to="/" className="header__logo-link">
          <h1 className="header__logo">
            JobTracker <span>/ App</span>
          </h1>
        </Link>
      </div>

      {currentUser && (
        <div className="header__actions">
          {/* Navigation Links */}
          <nav className="header__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              📋 My Tracker
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              🔍 Job Search
            </NavLink>
          </nav>

          {/* User Menu */}
          <div className="header__user-menu">
            <span className="header__user-email" title={currentUser.email}>
              👤 {currentUser.email}
            </span>
            <button
              type="button"
              className="btn btn--logout"
              onClick={handleLogout}
              title="Log out of your account"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
