/**
 * Toolbar — search input + status filter dropdown.
 *
 * Props:
 *   filterStatus  — currently selected status ("All" or a status name)
 *   onFilterChange — callback when the dropdown changes
 *   searchQuery    — current search text
 *   onSearchChange — callback when the search input changes
 */
function Toolbar({ filterStatus, onFilterChange, searchQuery, onSearchChange }) {
  return (
    <div className="toolbar">
      {/* Search by company name */}
      <input
        id="search-input"
        className="toolbar__search"
        type="text"
        placeholder="🔍  Search by company name…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Filter by status */}
      <select
        id="status-filter"
        className="toolbar__select"
        value={filterStatus}
        onChange={(e) => onFilterChange(e.target.value)}
      >
        <option value="All">All Statuses</option>
        <option value="Applied">Applied</option>
        <option value="Interview">Interview</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>
  );
}

export default Toolbar;
