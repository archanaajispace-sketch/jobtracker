/**
 * Header — simple top bar with the app name.
 * Kept as its own component so it's easy to extend later
 * (e.g. add navigation links or a user menu).
 */
function Header() {
  return (
    <header className="header">
      <h1 className="header__logo">
        JobTracker <span>/ Dashboard</span>
      </h1>
    </header>
  );
}

export default Header;
