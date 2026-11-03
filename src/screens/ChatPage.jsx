import React, { useState, useRef, useEffect } from 'react'
import {
  MapPin,
  Paperclip,
  Send,
  MessageSquare,
  CheckCheck,
  ExternalLink,
  FileText,
  ClipboardList,
  Search,
  X,
  Users,
  CornerDownRight,
  Info
} from 'lucide-react'

import { useFosis } from '../context/FosisContext'
import { useToast } from '../context/ToastContext'

export default function ChatPage({
  online: globalOnline = true,
  items: propTickets = [],
  permits: propPermits = [],
  userLatitude = -7.2575,
  userLongitude = 112.7521,
  userAddress = 'POP Surabaya Gubeng - Pos Operasional Device',
  onSelectItem
}) {
  const { chatMessages, sendChatMessage, activeUser, users, tickets: ctxTickets, permits: ctxPermits } = useFosis()
  const { success, warning, error: toastError } = useToast()

  const currentUserName = activeUser?.name || 'Sanderlina Imelda'
  const currentUserRole = activeUser?.role || 'Admin'
  const currentUserEmail = activeUser?.email || 'sanderlina.imelda@gmail.com'

  // Map chatMessages from Central Context to ensure backwards and forwards compatibility
  const messages = (chatMessages || []).map((m) => ({
    id: m.id || Date.now() + Math.random(),
    senderId: m.senderId || m.sender?.id,
    senderName: m.senderName || m.sender || 'FOSIS Staff',
    senderRole: m.senderRole || m.role || 'Field Engineer',
    senderEmail: m.senderEmail || m.email || '',
    messageType: (m.type || m.messageType || (m.latitude ? 'LOCATION' : 'TEXT')).toUpperCase(),
    messageText: m.text || m.messageText || '',
    locationLatitude: m.latitude ?? m.locationLatitude,
    locationLongitude: m.longitude ?? m.locationLongitude,
    locationAddress: m.locationAddress || (m.latitude ? 'POP Surabaya Gubeng' : ''),
    attachedFormTitle: m.attachedFormTitle || '',
    attachedFormType: m.attachedFormType || '',
    attachedFormStatus: m.attachedFormStatus || '',
    attachmentName: m.attachmentName || '',
    attachmentSize: m.attachmentSize,
    ticketId: m.ticketId,
    timestamp: m.timestamp || Date.now()
  }))

  const [textInput, setTextInput] = useState('')

  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const [dialogFilterTab, setDialogFilterTab] = useState('ALL') // 'ALL', 'TICKET', 'PERMIT'
  const [toastMessage, setToastMessage] = useState(null)

  const messagesEndRef = useRef(null)

  const showToast = (text) => {
    setToastMessage(text)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${mins}`
  }

  const handleSendMessage = (
    text,
    type = 'TEXT',
    formId = null,
    formTitle = '',
    formType = '',
    formStatus = '',
    customCoords = null
  ) => {
    const lat = customCoords ? customCoords.lat : (type === 'LOCATION' ? userLatitude : undefined)
    const lng = customCoords ? customCoords.lng : (type === 'LOCATION' ? userLongitude : undefined)

    const payload = {
      text,
      type: type.toLowerCase(),
      messageType: type,
      latitude: lat,
      longitude: lng,
      locationLatitude: lat,
      locationLongitude: lng,
      locationAddress: type === 'LOCATION' ? (customCoords?.address || userAddress) : '',
      ticketId: formId,
      attachedFormTitle: formTitle,
      attachedFormType: formType,
      attachedFormStatus: formStatus
    }

    sendChatMessage(payload)
  }

  const onSendTextMessage = (e) => {
    if (e) e.preventDefault()
    if (!textInput.trim()) return
    handleSendMessage(textInput.trim(), 'TEXT')
    setTextInput('')
  }

  const onSendLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          handleSendMessage(
            'My Current Field Location (GPS Live)',
            'LOCATION',
            null,
            '',
            '',
            '',
            { lat, lng, address: `Precise Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` }
          )
          success('Device GPS coordinates shared to chat!')
        },
        (err) => {
          // Fallback gracefully to default basecamp location
          warning('GPS permission denied. Using base station coordinates.')
          handleSendMessage(
            'My Field Location (Base POP)',
            'LOCATION',
            null,
            '',
            '',
            '',
            { lat: userLatitude, lng: userLongitude, address: userAddress }
          )
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      )
    } else {
      warning('Browser does not support GPS Geolocation.')
      handleSendMessage(
        'My Field Location (POP Gubeng)',
        'LOCATION',
        null,
        '',
        '',
        '',
        { lat: userLatitude, lng: userLongitude, address: userAddress }
      )
    }
  }


  const openGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const availableTickets = (propTickets && propTickets.length > 0) ? propTickets : (ctxTickets || [])
  const availablePermits = (propPermits && propPermits.length > 0) ? propPermits : (ctxPermits || [])

  const filteredTickets = availableTickets.filter(t => {
    if (!filterQuery) return true
    const q = filterQuery.toLowerCase()
    return (
      (t.ticketNo && t.ticketNo.toLowerCase().includes(q)) ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.type && t.type.toLowerCase().includes(q))
    )
  })

  const filteredPermits = availablePermits.filter(p => {
    if (!filterQuery) return true
    const q = filterQuery.toLowerCase()
    return (
      (p.permitNo && p.permitNo.toLowerCase().includes(q)) ||
      (p.site && p.site.toLowerCase().includes(q)) ||
      (p.workType && p.workType.toLowerCase().includes(q))
    )
  })

  return (
    <div className="page" style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(6px)',
            animation: 'fosisModalFadeIn 0.2s ease-out'
          }}
        >
          <Info size={16} color="#60A5FA" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Layout (Desktop: Chat Feed Full-Width / Mobile: Stacked) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          width: '100%',
          marginTop: 0
        }}
        className="chat-main-grid"
      >
        {/* Chat Feed Column */}
        <div
          style={{
            flex: 1,
            width: '100%',
            minHeight: 0,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
          }}
        >
          {/* Header Info Bar */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 12
                }}
              >
                <Users size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                  FOSIS Field Operational Coordination Group
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  {users?.length || 21} Team Members Connected • All Roles &amp; Accounts Active
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 10.5,
                background: '#E2E8F0',
                color: '#475569',
                padding: '4px 10px',
                borderRadius: 999,
                fontWeight: 700
              }}
            >
              {messages.length} Pesan
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
            className="dialog-scroll-body"
          >
            {/* Welcoming system card if empty or top */}
            <div
              style={{
                borderRadius: 12,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E40AF', fontWeight: 800, fontSize: 12 }}>
                <MessageSquare size={16} color="#1D4ED8" />
                <span>FOSIS Operational Field Chat Active</span>
              </div>
              <div style={{ fontSize: 11, color: '#1E3A8A', marginTop: 4, lineHeight: 1.4 }}>
                Coordinate across all operational roles in real time, share locked GPS coordinates, and attach tickets or working permits.
              </div>
            </div>

            {/* Bubble Messages */}
            {messages.map((msg) => {
              const isMe =
                (msg.senderEmail && msg.senderEmail.toLowerCase() === currentUserEmail.toLowerCase()) ||
                (msg.senderName && msg.senderName.toLowerCase() === currentUserName.toLowerCase())

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  {/* Sender label */}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#64748B',
                      marginBottom: 3,
                      padding: '0 6px'
                    }}
                  >
                    {msg.senderName} ({msg.senderRole})
                  </div>

                  {/* Bubble Content */}
                  <div
                    style={{
                      maxWidth: '85%',
                      minWidth: '220px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? '#2563EB' : '#FFFFFF',
                      border: `1px solid ${isMe ? '#1D4ED8' : '#E2E8F0'}`,
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      padding: '10px 12px',
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {/* TEXT MESSAGE */}
                    {msg.messageType === 'TEXT' && (
                      <div style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {msg.messageText}
                      </div>
                    )}

                    {/* LOCATION MESSAGE */}
                    {msg.messageType === 'LOCATION' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin
                            size={16}
                            color={isMe ? '#FDE047' : '#DC2626'}
                            style={{ flexShrink: 0 }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              letterSpacing: '0.3px',
                              color: isMe ? '#FFFFFF' : '#0F172A'
                            }}
                          >
                            SHARED GPS LOCATION
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: isMe ? '#93C5FD' : '#0284C7',
                            marginTop: 4
                          }}
                        >
                          Coordinates: {Number(msg.locationLatitude || userLatitude).toFixed(5)},{' '}
                          {Number(msg.locationLongitude || userLongitude).toFixed(5)}
                        </div>
                        {msg.locationAddress && (
                          <div
                            style={{
                              fontSize: 10,
                              color: isMe ? '#E0E7FF' : '#475569',
                              marginTop: 2
                            }}
                          >
                            {msg.locationAddress}
                          </div>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() =>
                              openGoogleMaps(
                                msg.locationLatitude || userLatitude,
                                msg.locationLongitude || userLongitude
                              )
                            }
                            style={{
                              border: 0,
                              background: isMe ? '#FFFFFF' : '#1E88E5',
                              color: isMe ? '#1E88E5' : '#FFFFFF',
                              borderRadius: 8,
                              padding: '5px 10px',
                              fontSize: 10,
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer'
                            }}
                          >
                            <MapPin size={12} />
                            <span>Open in Google Maps</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FORM TICKET / PERMIT MESSAGE */}
                    {(msg.messageType === 'FORM_TICKET' || msg.messageType === 'FORM_PERMIT') && (
                      <div
                        style={{
                          borderRadius: 8,
                          background: isMe ? '#1D4ED8' : '#F1F5F9',
                          padding: 10,
                          marginTop: 2
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginBottom: 4
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 900,
                              color: isMe ? '#FDE047' : '#1D4ED8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            {msg.messageType === 'FORM_TICKET' ? (
                              <>
                                <ClipboardList size={13} />
                                <span>TASK TICKET FORM</span>
                              </>
                            ) : (
                              <>
                                <FileText size={13} />
                                <span>WORKING PERMIT (SIK)</span>
                              </>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              background: '#DCFCE7',
                              color: '#15803D',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}
                          >
                            {msg.attachedFormStatus || 'IN PROGRESS'}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: isMe ? '#FFFFFF' : '#0F172A',
                            marginTop: 2
                          }}
                        >
                          {msg.attachedFormTitle}
                        </div>

                        {msg.messageText && (
                          <div
                            style={{
                              fontSize: 10,
                              color: isMe ? '#E0E7FF' : '#475569',
                              marginTop: 4
                            }}
                          >
                            Note: {msg.messageText}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: Timestamp */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 6,
                        marginTop: 6
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: isMe ? '#BFDBFE' : '#94A3B8'
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                      <CheckCheck
                        size={13}
                        color={isMe ? '#86EFAC' : '#16A34A'}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Bar (Kirim GPS & Lampirkan Form) */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              gap: 8
            }}
          >
            <button
              type="button"
              onClick={onSendLocation}
              style={{
                flex: 1,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <MapPin size={14} color="#DC2626" />
              <span>📍 Kirim Lokasi GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAttachDialogOpen(true)}
              style={{
                flex: 1,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Paperclip size={14} color="#2563EB" />
              <span>📋 Lampirkan Form</span>
            </button>
          </div>

          {/* Input Chat Field Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF'
            }}
          >
            <form
              onSubmit={onSendTextMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 999,
                padding: '4px 6px 4px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Tulis pesan koordinasi tim..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  background: 'transparent',
                  color: '#0F172A'
                }}
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: textInput.trim() ? '#2563EB' : '#94A3B8',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: textInput.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s ease',
                  flexShrink: 0
                }}
                title="Kirim Pesan"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Attach Form Picker Dialog Modal (Sesuai Compose AlertDialog) */}
      {isAttachDialogOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAttachDialogOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 999,
            padding: 16
          }}
        >
          <div
            className="modal fosis-responsive-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(580px, 94vw)',
              maxHeight: '84vh',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #CBD5E1',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC'
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                  Select Attachment to Share
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  Select an operational ticket or working permit (SIK) to dispatch to chat
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAttachDialogOpen(false)}
                className="icon-btn"
                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '14px 20px', flex: 1, overflowY: 'auto' }} className="dialog-scroll-body">
              {/* Search & Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                  />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search ticket number, permit, or location..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setDialogFilterTab('ALL')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: dialogFilterTab === 'ALL' ? '#4F46E5' : '#E2E8F0',
                    background: dialogFilterTab === 'ALL' ? '#EEF2FF' : '#FFFFFF',
                    color: dialogFilterTab === 'ALL' ? '#4F46E5' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  All ({filteredTickets.length + filteredPermits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDialogFilterTab('TICKET')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: dialogFilterTab === 'TICKET' ? '#4F46E5' : '#E2E8F0',
                    background: dialogFilterTab === 'TICKET' ? '#EEF2FF' : '#FFFFFF',
                    color: dialogFilterTab === 'TICKET' ? '#4F46E5' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Task Tickets ({filteredTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDialogFilterTab('PERMIT')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: dialogFilterTab === 'PERMIT' ? '#4F46E5' : '#E2E8F0',
                    background: dialogFilterTab === 'PERMIT' ? '#EEF2FF' : '#FFFFFF',
                    color: dialogFilterTab === 'PERMIT' ? '#4F46E5' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Work Permits ({filteredPermits.length})
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Tickets Section */}
                {(dialogFilterTab === 'ALL' || dialogFilterTab === 'TICKET') &&
                  filteredTickets.map((item) => (
                    <div
                      key={`ticket-${item.id}`}
                      onClick={() => {
                        handleSendMessage(
                          `Attached Ticket: ${item.ticketNo}`,
                          'FORM_TICKET',
                          item.id,
                          `${item.ticketNo} - ${item.title}`,
                          item.type || 'TROUBLESHOOT',
                          item.workflowStatus || 'IN PROGRESS'
                        )
                        setIsAttachDialogOpen(false)
                        showToast(`Ticket form ${item.ticketNo} attached!`)
                        if (onSelectItem) onSelectItem(item)
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F1F5F9'
                        e.currentTarget.style.borderColor = '#CBD5E1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8FAFC'
                        e.currentTarget.style.borderColor = '#E2E8F0'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#1E293B' }}>
                            {item.ticketNo}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              background: '#E2E8F0',
                              color: '#334155',
                              padding: '1px 5px',
                              borderRadius: 4
                            }}
                          >
                            {item.type}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {item.title}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: '#EEF2FF',
                          color: '#2563EB',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Send size={13} />
                      </div>
                    </div>
                  ))}

                {/* Permits Section */}
                {(dialogFilterTab === 'ALL' || dialogFilterTab === 'PERMIT') &&
                  filteredPermits.map((permit) => (
                    <div
                      key={`permit-${permit.id}`}
                      onClick={() => {
                        handleSendMessage(
                          `Attached Permit: ${permit.permitNo}`,
                          'FORM_PERMIT',
                          permit.id,
                          `${permit.permitNo} - ${permit.site || permit.siteLocation || 'POP'}`,
                          'SIK',
                          permit.status || 'APPROVED'
                        )
                        setIsAttachDialogOpen(false)
                        showToast(`Work Permit form ${permit.permitNo} attached!`)
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#DCFCE7'
                        e.currentTarget.style.borderColor = '#86EFAC'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F0FDF4'
                        e.currentTarget.style.borderColor = '#BBF7D0'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#166534' }}>
                            {permit.permitNo}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              background: '#DCFCE7',
                              color: '#15803D',
                              padding: '1px 5px',
                              borderRadius: 4
                            }}
                          >
                            SIK ({permit.status})
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                          Location: {permit.site || permit.siteLocation || '-'} • {permit.workType}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: '#DCFCE7',
                          color: '#16A34A',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Send size={13} />
                      </div>
                    </div>
                  ))}

                {filteredTickets.length === 0 && filteredPermits.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: 12 }}>
                    No forms match your search query.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button
                type="button"
                onClick={() => setIsAttachDialogOpen(false)}
                style={{
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
