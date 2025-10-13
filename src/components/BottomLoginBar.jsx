import React from 'react';
import { useData } from '../contexts/DataContext';

const BottomLoginBar = ({ user, makePublic = false }) => {
  const data = useData();


  // Don't render if user is authenticated or if makePublic is explicitly true
  if (user || makePublic === true) return null;

  return (
    <>
      {/* CSS to prevent scrolling when bar is visible */}
      {!user && makePublic !== true && (
        <style>{`
          body {
            overflow-y: hidden !important;
          }
        `}</style>
      )}

      {/* Backdrop overlay - gradient effect for visual interest */}
      <div
        className="fixed inset-0 z-40 _login_prompt"
        onClick={() => { data._showPopUp?.("login_prompt"); }}
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.05) 30%,
              rgba(0, 0, 0, 0.02) 60%,
              rgba(0, 0, 0, 0.05) 85%,
              rgba(139, 53, 139, 0.15) 100%
            )
          `,
          backdropFilter: 'blur(1px)'
        }}
      ></div>

      {/* Bottom Login Bar - Text only, no buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            {/* Icon and message - Always visible */}
            <div className="h-8 w-8 rounded-full bg-brand-600/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="h-4 w-4 text-brand-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1a5 5 0 0 0-5 5v4H6a2 2
                0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2
                0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5
                5 0 0 0-5-5Zm-3 9V6a3 3 0 0 1 6 0v4H9Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-brand-600">Sign in</span> to explore connections, opportunities, jobs, and events across Africa and beyond.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomLoginBar;