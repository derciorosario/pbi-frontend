import React, { useState } from 'react';
import { toast } from '../lib/toast';
import client from '../api/client';

const AccountTypeModal = ({ isOpen, onClose, userInfo, accessToken, onSuccess }) => {
  const [selectedType, setSelectedType] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [showBirthDateInput, setShowBirthDateInput] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

  if (!isOpen) return null;

  // Age validation function
  const validateAge = (birthDate) => {
    if (!birthDate) {
      return "Birth date is required.";
    }

    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const minAge = 18; // Minimum age requirement

    if (birthDateObj > today) {
      return "Birth date cannot be in the future.";
    }

    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < minAge) {
      return `You must be at least ${minAge} years old to sign up.`;
    }

    return null; // No error
  };

  const handleAccountTypeSelection = (type) => {
    setSelectedType(type);
    setShowBirthDateInput(true);
    setBirthDate('');
    setBirthDateError('');
  };

  const handleBirthDateChange = (e) => {
    setBirthDate(e.target.value);
    setBirthDateError('');
  };

  const handleSubmit = async () => {
    // Validate birth date first
    const ageError = validateAge(birthDate);
    if (ageError) {
      setBirthDateError(ageError);
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/auth/google', {
        accessToken,
        accountType: selectedType,
        birthDate: selectedType === 'individual' ? birthDate : undefined
      });

      const token = response?.data?.token;
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token', token);
        toast.success('Account created successfully! 🎉');
        onSuccess();
        onClose();
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to 54Links!</h2>
          <p className="text-gray-600">Choose your account type to get started</p>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
          <img
            src={userInfo?.picture}
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold text-gray-900">{userInfo?.name}</p>
            <p className="text-sm text-gray-500">{userInfo?.email}</p>
          </div>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleAccountTypeSelection('individual')}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              selectedType === 'individual'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM3 22a9 9 0 1 1 18 0Z" />
              </svg>
              <div className="text-left">
                <p className="font-semibold">Individual</p>
                <p className="text-sm opacity-75">Personal networking and connections</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAccountTypeSelection('company')}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              selectedType === 'company'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 21V3h8v6h10v12H3Z" />
              </svg>
              <div className="text-left">
                <p className="font-semibold">Corporate</p>
                <p className="text-sm opacity-75">Business networking and opportunities</p>
              </div>
            </div>
          </button>
        </div>

        {/* Birth Date Input - Show after account type selection */}
        {showBirthDateInput && selectedType === 'individual' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birth Date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={handleBirthDateChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                birthDateError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
              }`}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
            {birthDateError && (
              <p className="text-xs text-red-600 mt-1">{birthDateError}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (selectedType === 'individual' && !birthDate)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
              </svg>
            )}
            {loading ? 'Creating...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeModal;