import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

/**
 * JobSearch Page — fetches live remote jobs from the Remotive API
 * and allows logged-in users to save them directly to their Firestore tracker.
 */
function JobSearch() {
  const { currentUser } = useAuth();

  // Search input state (default: "frontend")
  const [searchInput, setSearchInput] = useState('frontend');
  const [activeKeyword, setActiveKeyword] = useState('frontend');

  // Remotive API state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorsBlocked, setIsCorsBlocked] = useState(false);

  // Firestore sync state to avoid saving duplicates
  const [savedJobUrls, setSavedJobUrls] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);

  // ---- 1. Sync with user's saved applications to detect duplicates ----
  useEffect(() => {
    if (!currentUser) return;

    // Listen to user's saved applications
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
        console.error('Error loading existing applications in JobSearch:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ---- 2. Fetch live jobs from Remotive API using async/await and useEffect ----
  useEffect(() => {
    let isCancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      setIsCorsBlocked(false);

      try {
        const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
          activeKeyword
        )}&limit=15`;

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
          // Detect CORS or Network failure (e.g. Failed to fetch TypeError)
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

  // ---- 3. Handle search form submit ----
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveKeyword(searchInput.trim());
    }
  };

  // ---- 4. Save a job to Firestore (Preventing duplicate saves) ----
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
        notes: `Imported from Remotive live search. Category: ${job.category || 'Tech'}`,
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
      {/* Page Title & Intro */}
      <div className="search-page__header">
        <h2 className="search-page__title">Live Remote Job Search 🌐</h2>
        <p className="search-page__subtitle">
          Discover remote jobs from the Remotive API and save them directly to your tracker with one click.
        </p>
      </div>

      {/* Search Input Box */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          id="remotive-search-input"
          type="text"
          className="search-bar__input"
          placeholder="Search by role or skill (e.g. frontend, react, python)..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn--primary search-bar__btn">
          🔍 Search
        </button>
      </form>

      {/* CORS Alert Banner (if browser blocks cross-origin requests) */}
      {isCorsBlocked && (
        <div className="alert-error" role="alert">
          <div>
            <strong>⚠️ CORS / Network Notice:</strong> Your browser or network may have blocked the request to Remotive API.
            <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>
              <strong>Suggested Fix:</strong> Remotive sends <code>access-control-allow-origin: *</code> by default, but if you have an adblocker or strict browser extensions enabled, whitelist <code>remotive.com</code> or configure a local proxy in <code>vite.config.js</code>.
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
          <p>Fetching live remote jobs for "{activeKeyword}"...</p>
        </div>
      )}

      {/* Results Header */}
      {!loading && !error && (
        <div className="search-results-info">
          Found <strong>{jobs.length}</strong> live remote jobs for "<em>{activeKeyword}</em>"
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p>No remote jobs found matching "{activeKeyword}". Try another keyword!</p>
        </div>
      )}

      {/* Job Cards Grid */}
      {!loading && jobs.length > 0 && (
        <div className="live-jobs-grid">
          {jobs.map((job) => {
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

                <div className="live-job-card__meta">
                  <span className="live-job-card__tag">
                    📍 {job.candidate_required_location || 'Worldwide Remote'}
                  </span>
                  {job.job_type && (
                    <span className="live-job-card__tag">
                      💼 {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {job.category && (
                    <span className="live-job-card__tag">
                      🏷️ {job.category}
                    </span>
                  )}
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
