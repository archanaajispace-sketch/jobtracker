import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase/config';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import StatusCounters from './components/StatusCounters';
import Toolbar from './components/Toolbar';
import JobForm from './components/JobForm';
import JobCardList from './components/JobCardList';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import JobSearch from './pages/JobSearch';

/**
 * TrackerDashboard — the main protected view.
 * Only rendered when the user is logged in.
 * Fetches and stores job applications under users/{uid}/applications in Firestore.
 */
function TrackerDashboard() {
  const { currentUser } = useAuth();

  // Job applications loaded from Firestore
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [firestoreError, setFirestoreError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingJob, setEditingJob] = useState(null);

  // ---- 1. Real-time Firestore sync ----
  useEffect(() => {
    if (!currentUser) return;

    setLoadingJobs(true);
    setFirestoreError('');

    // Reference to this user's specific applications subcollection:
    // users/{uid}/applications
    const userAppsRef = collection(db, 'users', currentUser.uid, 'applications');

    // onSnapshot listens for real-time additions, updates, and deletes
    const unsubscribe = onSnapshot(
      userAppsRef,
      (snapshot) => {
        const loadedJobs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Sort newest first by createdAt timestamp
        loadedJobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setJobs(loadedJobs);
        setLoadingJobs(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setFirestoreError(
          'Could not load your applications. Please make sure Firebase Firestore is enabled in your Firebase console and security rules allow access.'
        );
        setLoadingJobs(false);
      }
    );

    // Clean up listener when component unmounts or user changes
    return () => unsubscribe();
  }, [currentUser]);

  // ---- 2. Add job to Firestore ----
  const addJob = async (jobData) => {
    if (!currentUser) return;
    try {
      setSubmitting(true);
      setFirestoreError('');
      const userAppsRef = collection(db, 'users', currentUser.uid, 'applications');
      await addDoc(userAppsRef, {
        ...jobData,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Error adding application:', error);
      setFirestoreError('Failed to save application to Firestore. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- 3. Update job in Firestore ----
  const updateJob = async (updatedData) => {
    if (!currentUser || !editingJob) return;
    try {
      setSubmitting(true);
      setFirestoreError('');
      const jobDocRef = doc(db, 'users', currentUser.uid, 'applications', editingJob.id);
      await updateDoc(jobDocRef, {
        ...updatedData,
        updatedAt: Date.now(),
      });
      setEditingJob(null); // exit edit mode
    } catch (error) {
      console.error('Error updating application:', error);
      setFirestoreError('Failed to update application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- 4. Delete job from Firestore ----
  const deleteJob = async (id) => {
    if (!currentUser) return;
    try {
      setFirestoreError('');
      const jobDocRef = doc(db, 'users', currentUser.uid, 'applications', id);
      await deleteDoc(jobDocRef);
    } catch (error) {
      console.error('Error deleting application:', error);
      setFirestoreError('Failed to delete application. Please try again.');
    }
  };

  const startEditing = (job) => {
    setEditingJob(job);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingJob(null);
  };

  // ---- 5. Filtering and Search ----
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      filterStatus === 'All' || job.status === filterStatus;
    const matchesSearch = (job.company || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* Firestore Error Alert */}
      {firestoreError && (
        <div className="alert-error" role="alert">
          {firestoreError}
        </div>
      )}

      {/* Status Counters */}
      <StatusCounters
        jobs={jobs}
        activeFilter={filterStatus}
        onSelectStatus={setFilterStatus}
      />

      {/* Toolbar for search and filter */}
      <Toolbar
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Grid: Form on left, Applications on right */}
      <div className="main-grid">
        <JobForm
          onSubmit={editingJob ? updateJob : addJob}
          editingJob={editingJob}
          onCancel={cancelEditing}
          submitting={submitting}
        />

        {loadingJobs ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Loading your applications from database...</p>
          </div>
        ) : (
          <JobCardList
            jobs={filteredJobs}
            onDelete={deleteJob}
            onEdit={startEditing}
          />
        )}
      </div>
    </>
  );
}

/**
 * App — Root router configuring public auth routes and protected tracker dashboard.
 */
function App() {
  return (
    <div className="container">
      <Header />

      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TrackerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Live Job Search Route */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <JobSearch />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
