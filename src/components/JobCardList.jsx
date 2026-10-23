import JobCard from './JobCard';

/**
 * JobCardList — renders the grid of job cards,
 * or an empty-state message if there are none.
 *
 * Props:
 *   jobs     — array of (filtered) job objects
 *   onDelete — passed down to each JobCard
 *   onEdit   — passed down to each JobCard
 */
function JobCardList({ jobs, onDelete, onEdit }) {
  return (
    <section>
      <h2 className="cards-section__title">
        Applications ({jobs.length})
      </h2>

      <div className="cards-grid">
        {jobs.length === 0 ? (
          /* Show a friendly empty state */
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <p>No applications yet — add one using the form!</p>
          </div>
        ) : (
          /* Render a card for every job */
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default JobCardList;
