import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Quick search topic suggestions
const QUICK_SEARCH_TOPICS = [
  'Flutter',
  'React',
  'Frontend',
  'Python',
  'Cloud',
  'Support',
];

/**
 * JobSearch Page — fetches live remote software development jobs from Remotive API,
 * filters results by title or tags, and lets users save them to their Firestore tracker.
 */
function JobSearch() {
  const { currentUser } = useAuth();

  // Search input and active search keyword
  const [searchInput, setSearchInput] = useState('frontend');
  const [activeKeyword, setActiveKeyword] = useState('frontend');

  // Remotive API raw response & UI states
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorsBlocked, setIsCorsBlocked] = useState(false);

  // Firestore sync to prevent saving the same job twice
  const [savedJobUrls, setSavedJobUrls] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);

  // ---- 1. Sync with user's saved applications to detect duplicates ----
  useEffect(() => {
    if (!currentUser) return;

    const appsRef = collection(db, 'users', currentUser.uid, 'applications');
    const unsubscribe = onSnapshot(
      appsRef,
      (snapshot) => {
        const urls = new Set();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.link) urls.add(data.link);
          if (data.remotiveId) urls.add(String(data.remotiveId));
        });
        setSavedJobUrls(urls);
      },
      (err) => {
        console.error('Error loading saved applications:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ---- 2. Fetch from Remotive API with category=software-dev and limit=50 ----
  useEffect(() => {
    let isCancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      setIsCorsBlocked(false);

      try {
        // Query category=software-dev with limit=50
        const url = `https://remotive.com/api/remote-jobs?category=software-dev&search=${encodeURIComponent(
          activeKeyword
        )}&limit=50`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Remotive API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!isCancelled) {
          setJobs(data.jobs || []);
        }
      } catch (err) {
        console.error('Failed to fetch from Remotive API:', err);
        if (!isCancelled) {
          const isNetworkOrCors =
            err.name === 'TypeError' && err.message.toLowerCase().includes('fetch');
          setIsCorsBlocked(isNetworkOrCors);
          setError(
            err.message || 'Unable to fetch remote jobs. Please check your internet connection.'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isCancelled = true;
    };
  }, [activeKeyword]);

  // ---- 3. Filter jobs in JavaScript: title, company name, or tags must contain keyword ----
  const filteredJobs = jobs.filter((job) => {
    const keyword = activeKeyword.toLowerCase().trim();
    if (!keyword) return true;

    // 1. Check title (case-insensitive)
    const titleMatches = (job.title || '').toLowerCase().includes(keyword);

    // 2. Check company name (case-insensitive)
    const companyMatches = (job.company_name || '')
      .toLowerCase()
      .includes(keyword);

    // 3. Check tags (case-insensitive)
    const tagsMatch =
      Array.isArray(job.tags) &&
      job.tags.some((tag) => (tag || '').toLowerCase().includes(keyword));

    return titleMatches || companyMatches || tagsMatch;
  });

  // ---- 4. Form and Quick-Search handlers ----
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setActiveKeyword(trimmed);
    }
  };

  const handleQuickSearch = (topic) => {
    setSearchInput(topic);
    setActiveKeyword(topic);
  };

  // ---- 5. Save a job to Firestore (Preventing duplicate saves) ----
  const handleSaveToTracker = async (job) => {
    if (!currentUser) return;

    // Guard: Don't save the same job twice
    if (savedJobUrls.has(job.url) || savedJobUrls.has(String(job.id))) {
      return;
    }

    try {
      setSavingJobId(job.id);

      const userAppsRef = collection(db, 'users', currentUser.uid, 'applications');
      await addDoc(userAppsRef, {
        company: job.company_name || 'Unknown Company',
        role: job.title || 'Untitled Role',
        location: job.candidate_required_location || 'Remote',
        status: 'Applied',
        date: new Date().toISOString().split('T')[0], // today's date YYYY-MM-DD
        link: job.url || '',
        notes: `Imported from Remotive live search. Category: ${job.category || 'Software Dev'}`,
        remotiveId: String(job.id),
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to save job to Firestore:', err);
      alert('Could not save job to Firestore. Please check your connection.');
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="search-page">
      {/* Header Info */}
      <div className="search-page__header">
        <h2 className="search-page__title">Live Remote Software Jobs 🌐</h2>
        <p className="search-page__subtitle">
          Real-time developer jobs from Remotive API filtered by title, company name, and skill tags.
        </p>
      </div>

      {/* Search Input Box */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          id="remotive-search-input"
          type="text"
          className="search-bar__input"
          placeholder="Search by role, company name, or tech (e.g. Lemon.io, React, Frontend)..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn--primary search-bar__btn">
          🔍 Search
        </button>
      </form>

      {/* Quick-Search Filter Buttons */}
      <div className="quick-search-row">
        <span className="quick-search-label">Quick search:</span>
        <div className="quick-search-chips">
          {QUICK_SEARCH_TOPICS.map((topic) => {
            const isActive =
              activeKeyword.toLowerCase() === topic.toLowerCase();
            return (
              <button
                key={topic}
                type="button"
                className={`quick-search-chip ${
                  isActive ? 'quick-search-chip--active' : ''
                }`}
                onClick={() => handleQuickSearch(topic)}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* CORS Alert Banner */}
      {isCorsBlocked && (
        <div className="alert-error" role="alert">
          <div>
            <strong>⚠️ CORS / Network Notice:</strong> Your browser or network may have blocked the request to Remotive API.
            <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>
              <strong>Suggested Fix:</strong> Remotive sends <code>access-control-allow-origin: *</code>, but if an adblocker or privacy extension blocks it, whitelist <code>remotive.com</code>.
            </div>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {error && !isCorsBlocked && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Fetching software jobs for "{activeKeyword}"...</p>
        </div>
      )}

      {/* Results Header (Showing count of matching jobs) */}
      {!loading && !error && (
        <div className="search-results-info">
          Found <strong>{filteredJobs.length}</strong> matching remote job{filteredJobs.length === 1 ? '' : 's'} for "<em>{activeKeyword}</em>"
        </div>
      )}

      {/* Friendly Empty State if no jobs match title or tags */}
      {!loading && !error && filteredJobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__message">
            No jobs found for this keyword. Try <strong>Flutter</strong>, <strong>React</strong>, <strong>Frontend</strong>, <strong>Python</strong> or <strong>Cloud</strong>.
          </p>
        </div>
      )}

      {/* Job Cards Grid */}
      {!loading && filteredJobs.length > 0 && (
        <div className="live-jobs-grid">
          {filteredJobs.map((job) => {
            const isAlreadySaved =
              savedJobUrls.has(job.url) || savedJobUrls.has(String(job.id));
            const isSavingThis = savingJobId === job.id;

            return (
              <div key={job.id} className="live-job-card">
                <div className="live-job-card__header">
                  {job.company_logo && (
                    <img
                      src={job.company_logo}
                      alt={`${job.company_name} logo`}
                      className="live-job-card__logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="live-job-card__title">{job.title}</h3>
                    <p className="live-job-card__company">{job.company_name}</p>
                  </div>
                </div>

                {/* Location and Category Meta */}
                <div className="live-job-card__meta">
                  <span className="live-job-card__tag">
                    📍 {job.candidate_required_location || 'Worldwide Remote'}
                  </span>
                  {job.job_type && (
                    <span className="live-job-card__tag">
                      💼 {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {/* Display top relevant tags if available */}
                  {Array.isArray(job.tags) &&
                    job.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="live-job-card__tag live-job-card__tag--tech">
                        🏷️ {tag}
                      </span>
                    ))}
                </div>

                <div className="live-job-card__actions">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="live-job-card__link"
                    >
                      View on Remotive ↗
                    </a>
                  )}

                  <button
                    type="button"
                    className={`btn ${
                      isAlreadySaved ? 'btn--saved' : 'btn--save'
                    }`}
                    onClick={() => handleSaveToTracker(job)}
                    disabled={isAlreadySaved || isSavingThis}
                    title={
                      isAlreadySaved
                        ? 'This job is already in your tracker'
                        : 'Save to my tracker with status Applied'
                    }
                  >
                    {isSavingThis
                      ? 'Saving...'
                      : isAlreadySaved
                      ? 'Saved ✓'
                      : '➕ Save to tracker'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default JobSearch;
