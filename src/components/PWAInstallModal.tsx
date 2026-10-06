import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, X, AlertCircle, Info, Sparkles, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PWAInstallModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    isInstallModalOpen,
    closeInstallModal,
    handleInstallPWA,
    deferredPrompt,
    isPwaInstalled,
    settings
  } = useApp();

  const [appNameInput, setAppNameInput] = useState('AgriBiz');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isInstallModalOpen) {
      const savedName = localStorage.getItem('agribiz_pwa_custom_name');
      setAppNameInput(savedName && savedName.trim() ? savedName.trim() : 'AgriBiz');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isInstallModalOpen]);

  if (!isInstallModalOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAppNameInput(val);
    if (val.trim()) {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = appNameInput.trim();

    if (!trimmedName) {
      setErrorMsg(t('pwa.errorAppNameEmpty', 'Application name cannot be empty.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await handleInstallPWA(trimmedName);
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setIsSubmitting(false);
      closeInstallModal();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={closeInstallModal}
    >
      <div
        className="modal-content animate-fade-in-scale"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-app)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('pwa.installTitle', 'Install Application')}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {t('pwa.installSub', 'Customize your app experience before installing')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeInstallModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
            title={t('common.cancel', 'Cancel')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Logo & Icon Preview Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                flexShrink: 0
              }}
            >
              {settings?.showLogo && settings?.logo ? (
                <img src={settings.logo} alt="App Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img src="/logo-192.png" alt="App Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {appNameInput.trim() || 'AgriBiz'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t('pwa.standaloneApp', 'Standalone Web Application (PWA)')}
              </div>
            </div>
          </div>

          {/* Input Field: App Name */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="pwa-app-name-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              {t('pwa.appNameLabel', 'App Name')}
            </label>
            <input
              id="pwa-app-name-input"
              type="text"
              value={appNameInput}
              onChange={handleInputChange}
              placeholder={t('pwa.appNamePlaceholder', 'AgriBiz')}
              className="form-control"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: errorMsg ? '1px solid var(--danger, #ef4444)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              autoFocus
            />
            {errorMsg ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {t('pwa.defaultHelpText', 'Default: AgriBiz. Enter custom name (e.g. Daivyayog).')}
              </div>
            )}
          </div>

          {/* Browser Limitation / Guidance Note */}
          {isIOS ? (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <Smartphone size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{t('pwa.iosTitle', 'iOS Safari Instructions:')}</strong> {t('pwa.iosBody', 'Tap the Share icon in Safari, scroll down, and select Add to Home Screen. You can customize the icon name directly on your device screen.')}
              </div>
            </div>
          ) : !deferredPrompt ? (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <Info size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                {isPwaInstalled
                  ? t('pwa.alreadyInstalled', 'AgriBiz is already installed on your device as a PWA.')
                  : t('pwa.browserControlNotice', 'Your browser controls the native install prompt. Dynamic manifest title applied for installation.')}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                {t('pwa.installNoticePrefix', 'Clicking')} <strong>{t('pwa.installApp', 'Install App')}</strong> {t('pwa.installNoticeMiddle', 'will update the Web App Manifest name to')} <strong>"{appNameInput.trim() || 'AgriBiz'}"</strong> {t('pwa.installNoticeSuffix', 'and trigger the browser installation prompt.')}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeInstallModal}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !!errorMsg}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSubmitting || !!errorMsg ? 'not-allowed' : 'pointer'
              }}
            >
              <Download size={16} />
              <span>{isSubmitting ? t('pwa.installing', 'Installing...') : t('pwa.installApp', 'Install App')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
