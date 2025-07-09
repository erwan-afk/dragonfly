'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [isChanging, setIsChanging] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsChanging(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Here you would call your Better Auth password change API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccessMessage('✅ Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to change password'
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-oceanblue text-14 font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue text-oceanblue text-14 font-normal"
            placeholder="Enter your current password"
          />
          {errors.currentPassword && (
            <p className="text-red-500 text-12 mt-1">
              {errors.currentPassword}
            </p>
          )}
        </div>

        <div>
          <label className="block text-oceanblue text-14 font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue"
            placeholder="Enter your new password (min 8 characters)"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-12 mt-1">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-oceanblue text-14 font-medium mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue"
            placeholder="Confirm your new password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-12 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={isChanging}
            className={`text-fullwhite bg-oceanblue w-fit px-[10px] py-[5px] rounded-full ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isChanging ? 'Changing...' : 'Change password'}
          </button>
        </div>
      </form>
    </div>
  );
}
