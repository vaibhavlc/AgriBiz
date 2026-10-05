import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Entry',
  itemName,
  description,
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
  icon,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const isDanger = variant === 'danger';
  const defaultConfirmText = confirmText || (isDanger ? 'Delete' : 'Confirm');

  // Styling helper based on variant
  const getBadgeStyle = () => {
    if (variant === 'danger') {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        color: 'var(--color-danger, #ef4444)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      };
    }
    if (variant === 'warning') {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.2)',
      };
    }
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      color: 'var(--primary, #10b981)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    };
  };

  const getConfirmBtnStyle = (): React.CSSProperties => {
    if (variant === 'danger') {
      return {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        boxShadow: isLoading ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.35)',
      };
    }
    if (variant === 'warning') {
      return {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#ffffff',
        boxShadow: isLoading ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.35)',
      };
    }
    return {
      background: 'linear-gradient(135deg, var(--primary, #10b981) 0%, #059669 100%)',
      color: '#ffffff',
      boxShadow: isLoading ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
    };
  };

  const renderIcon = () => {
    if (icon) return icon;
    if (variant === 'danger') return <Trash2 size={24} />;
    return <AlertTriangle size={24} />;
  };

  return createPortal(
    <div
      className="modal-overlay no-print"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="card delete-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '410px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px',
        }}
      >
        {/* Top Warning Icon Badge */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...getBadgeStyle(),
            transition: 'transform 0.2s ease',
          }}
        >
          {renderIcon()}
        </div>

        {/* Title */}
        <h3
          id="delete-modal-title"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Description / Content */}
        <div
          style={{
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            wordBreak: 'break-word',
          }}
        >
          {description ? (
            description
          ) : (
            <>
              Are you sure you want to delete{' '}
              {itemName ? <strong>{itemName}</strong> : 'this entry'}? This action cannot be undone.
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading}
            onClick={onClose}
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13.5px',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-app, #f8fafc)',
              borderColor: 'var(--border-color, #cbd5e1)',
              color: 'var(--text-primary)',
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={isLoading}
            onClick={() => {
              if (!isLoading) {
                onConfirm();
              }
            }}
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13.5px',
              justifyContent: 'center',
              border: 'none',
              opacity: isLoading ? 0.75 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              ...getConfirmBtnStyle(),
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                {isDanger && <Trash2 size={15} />}
                <span>{defaultConfirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
