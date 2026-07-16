import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SplashScreenProps {
  /** Called when splash finishes and app should show */
  onComplete: () => void;
  /** Signal that the application is ready (data loaded, routes prepared) */
  appReady: boolean;
}

const WEBM_SRC = '/Makes_these_animation_video_fr.webm';
const LOGO_SRC = '/logo-512.png'; // Fallback PNG logo

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, appReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const hasCompleted = useRef(false);

  const tryComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    // Start fade-out
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 420); // fade duration
  }, [onComplete]);

  // When BOTH video done AND app ready → complete
  useEffect(() => {
    if (videoEnded && appReady) {
      tryComplete();
    }
  }, [videoEnded, appReady, tryComplete]);

  // Video ended handler
  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
  }, []);

  // If WebM fails, fall back to PNG + timer
  const handleVideoError = useCallback(() => {
    setVideoError(true);
    // Give a minimum 1.8s for PNG splash
    setTimeout(() => setVideoEnded(true), 1800);
  }, []);

  // Safety: if WebM never loads within 4s, move on
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoEnded(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Start video as soon as component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — treat as ended
        setVideoEnded(true);
      });
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: fading ? 'none' : 'all',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dark theme support */}
      <style>{`
        @media (prefers-color-scheme: dark) {
          .splash-root { background-color: #0f1a12 !important; }
        }
        body.dark-theme .splash-root { background-color: #0f1a12 !important; }
      `}</style>

      <div
        className="splash-root"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        {!videoError ? (
          /* ── WebM video splash ── */
          <video
            ref={videoRef}
            src={WEBM_SRC}
            muted
            playsInline
            autoPlay
            disablePictureInPicture
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            style={{
              maxWidth: '280px',
              maxHeight: '280px',
              width: '60vw',
              height: '60vw',
              objectFit: 'contain',
              pointerEvents: 'none',
              display: 'block',
              // Hide all native video controls
              outline: 'none',
              border: 'none',
              background: 'transparent',
            }}
            // Disable all controls & interactions
            controls={false}
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
          />
        ) : (
          /* ── PNG fallback splash ── */
          <img
            src={LOGO_SRC}
            alt=""
            draggable={false}
            style={{
              width: '160px',
              height: '160px',
              objectFit: 'contain',
              pointerEvents: 'none',
              animation: 'splashPulse 1.8s ease-in-out',
              borderRadius: '32px',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes splashPulse {
          0%   { opacity: 0; transform: scale(0.88); }
          30%  { opacity: 1; transform: scale(1.04); }
          55%  { transform: scale(0.97); }
          75%  { transform: scale(1.01); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
