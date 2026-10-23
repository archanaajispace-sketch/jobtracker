/**
 * JobCard — displays a single job application as a card.
 *
 * Props:
 *   job     — the job object { id, company, role, location, status, date, link, notes }
 *   onDelete — callback(id) to delete this job
 *   onEdit   — callback(job) to start editing this job
 */
// Helper to format YYYY-MM-DD cleanly without timezone shifts (e.g., "Oct 20, 2026")
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return dateStr;
}

function JobCard({ job, onDelete, onEdit }) {
  return (
    <div className="job-card">
      {/* Coloured bar at the top matching the status */}
      <div className={`job-card__status-bar job-card__status-bar--${job.status}`} />

      {/* Header row: company name + status badge */}
      <div className="job-card__header">
        <h3 className="job-card__company">{job.company}</h3>
        <span className={`job-card__badge job-card__badge--${job.status}`}>
          {job.status}
        </span>
      </div>

      {/* Role */}
      <p className="job-card__role">{job.role}</p>

      {/* Meta info: location + date */}
      <div className="job-card__meta">
        {job.location && <span>📍 {job.location}</span>}
        {job.date && <span>📅 {formatDate(job.date)}</span>}
      </div>

      {/* Job link (if provided) */}
      {job.link && (
        <a
          className="job-card__link"
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          🔗 View Job Posting
        </a>
      )}

      {/* Notes (if provided) */}
      {job.notes && <p className="job-card__notes">{job.notes}</p>}

      {/* Action buttons */}
      <div className="job-card__actions">
        <button
          className="btn--icon"
          onClick={() => onEdit(job)}
        >
          ✏️ Edit
        </button>
        <button
          className="btn--icon btn--icon--delete"
          onClick={() => onDelete(job.id)}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export default JobCard;
