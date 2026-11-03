import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmTone = 'primary', // 'primary', 'danger', 'amber'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null

  const confirmBg =
    confirmTone === 'danger'
      ? '#DC2626'
      : confirmTone === 'amber'
      ? '#D97706'
      : '#2563EB'

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 99999,
        padding: 16,
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 94vw)',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
          border: '1px solid #CBD5E1',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'fosisModalFadeIn 0.15s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: confirmTone === 'danger' ? '#FEE2E2' : '#EFF6FF',
                color: confirmTone === 'danger' ? '#DC2626' : '#2563EB',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
          {message}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 8
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              background: confirmBg,
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
