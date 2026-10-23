/**
 * StatusCounters — row of coloured chips showing how many
 * applications are in each status (Applied, Interview, etc.).
 * Clicking a chip also filters by that status!
 *
 * Props:
 *   jobs           — the full (unfiltered) array of job objects.
 *   activeFilter   — currently selected status ("All", "Applied", etc.)
 *   onSelectStatus — callback(status) to set filter
 */

// The four statuses we track
const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

function StatusCounters({ jobs, activeFilter = 'All', onSelectStatus }) {
  // Count how many jobs match each status
  const counts = {};
  STATUSES.forEach((status) => {
    counts[status] = jobs.filter((job) => job.status === status).length;
  });

  return (
    <div className="counters" role="region" aria-label="Status counters">
      {STATUSES.map((status) => {
        const isActive = activeFilter === status;
        return (
          <button
            key={status}
            type="button"
            className={`counter-chip counter-chip--${status.toLowerCase()} ${
              isActive ? 'counter-chip--active' : ''
            }`}
            onClick={() => {
              if (onSelectStatus) {
                // Toggle: if clicked again, reset to 'All'
                onSelectStatus(isActive ? 'All' : status);
              }
            }}
            title={`Click to filter by ${status}`}
          >
            {/* Coloured dot */}
            <span className="counter-chip__dot" />
            {/* Label + number */}
            <span>
              {status}: <strong>{counts[status]}</strong>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default StatusCounters;
