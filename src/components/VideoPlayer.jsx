// src/components/VideoPlayer.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import client, { API_URL } from "../api/client";
import {
  User as UserIcon,
  Copy as CopyIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from "lucide-react";


// Video Player Component
export default   function  VideoPlayer({ src, alt }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [volume, setVolume] = useState(0.7);
  const [lastVolume, setLastVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volumeHoverTimeout, setVolumeHoverTimeout] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [userMutedPreference, setUserMutedPreference] = useState(null); // null = auto, true = user muted, false = user unmuted
  const [isDragging, setIsDragging] = useState(false);

  // Intersection Observer for auto-play/mute when video visibility changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isHalfVisible = entry.intersectionRatio >= 0.5;
          
          if (isHalfVisible && !isPlaying && !isFullscreen && !hasUserInteracted) {
            // Video is at least 50% visible and not playing - play it (always muted for auto-play)
            const playVideo = async () => {
              try {
                video.muted = true;
                setIsMuted(true);
                await video.play();
                setIsPlaying(true);
                setIsInView(true);
              } catch (error) {
                console.log('Auto-play failed:', error);
              }
            };
            playVideo();
          } else if (isHalfVisible && isPlaying && !hasUserInteracted) {
            // Video becomes visible again and was playing - respect user mute preference
            if (userMutedPreference === false) {
              // User previously unmuted - restore sound
              video.muted = false;
              setIsMuted(false);
            } else {
              // User muted or auto behavior - keep muted
              video.muted = true;
              setIsMuted(true);
            }
            setIsInView(true);
          } else if (!isHalfVisible && isPlaying && !isFullscreen && !hasUserInteracted) {
            // Video is less than 50% visible and playing - pause it
            video.pause();
            setIsPlaying(false);
            setIsInView(false);
          } else if (!isHalfVisible && isPlaying) {
            // Video is not visible but playing - mute it (but don't pause)
            video.muted = true;
            setIsMuted(true);
            setIsInView(false);
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '0px'
      }
    );

    if (video) {
      observer.observe(video);
    }

    return () => {
      if (video) {
        observer.unobserve(video);
      }
    };
  }, [isPlaying, isFullscreen, hasUserInteracted, userMutedPreference]);

  // Format time helper
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update current time and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('canplay', () => setIsLoading(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('canplay', () => setIsLoading(false));
    };
  }, []);

  // Update volume when volume state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement;
      setIsFullscreen(!!fullscreenElement);
      
      if (!fullscreenElement && showControls) {
        showControlsTemporarily();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showControls]);

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    
    // Mark that user has interacted with the video
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        // Pause the video
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Play the video
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log('Play failed:', error);
        });
      }
    }
  };

  const handleVolumeClick = (e) => {
    e.stopPropagation();
    
    if (isMuted) {
      // Unmute - if last volume was 0, set to 0.7, otherwise use last volume
      const newVolume = lastVolume === 0 ? 0.7 : lastVolume;
      setVolume(newVolume);
      setIsMuted(false);
      videoRef.current.muted = false;
      // Remember user preference: unmuted
      setUserMutedPreference(false);
    } else {
      // Mute - remember current volume before muting
      setLastVolume(volume);
      setVolume(0);
      setIsMuted(true);
      videoRef.current.muted = true;
      // Remember user preference: muted
      setUserMutedPreference(true);
    }
    
    setShowVolumeSlider(false);
    showControlsTemporarily();
  };

  const handleVolumeButtonMouseEnter = () => {
    setShowVolumeSlider(true);
    if (volumeHoverTimeout) {
      clearTimeout(volumeHoverTimeout);
    }
  };

  const handleVolumeButtonMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 500);
    setVolumeHoverTimeout(timeout);
  };

  const handleVolumeSliderMouseEnter = () => {
    setShowVolumeSlider(true);
    if (volumeHoverTimeout) {
      clearTimeout(volumeHoverTimeout);
    }
  };

  const handleVolumeSliderMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 500);
    setVolumeHoverTimeout(timeout);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Update last volume if not muted
    if (!isMuted) {
      setLastVolume(newVolume);
    }
    
    // Auto-unmute when volume is increased from 0
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
      // Remember user preference: unmuted
      setUserMutedPreference(false);
    }
  };

  const toggleFullscreen = async (e) => {
    if (e) e.stopPropagation();
    
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        
        if (videoRef.current && !isPlaying) {
          await videoRef.current.play();
          setIsPlaying(true);
        }
        showControlsTemporarily();
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log(`Fullscreen error: ${err.message}`);
    }
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();

    if (!videoRef.current || !progressRef.current) return;

    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / progressBar.offsetWidth;
    const newTime = Math.max(0, Math.min(clickPosition * duration, duration));

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!videoRef.current || !progressRef.current) return;

    setIsDragging(true);

    // Calculate initial seek position
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / progressBar.offsetWidth;
    const newTime = Math.max(0, Math.min(clickPosition * duration, duration));

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !videoRef.current || !progressRef.current) return;

    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const movePosition = (e.clientX - rect.left) / progressBar.offsetWidth;
    const newTime = Math.max(0, Math.min(movePosition * duration, duration));

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    togglePlay(e);
    showControlsTemporarily();
  };

  const handleFullscreenClick = (e) => {
    e.stopPropagation();
    toggleFullscreen(e);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (!isPlaying || isFullscreen) return;
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isFullscreen) {
      const timeout = setTimeout(() => {
        setShowControls(false);
        setShowVolumeSlider(false);
      }, 1000);
      setControlsTimeout(timeout);
    }
  };

  const handleKeyDown = (e) => {
    if (!isFullscreen) return;
    
    e.stopPropagation();
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay(e);
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen(e);
        break;
      case 'm':
        e.preventDefault();
        handleVolumeClick(e);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(prev => {
          const newVolume = Math.min(1, prev + 0.1);
          setLastVolume(newVolume);
          return newVolume;
        });
        if (isMuted) {
          setIsMuted(false);
          videoRef.current.muted = false;
          setUserMutedPreference(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(prev => {
          const newVolume = Math.max(0, prev - 0.1);
          setLastVolume(newVolume);
          return newVolume;
        });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
        }
        break;
      default:
        break;
    }
  };

  // Add keyboard event listener for fullscreen controls
  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, isPlaying, isMuted, duration, volume]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX size={isFullscreen ? 24 : 16} className="text-white" />;
    } else if (volume > 0.5) {
      return <Volume2 size={isFullscreen ? 24 : 16} className="text-white" />;
    } else {
      return <Volume2 size={isFullscreen ? 24 : 16} className="text-white" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black group ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : "min-h-64 sm:min-h-80 md:min-h-96"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        src={src}
        className={`w-full cursor-pointer ${
          isFullscreen 
            ? "w-full h-full object-contain" 
            : "max-h-96 object-contain"
        } ${isLoading ? 'invisible' : 'visible'}`}
        muted={isMuted}
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={handleVideoClick}
      />
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 min-h-64 sm:min-h-80 md:min-h-96">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Progress Bar - Only show when controls are visible */}
      {(showControls || isFullscreen) && (
        <div
          ref={progressRef}
          className={`absolute bg-gray-600 bg-opacity-50 cursor-pointer group/progress z-40 ${
            isFullscreen
              ? "bottom-16 left-4 right-4 h-3"
              : "bottom-12 left-0 right-0 h-2"
          }`}
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        >
          <div 
            className="h-full bg-brand-500 relative group-hover/progress:bg-brand-400 transition-colors"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" 
                 style={{
                   width: isFullscreen ? '12px' : '10px',
                   height: isFullscreen ? '12px' : '10px'
                 }} 
            />
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 transition-opacity duration-300 z-20 ${
        showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
      } ${isFullscreen ? 'p-6' : ''}`}>
        {/* Progress Time */}
        <div className={`flex items-center justify-between text-white mb-2 px-1 ${
          isFullscreen ? 'text-sm mb-4' : 'text-xs'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 video-controls">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 ${
                isFullscreen ? 'w-12 h-12' : 'w-8 h-8'
              }`}
            >
              {isPlaying ? (
                <Pause size={isFullscreen ? 24 : 16} className="text-white" />
              ) : (
                <Play size={isFullscreen ? 24 : 16} className="text-white ml-0.5" />
              )}
            </button>
            
            {/* Volume Controls */}
            <div 
              className="relative flex items-center gap-1"
              ref={volumeSliderRef}
            >
              <button
                onClick={handleVolumeClick}
                onMouseEnter={handleVolumeButtonMouseEnter}
                onMouseLeave={handleVolumeButtonMouseLeave}
                className={`bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 ${
                  isFullscreen ? 'w-12 h-12' : 'w-8 h-8'
                }`}
              >
                {getVolumeIcon()}
              </button>

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-black bg-opacity-90 rounded-lg p-3 shadow-lg z-30"
                  onMouseEnter={handleVolumeSliderMouseEnter}
                  onMouseLeave={handleVolumeSliderMouseLeave}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                  <div className="text-xs text-white text-center mt-1">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>

            {!isFullscreen && (
              <div className="text-xs text-white ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 video-controls">
            <button
              onClick={handleFullscreenClick}
              className={`bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 ${
                isFullscreen ? 'w-12 h-12' : 'w-8 h-8'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 size={isFullscreen ? 24 : 16} className="text-white" />
              ) : (
                <Maximize2 size={isFullscreen ? 24 : 16} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Play/Pause Overlay - Only show when no controls are visible and video is paused */}
      {!isPlaying && !showControls && !isFullscreen && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-200 group-hover:bg-opacity-20 cursor-pointer z-10"
          onClick={handleVideoClick}
        >
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200 hover:scale-110">
            <Play size={32} className="text-black ml-1" />
          </div>
        </div>
      )}

      {/* Fullscreen Play/Pause Overlay */}
      {isFullscreen && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer z-10"
          onClick={handleVideoClick}
        >
          <div className="w-24 h-24 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200 hover:scale-110">
            <Play size={48} className="text-black ml-2" />
          </div>
        </div>
      )}

      {/* Video Indicator */}
      {!isFullscreen && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
          <Play size={12} />
          Video
        </div>
      )}

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <button
          onClick={handleFullscreenClick}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
        >
          <Minimize2 size={20} className="text-white" />
        </button>
      )}
    </div>
  );
};
// ... Rest of the JobCard component remains exactly the same as in the previous implementation
// (The JobCard component code from the previous response should be placed here)
// Due to character limits, I'm showing only the VideoPlayer component changes
// The JobCard component should be exactly the same as in the previous response
