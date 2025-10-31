// src/components/FormMediaViewer.jsx
import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

export default function FormMediaViewer({ urls = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);

  const currentUrl = urls[currentIndex];
  const isVideo = currentUrl?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|ogv)$/);
  const isImage = currentUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handlePrevious = () => {
    if (urls.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (urls.length <= 1) return;
    setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  if (!urls.length) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
      isClosing ? 'bg-opacity-0' : 'bg-opacity-90'
    }`}>
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 rounded-full bg-black bg-opacity-50"
      >
        <X size={24} />
      </button>

      {/* Navigation Arrows */}
      {urls.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-3 rounded-full bg-black bg-opacity-50"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-3 rounded-full bg-black bg-opacity-50"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Main Media Display */}
      <div className={`relative w-full max-w-6xl max-h-full p-4 transition-transform duration-300 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {isVideo ? (
          <VideoPlayer 
            src={currentUrl} 
            alt={`Video ${currentIndex + 1}`}
            key={currentUrl} // Add key to force re-render when URL changes
            autoPlay={true} // Ensure autoplay when switching
            controls={true}
          />
        ) : isImage ? (
          <div className="flex items-center justify-center h-full">
            <img
              src={currentUrl}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-white">
            Unsupported media type
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {urls.length > 1 && (
        <div className="absolute max-md:hidden flex-wrap bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2">
          {urls.map((url, index) => {
            const isThumbVideo = url?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|ogv)$/);
            const isThumbImage = url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
            
            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentIndex 
                    ? 'border-white scale-110' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                {isThumbVideo ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="w-4 h-4 border-l-2 border-white" style={{ transform: 'translateX(1px)' }} />
                    </div>
                    <video
                      src={url}
                      className="w-full h-full object-cover opacity-70"
                    />
                  </div>
                ) : isThumbImage ? (
                  <img
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
                    File
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Counter */}
      {urls.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {urls.length}
        </div>
      )}
    </div>
  );
}