import React, { useEffect, useRef, useState, useCallback } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';

interface SplashScreenProps {
  /** Called when splash animation finishes and app should transition */
  onComplete: () => void;
  /** Signal that the application background loading is ready */
  appReady?: boolean;
}

const LOTTIE_PATH = '/agribiz-splash.json';

export const SplashScreenLottie: React.FC<SplashScreenProps> = ({ onComplete, appReady = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [animEnded, setAnimEnded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const hasCompleted = useRef(false);

  const tryComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 450); // Smooth fade-out duration
  }, [onComplete]);

  // When animation finishes AND app state is ready
  useEffect(() => {
    if (animEnded && appReady) {
      tryComplete();
    }
  }, [animEnded, appReady, tryComplete]);

  // Initialize Lottie Animation Player
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: LOTTIE_PATH,
    });
    animRef.current = instance;

    instance.addEventListener('complete', () => {
      // Hold completed frame briefly (250ms) before fading out
      setTimeout(() => {
        setAnimEnded(true);
      }, 250);
    });

    // Fallback safety timeout (4.0s max)
    const timer = setTimeout(() => {
      setAnimEnded(true);
    }, 4000);

    return () => {
      clearTimeout(timer);
      instance.destroy();
    };
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
        backgroundColor: 'rgba(15, 23, 42, 0.96)', // Elegant slate background with slight blur
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 450ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: fading ? 'none' : 'all',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{
          width: '573px',
          height: '436px',
          maxWidth: '88vw',
          maxHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default SplashScreenLottie;
