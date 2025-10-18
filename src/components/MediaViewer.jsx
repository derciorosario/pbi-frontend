import React from 'react';
import { X } from 'lucide-react';

const MediaViewer = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = 'image',
  alt = 'Media',
  format = 'rounded'
}) => {
  if (!isOpen || !mediaUrl) {
    // Reset body overflow when closing
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'unset';
    }
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const getBorderRadius = () => {
    switch (format) {
      case 'square':
        return 'rounded-xl';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[80vw] max-h-[80vh] w-auto h-auto">
        {/* Close button */}
        <button
          onClick={handleCloseClick}
          className="absolute -top-16 right-0 text-white hover:opacity-50 transition-all duration-200 z-10 bg-black/80 hover:bg-white hover:text-black rounded-full p-3 border-2 border-white/50 hover:border-white shadow-lg hover:shadow-xl"
          aria-label="Close media viewer"
        >
          <X size={28} />
        </button>

        {/* Media content */}
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={alt}
            className={`max-w-full h-auto object-contain shadow-2xl border-2 border-white/20 ${getBorderRadius()}`}
            style={{
              maxHeight: 'calc(80vh - 2rem)', // Account for container padding
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={`max-w-full max-h-[calc(80vh-2rem)] object-contain shadow-2xl bg-white p-8 border-2 border-white/20 ${getBorderRadius()}`}>
            <p className="text-gray-500">Unsupported media type: {mediaType}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;