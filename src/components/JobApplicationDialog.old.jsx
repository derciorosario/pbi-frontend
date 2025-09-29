import React, { useState } from 'react';
import { X, Upload, File } from 'lucide-react';
import { toast } from '../lib/toast';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function JobApplicationDialog({ open, onClose, job }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availability, setAvailability] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const {profile} = useAuth()

  // CV selection state
  const [cvSelection, setCvSelection] = useState('existing'); // 'existing' or 'upload'
  const [selectedCvIndex, setSelectedCvIndex] = useState(0);
  const [newCvFile, setNewCvFile] = useState(null);
  const [newCvTitle, setNewCvTitle] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true); // Default checked

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare CV data
    let cvData = null;
    if (cvSelection === 'existing' && profile?.cvBase64?.length > 0) {
      cvData = profile.cvBase64[selectedCvIndex];
    } else if (cvSelection === 'upload' && newCvFile) {
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(newCvFile);
      });
      cvData = {
        original_filename: newCvFile.name,
        title: newCvTitle.trim() || "",
        base64: base64,
        created_at: new Date().toISOString()
      };
    }

    try {
      await client.post('/job-applications', {
        jobId: job.id,
        coverLetter,
        expectedSalary: expectedSalary || null,
        availability: availability || null,
        availabilityDate: availability === 'specific' ? availabilityDate : null,
        employmentType: employmentType || null,
        cvData: cvData || null,
      });

      // Save CV to profile if checkbox is checked and it's a new upload
      if (cvSelection === 'upload' && saveToProfile && cvData) {
        try {
          const currentCvBase64 = profile?.cvBase64 || [];
          const updatedCvBase64 = [...currentCvBase64, cvData];

          await client.put('/profile/portfolio', {
            cvBase64: updatedCvBase64
          });
        } catch (profileError) {
          console.error('Failed to save CV to profile:', profileError);
          // Don't show error toast as the application was successful
        }
      }

      toast.success('Application submitted successfully!');
      onClose('applied');

      // Reset form
      setCoverLetter('');
      setExpectedSalary('');
      setAvailability('');
      setAvailabilityDate('');
      setEmploymentType('');
      setCvSelection('existing');
      setSelectedCvIndex(0);
      setNewCvFile(null);
      setNewCvTitle('');
      setSaveToProfile(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full   max-h-[90vh]  overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Apply for {job?.title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're interested in this position..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                rows={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Salary / Rate <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g., $50,000 - $60,000, Negotiable"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability <span className="text-gray-500">(optional)</span>
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Select availability</option>
                <option value="immediate">Immediate</option>
                <option value="1month">1 Month</option>
                <option value="specific">Specific Date</option>
              </select>
              {availability === 'specific' && (
                <input
                  type="date"
                  value={availabilityDate}
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type Preference <span className="text-gray-500">(optional)</span>
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Select employment type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            {/* CV Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV/Resume <span className="text-gray-500">(optional)</span>
              </label>

              {/* Selection Type */}
              <div className="flex gap-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cvSelection"
                    value="existing"
                    checked={cvSelection === 'existing'}
                    onChange={(e) => setCvSelection(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Use existing CV</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cvSelection"
                    value="upload"
                    checked={cvSelection === 'upload'}
                    onChange={(e) => setCvSelection(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Upload new CV</span>
                </label>
              </div>

              {/* Existing CV Selection */}
              {cvSelection === 'existing' && (
                <div>
                  {profile?.cvBase64?.length > 0 ? (
                    <select
                      value={selectedCvIndex}
                      onChange={(e) => setSelectedCvIndex(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      {profile.cvBase64.map((cv, index) => (
                        <option key={index} value={index}>
                          {cv.title || cv.original_filename}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">No CVs available. Upload one in your profile first.</p>
                  )}
                </div>
              )}

              {/* New CV Upload */}
              {cvSelection === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="CV Title (optional)"
                    value={newCvTitle}
                    onChange={(e) => setNewCvTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File size must be less than 10MB");
                            return;
                          }
                          setNewCvFile(file);
                        }
                      }}
                      className="hidden"
                      id="cv-upload-job"
                    />
                    <label
                      htmlFor="cv-upload-job"
                      className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors"
                    >
                      <div className="text-center">
                        <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {newCvFile ? newCvFile.name : "Click to upload CV"}
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="save-to-profile"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="save-to-profile" className="text-sm text-gray-700">
                      Save to my profile
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}