import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { toast } from '../lib/toast';
import client from '../api/client';

export default function EventRegistrationDialog({ open, onClose, event }) {
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [reasonForAttending, setReasonForAttending] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!numberOfPeople || numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Number of people is required and must be at least 1';
    }

    if (!reasonForAttending.trim()) {
      newErrors.reasonForAttending = 'Reason for attending is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await client.post('/event-registrations', {
        eventId: event.id,
        numberOfPeople: parseInt(numberOfPeople),
        reasonForAttending: reasonForAttending.trim(),
      });
      toast.success('Registration submitted successfully!');
      onClose();
      setNumberOfPeople('');
      setReasonForAttending('');
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed z-[100] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-full">
              <Calendar size={20} className="text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-600">Register for Event</h3>
              <p className="text-sm text-gray-600 truncate max-w-xs">{event?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Number of People
            </label>
            <input
              type="number"
              min="1"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              placeholder="Enter number of people"
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                errors.numberOfPeople ? 'border-red-500' : 'border-gray-200'
              }`}
              required
            />
            {errors.numberOfPeople && (
              <p className="text-sm text-red-600 mt-1">{errors.numberOfPeople}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason for Attending
            </label>
            <textarea
              value={reasonForAttending}
              onChange={(e) => setReasonForAttending(e.target.value)}
              placeholder="e.g., Networking, learning, pitching, etc."
              rows={3}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none ${
                errors.reasonForAttending ? 'border-red-500' : 'border-gray-200'
              }`}
              required
            />
            {errors.reasonForAttending && (
              <p className="text-sm text-red-600 mt-1">{errors.reasonForAttending}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Let the organizer know why you're interested in attending
            </p>
          </div>

          {/* Event Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Event Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Date:</span> {event?.eventDate || 'TBD'}</p>
              <p><span className="font-medium">Location:</span> {event?.location || event?.city || 'TBD'}</p>
              <p><span className="font-medium">Price:</span> {event?.price ? `$${event.price}` : 'Free'}</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm border bg-white hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}