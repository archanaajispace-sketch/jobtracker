import { useState, useEffect } from 'react';

/**
 * JobForm — form to add or edit a job application.
 *
 * Props:
 *   onSubmit    — called with the form data object
 *   editingJob  — if not null, the form is in "edit" mode (pre-filled)
 *   onCancel    — called when the user clicks "Cancel" during editing
 */

// Default empty values for every field
const EMPTY_FORM = {
  company: '',
  role: '',
  location: '',
  status: 'Applied',
  date: '',
  link: '',
  notes: '',
};

function JobForm({ onSubmit, editingJob, onCancel }) {
  // Local state for the form fields
  const [formData, setFormData] = useState(EMPTY_FORM);

  // When `editingJob` changes (user clicked Edit on a card),
  // fill the form with that job's data.
  useEffect(() => {
    if (editingJob) {
      setFormData({
        company: editingJob.company,
        role: editingJob.role,
        location: editingJob.location,
        status: editingJob.status,
        date: editingJob.date,
        link: editingJob.link,
        notes: editingJob.notes,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [editingJob]);

  /**
   * handleChange — update one field in formData.
   * Works for <input>, <select>, and <textarea>.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * handleSubmit — validate & send the data up.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation: company and role are required
    if (!formData.company.trim() || !formData.role.trim()) {
      alert('Please fill in at least the Company and Role fields.');
      return;
    }

    onSubmit(formData);
    setFormData(EMPTY_FORM); // reset form after submit
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2 className="form-card__title">
        {editingJob ? '✏️ Edit Application' : '➕ Add Application'}
      </h2>

      {/* Company */}
      <div className="form-group">
        <label htmlFor="company">Company *</label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="e.g. Google"
          value={formData.company}
          onChange={handleChange}
          required
        />
      </div>

      {/* Role */}
      <div className="form-group">
        <label htmlFor="role">Role *</label>
        <input
          id="role"
          name="role"
          type="text"
          placeholder="e.g. Frontend Developer"
          value={formData.role}
          onChange={handleChange}
          required
        />
      </div>

      {/* Location */}
      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="e.g. Remote / Bangalore"
          value={formData.location}
          onChange={handleChange}
        />
      </div>

      {/* Status */}
      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Date */}
      <div className="form-group">
        <label htmlFor="date">Date Applied</label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
        />
      </div>

      {/* Job Link */}
      <div className="form-group">
        <label htmlFor="link">Job Link</label>
        <input
          id="link"
          name="link"
          type="url"
          placeholder="https://..."
          value={formData.link}
          onChange={handleChange}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Any extra details…"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      {/* Submit */}
      <button type="submit" className="btn btn--primary">
        {editingJob ? 'Save Changes' : 'Add Application'}
      </button>

      {/* Cancel (only visible when editing) */}
      {editingJob && (
        <button
          type="button"
          className="btn btn--cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

export default JobForm;
