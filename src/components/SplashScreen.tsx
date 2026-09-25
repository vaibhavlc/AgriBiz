import React, { useEffect, useRef, useState, useCallback } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import splashAnimationData from '../../public/agribiz-splash.json';
import { SPLASH_LOGO_BASE64 } from './splashLogoBase64';

interface SplashScreenProps {
  /** Called when splash animation finishes and app should show */
  onComplete?: () => void;
  /** Signal that the application is ready */
  appReady?: boolean;
}

// Toggle flag to easily re-enable Lottie animation in the future if needed
const ENABLE_LOTTIE_ANIMATION = false;

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, appReady = true }) => {
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
      if (onComplete) onComplete();
    }, 550); // Ultra-smooth 550ms fade-out transition
  }, [onComplete]);

  // Timer for static image splash with CSS animations
  useEffect(() => {
    if (!ENABLE_LOTTIE_ANIMATION) {
      const timer = setTimeout(() => {
        setAnimEnded(true);
      }, 1500); // 1.5s total display time
      return () => clearTimeout(timer);
    }
  }, []);

  // When animation / timer completes AND app state is ready
  useEffect(() => {
    if (animEnded && appReady) {
      tryComplete();
    }
  }, [animEnded, appReady, tryComplete]);

  // Initialize Lottie Animation (Preserved for future use when ENABLE_LOTTIE_ANIMATION is set to true)
  useEffect(() => {
    if (!ENABLE_LOTTIE_ANIMATION) return;
    if (!containerRef.current) return;

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: splashAnimationData,
      rendererSettings: {
        progressiveLoad: false,
        preserveAspectRatio: 'xMidYMid meet',
        hideOnTransparent: true,
      },
    });
    animRef.current = instance;

    instance.addEventListener('complete', () => {
      setTimeout(() => {
        setAnimEnded(true);
      }, 400);
    });

    return () => {
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
        zIndex: 9999999, // Super high z-index to completely hide session loading spinners
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.03)' : 'scale(1)',
        transition: fading ? 'opacity 550ms cubic-bezier(0.4, 0, 0.2, 1), transform 550ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: fading ? 'none' : 'all',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes splashAuraGlow {
          0%, 100% {
            transform: scale(0.95);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.75;
          }
        }

        @keyframes splashLogoEntrance {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(20px);
          }
          60% {
            opacity: 1;
            transform: scale(1.05) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes splashProgressBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>

      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(59, 130, 246, 0.12) 45%, transparent 70%)',
          animation: 'splashAuraGlow 3s infinite ease-in-out',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Animated Logo - No Rectangular Container Box */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          maxWidth: '90vw',
        }}
      >
        {ENABLE_LOTTIE_ANIMATION ? (
          <div ref={containerRef} style={{ width: '320px', height: '240px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Direct Memory Base64 Logo - 0ms Network Latency */}
            <img
              src={SPLASH_LOGO_BASE64}
              alt="Daiyog Engineering Logo"
              style={{
                width: '360px',
                maxWidth: '85vw',
                height: 'auto',
                maxHeight: '260px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.12)) drop-shadow(0 0 15px rgba(16, 185, 129, 0.25))',
                animation: 'splashLogoEntrance 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            />

            {/* Bottom Accent Progress Line */}
            <div
              style={{
                width: '180px',
                height: '3.5px',
                borderRadius: '99px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                marginTop: '28px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '99px',
                  background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                  animation: 'splashProgressBar 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
