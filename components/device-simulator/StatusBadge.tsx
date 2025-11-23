import React from 'react';

interface StatusBadgeProps {
  status: 'inactive' | 'safe' | 'warning' | 'danger';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'inactive') return null;

  if (status === 'safe') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-medium text-green-700">Safe</span>
      </div>
    );
  }

  if (status === 'warning') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-medium text-yellow-700">Warning</span>
      </div>
    );
  }

  if (status === 'danger') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-medium text-red-700">Danger</span>
      </div>
    );
  }

  return null;
}
