import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import StatusCounters from './components/StatusCounters';
import Toolbar from './components/Toolbar';
import JobForm from './components/JobForm';
import JobCardList from './components/JobCardList';

// Initial sample applications so you can see the cards and counters in action immediately
const INITIAL_JOBS = [
  {
    id: 1,
    company: 'Google',
    role: 'Frontend Developer',
    location: 'Remote',
    status: 'Applied',
    date: '2026-10-20',
    link: 'https://careers.google.com',
    notes: 'Submitted resume and portfolio. Waiting for initial review.',
  },
  {
    id: 2,
    company: 'Microsoft',
    role: 'Software Engineer',
    location: 'Seattle, WA',
    status: 'Interview',
    date: '2026-10-18',
    link: 'https://careers.microsoft.com',
    notes: 'Technical round scheduled for next Tuesday at 3 PM.',
  },
  {
    id: 3,
    company: 'Netflix',
    role: 'UI Engineer',
    location: 'Los Gatos, CA',
    status: 'Offer',
    date: '2026-10-15',
    link: 'https://jobs.netflix.com',
    notes: 'Received offer! Reviewing compensation package.',
  },
];

/**
 * App — the root component.
 * Keeps all job-application data in state and passes it down.
 */
function App() {
  // ---- State ----

  // Array of job objects — each has a unique `id`
  const [jobs, setJobs] = useState(INITIAL_JOBS);

  // Which status to filter by ("All" = show everything)
  const [filterStatus, setFilterStatus] = useState('All');

  // Text the user types into the search box
  const [searchQuery, setSearchQuery] = useState('');

  // When editing, this holds the job object; null = adding a new job
  const [editingJob, setEditingJob] = useState(null);

  // ---- Handlers ----

  /**
   * addJob — called when the form is submitted for a NEW job.
   * We give each job a unique id using Date.now().
   */
  const addJob = (jobData) => {
    const newJob = { ...jobData, id: Date.now() };
    setJobs((prev) => [newJob, ...prev]); // newest first
  };

  /**
   * deleteJob — remove a job by its id.
   */
  const deleteJob = (id) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  /**
   * startEditing — load a job into the form for editing.
   */
  const startEditing = (job) => {
    setEditingJob(job);
    // Scroll to the form so the user sees it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * updateJob — called when the form is submitted while editing.
   * Replaces the old job with the updated one.
   */
  const updateJob = (updatedData) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === editingJob.id ? { ...updatedData, id: editingJob.id } : job
      )
    );
    setEditingJob(null); // exit edit mode
  };

  /**
   * cancelEditing — discard changes and go back to "add" mode.
   */
  const cancelEditing = () => {
    setEditingJob(null);
  };

  // ---- Filtering & Searching ----

  const filteredJobs = jobs.filter((job) => {
    // Status filter
    const matchesStatus =
      filterStatus === 'All' || job.status === filterStatus;

    // Search by company name (case-insensitive)
    const matchesSearch = job.company
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // ---- Render ----

  return (
    <div className="container">
      <Header />

      <Routes>
        {/* Main (and only) page */}
        <Route
          path="/"
          element={
            <>
              {/* Coloured chips showing counts per status (click to filter!) */}
              <StatusCounters
                jobs={jobs}
                activeFilter={filterStatus}
                onSelectStatus={setFilterStatus}
              />

              {/* Search box + status dropdown */}
              <Toolbar
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              {/* Two-column layout: form on the left, cards on the right */}
              <div className="main-grid">
                <JobForm
                  onSubmit={editingJob ? updateJob : addJob}
                  editingJob={editingJob}
                  onCancel={cancelEditing}
                />
                <JobCardList
                  jobs={filteredJobs}
                  onDelete={deleteJob}
                  onEdit={startEditing}
                />
              </div>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
