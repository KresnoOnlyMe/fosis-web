import React, { useState } from 'react'
import {
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Edit2,
  Trash2,
  Sliders,
  Send,
  Info,
  CheckCircle2,
  X,
  Phone,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react'

// Helper formatter nomor WhatsApp Indonesia (+62)
function formatToIndonesianWhatsApp(rawPhone = '') {
  if (!rawPhone) return '+6281200000000'
  let clean = rawPhone.toString().replace(/\D/g, '')
  if (clean.startsWith('62')) {
    return `+${clean}`
  }
  if (clean.startsWith('0')) {
    return `+62${clean.substring(1)}`
  }
  return `+62${clean}`
}

// Helper pengiriman pesan WhatsApp via URL (Web & App)
function sendWhatsAppMessage(rawPhone, subject, bodyMessage) {
  const formattedPhone = formatToIndonesianWhatsApp(rawPhone).replace('+', '')
  const fullText = subject ? `*${subject}*\n\n${bodyMessage}` : bodyMessage
  const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(fullText)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Role badge background color
function getRoleBadgeBg(role = '') {
  const r = role.toLowerCase()
  if (r.includes('dept') || r.includes('head')) return '#0F4C81'
  if (r.includes('admin')) return '#6750A4'
  if (r.includes('troubleshoot') || r.includes('operation')) return '#B3261E'
  if (r.includes('maintenance')) return '#0284C7'
  return '#10B981'
}

export default function UserManagementPage({
  users = [],
  activeUser,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onTrigger2FATest
}) {
  // Verify if active user is administrator
  const userRoleStr = (activeUser?.role || '').toLowerCase()
  const isAdmin =
    userRoleStr.includes('admin') ||
    userRoleStr === 'administrasi' ||
    activeUser?.canDelete === true

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Admin WhatsApp Simulation Notification (+6289665805758)
  const handleSendAdminWANotification = () => {
    const targetPhone = '+6289665805758'
    sendWhatsAppMessage(
      targetPhone,
      'FOSIS OPERATIONAL ADMIN ACCOUNT',
      `Hello Sanderlina Imelda (Admin),\n\nHere is your FOSIS account details:\n• Admin Account: Sanderlina Imelda\n• Phone: ${targetPhone}\n• Status: Active (Super Admin)`
    )
    showToast('Opening Admin WhatsApp (+6289665805758)...')
  }

  return (
    <div className="page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            backdropFilter: 'blur(6px)'
          }}
        >
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin / Team Access Header Card */}
      <div
        style={{
          borderRadius: 16,
          backgroundColor: isAdmin ? '#F3E8FF' : '#F0FDF4',
          border: `1px solid ${isAdmin ? '#D8B4FE' : '#BBF7D0'}`,
          padding: '14px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isAdmin ? '#E9D5FF' : '#DCFCE7',
                color: isAdmin ? '#7E22CE' : '#16A34A',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              {isAdmin ? <ShieldCheck size={24} /> : <Eye size={22} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: isAdmin ? '#581C87' : '#14532D'
                }}
              >
                Team Access Permissions &amp; Roles
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: isAdmin ? '#6B21A8' : '#15803D',
                  marginTop: 2
                }}
              >
                {isAdmin
                  ? 'Admin Full Access: Create, Edit, Delete, and View Team Access Permissions'
                  : 'Team View (Read-Only): View members and roles. Changes are reserved for Admin.'}
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddDialog(true)}
              style={{
                background: '#7E22CE',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(126, 34, 206, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <UserPlus size={15} />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Card: Admin WhatsApp Notification Simulation (+6289665805758) */}
      <div
        style={{
          borderRadius: 12,
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#14532D' }}>
            Admin WhatsApp Notification Simulation (+6289665805758)
          </div>
          <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
            Send staff credentials notification to Admin WhatsApp +6289665805758
          </div>
        </div>
        <button
          onClick={handleSendAdminWANotification}
          style={{
            background: '#16A34A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '7px 12px',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <Send size={13} />
          <span>Send WA (+62)</span>
        </button>
      </div>

      {/* Read-Only Info Banner for non-admin */}
      {!isAdmin && (
        <div
          style={{
            borderRadius: 12,
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <Info size={18} color="#2563EB" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: '#1E40AF', lineHeight: 1.4 }}>
            Team members can view the roster and permission roles below. Updates are managed by Admin.
          </div>
        </div>
      )}

      {/* User Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map((user) => (
          <UserPermissionCard
            key={user.id}
            user={user}
            isActive={user.name === activeUser?.name}
            isAdmin={isAdmin}
            onUpdateUser={onUpdateUser}
            onEditUser={() => setUserToEdit(user)}
            onDeleteUser={() => setUserToDelete(user)}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Modal Add Staff / Team */}
      {showAddDialog && (
        <AddEditStaffDialog
          title="Add New Team Member"
          initialName=""
          initialRole="Field Engineer"
          initialTeam="Field Operations"
          initialPhone="+6281200000000"
          initialPasswordPin="1234567890"
          onDismiss={() => setShowAddDialog(false)}
          onSubmit={(name, role, team, phone, passwordPin) => {
            if (onAddUser) {
              onAddUser(name, role, team, phone, passwordPin)
            }
            setShowAddDialog(false)
            showToast(`New staff member '${name}' registered successfully!`)
          }}
        />
      )}

      {/* Modal Edit Staff / Team */}
      {userToEdit && (
        <AddEditStaffDialog
          title={`Edit Permissions: ${userToEdit.name}`}
          initialName={userToEdit.name}
          initialRole={userToEdit.role}
          initialTeam={userToEdit.region || userToEdit.role}
          initialPhone={userToEdit.phone || '+6281200000000'}
          initialPasswordPin={userToEdit.passwordPin || '1234567890'}
          onDismiss={() => setUserToEdit(null)}
          onSubmit={(name, role, team, phone, passwordPin) => {
            if (onUpdateUser) {
              onUpdateUser({
                ...userToEdit,
                name,
                role,
                region: team,
                phone,
                passwordPin
              })
            }
            setUserToEdit(null)
            showToast(`Access data for '${name}' updated successfully!`)
          }}
        />
      )}

      {/* Modal Confirm Delete Staff */}
      {userToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setUserToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 999,
            padding: 16
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(450px, 94vw)',
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #CBD5E1'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
              <AlertTriangle size={24} />
              <div style={{ fontSize: 16, fontWeight: 800 }}>Confirm Staff Removal</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 12, lineHeight: 1.5 }}>
              Are you sure you want to remove staff member <strong>'{userToDelete.name}'</strong> (
              {userToDelete.region || userToDelete.role}) from system access?
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20
              }}
            >
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteUser) onDeleteUser(userToDelete)
                  const deletedName = userToDelete.name
                  setUserToDelete(null)
                  showToast(`Staff member '${deletedName}' has been removed.`)
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Yes, Remove Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserPermissionCard({
  user,
  isActive,
  isAdmin,
  onUpdateUser,
  onEditUser,
  onDeleteUser,
  showToast
}) {
  const [expandedPermissions, setExpandedPermissions] = useState(false)
  const [isPinVisible, setIsPinVisible] = useState(false)

  const initials =
    user.initials ||
    (user.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'SI')

  const roleText =
    user.region === user.role ? user.role : `${user.region || user.role} • ${user.role}`
  const formattedPhone = formatToIndonesianWhatsApp(user.phone)
  const displayPin = user.passwordPin || '1234567890'

  const handleSendWA = () => {
    sendWhatsAppMessage(
      formattedPhone,
      `[FOSIS Account Access] ${user.name} - ${user.region || user.role}`,
      `Hello ${user.name},\nHere are your FOSIS account credentials:\n• Staff / Team: ${user.name}\n• Department / Role: ${user.region || user.role} (${user.role})\n• WhatsApp Phone: ${formattedPhone}\n• PIN Password: ${displayPin}\n\nPlease use this numeric PIN to log in to the FOSIS application.`
    )
    showToast(`Sending access credentials for ${user.name} via WhatsApp...`)
  }

  return (
    <div
      style={{
        borderRadius: 14,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        padding: 16,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* User Header Row (NO EMAIL DISPLAYED AS SPECIFIED IN KOTLIN COMPOSE) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: getRoleBadgeBg(user.role),
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 14,
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{user.name}</span>
              {isActive && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    background: '#DCFCE7',
                    color: '#16A34A',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}
                >
                  Sedang Login
                </span>
              )}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>{roleText}</div>

            {/* Nomor HP & WhatsApp Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: '#64748B' }}>No. HP: {formattedPhone}</span>
              <button
                type="button"
                onClick={handleSendWA}
                style={{
                  border: '1px solid #86EFAC',
                  background: '#DCFCE7',
                  color: '#15803D',
                  borderRadius: 6,
                  padding: '2px 7px',
                  fontSize: 9.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <Send size={10} color="#16A34A" />
                <span>WA (+62)</span>
              </button>
            </div>

            {/* Password PIN Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {isAdmin ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>
                    Password PIN: {isPinVisible ? displayPin : '•'.repeat(Math.max(displayPin.length, 4))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPinVisible(!isPinVisible)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748B',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      padding: 2
                    }}
                    title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                  >
                    {isPinVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                  Password PIN: •••••••• (Khusus Admin)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={onEditUser}
                title="Edit Staf"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #BAE6FD',
                  background: '#F0F9FF',
                  color: '#0284C7',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={15} />
              </button>

              {user.role !== 'Administrasi' && user.role !== 'Admin' && (
                <button
                  type="button"
                  onClick={onDeleteUser}
                  title="Remove Staff"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setExpandedPermissions(!expandedPermissions)}
                title="Manage RBAC Permissions"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #DDD6FE',
                  background: expandedPermissions ? '#EDE9FE' : '#F5F3FF',
                  color: '#7C3AED',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {expandedPermissions ? <ChevronUp size={17} /> : <Sliders size={16} />}
              </button>
            </>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: '#F3F4F6',
                color: '#6B7280',
                padding: '4px 8px',
                borderRadius: 6
              }}
            >
              View Only
            </span>
          )}
        </div>
      </div>

      {/* Expandable Permission Switches (RBAC) */}
      {expandedPermissions && isAdmin && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
            Staff Access Permissions Configuration (RBAC):
          </div>

          <PermissionSwitch
            title="Create Permissions (Create)"
            subtitle="Create new troubleshoot, maintenance, or administration tasks"
            checked={!!user.canCreate}
            onChange={(val) => {
              if (onUpdateUser) onUpdateUser({ ...user, canCreate: val })
            }}
          />

          <PermissionSwitch
            title="Edit Permissions (Update)"
            subtitle="Update task specifications and field execution details"
            checked={!!user.canEdit}
            onChange={(val) => {
              if (onUpdateUser) onUpdateUser({ ...user, canEdit: val })
            }}
          />

          <PermissionSwitch
            title="Delete Permissions (Delete)"
            subtitle="Delete incorrect or duplicate operational records"
            checked={!!user.canDelete}
            onChange={(val) => {
              if (onUpdateUser) onUpdateUser({ ...user, canDelete: val })
            }}
          />

          <PermissionSwitch
            title="File Export &amp; Import"
            subtitle="Export PDF/Excel/PPT and import work permit files"
            checked={!!user.canImportPermit}
            onChange={(val) => {
              if (onUpdateUser)
                onUpdateUser({
                  ...user,
                  canImportPermit: val,
                  canExportPdf: val
                })
            }}
          />
        </div>
      )}
    </div>
  )
}

function PermissionSwitch({ title, subtitle, checked, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        borderRadius: 8,
        background: '#F8FAFC'
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{title}</div>
        <div style={{ fontSize: 10, color: '#64748B' }}>{subtitle}</div>
      </div>
      <label
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 38,
          height: 22,
          flexShrink: 0
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: 'absolute',
            cursor: 'pointer',
            inset: 0,
            backgroundColor: checked ? '#7E22CE' : '#CBD5E1',
            transition: '0.2s',
            borderRadius: 22
          }}
        />
        <span
          style={{
            position: 'absolute',
            height: 16,
            width: 16,
            left: checked ? 19 : 3,
            bottom: 3,
            backgroundColor: 'white',
            transition: '0.2s',
            borderRadius: '50%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </label>
    </div>
  )
}

function AddEditStaffDialog({
  title,
  initialName,
  initialRole,
  initialTeam,
  initialPhone,
  initialPasswordPin,
  onDismiss,
  onSubmit
}) {
  const [name, setName] = useState(initialName)
  const [teamName, setTeamName] = useState(initialTeam || 'Field Operations Team')
  const [selectedRole, setSelectedRole] = useState(initialRole || 'Field Operations Team')
  const [phone, setPhone] = useState(formatToIndonesianWhatsApp(initialPhone))
  const [passwordPin, setPasswordPin] = useState(initialPasswordPin || '1234567890')

  const teamsList = [
    'Super Admin',
    'Field Operations Team',
    'IC Service Operation',
    'IC Service Maintenance',
    'Administration Hub',
    'Department Head'
  ]

  const handleTeamSelect = (team) => {
    setTeamName(team)
    if (team === 'Super Admin') setSelectedRole('Super Admin')
    else if (team === 'Field Operations Team') setSelectedRole('Field Operations Team')
    else if (team === 'IC Service Operation') setSelectedRole('IC Service Operation')
    else if (team === 'IC Service Maintenance') setSelectedRole('IC Service Maintenance')
    else if (team === 'Administration Hub') setSelectedRole('Administration Hub')
    else if (team === 'Department Head') setSelectedRole('Department Head')
  }

  const handlePhoneChange = (input) => {
    const clean = input.replace(/-/g, '').replace(/\s+/g, '')
    setPhone(clean)
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onDismiss}
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
          width: 'min(500px, 94vw)',
          background: '#FFFFFF',
          borderRadius: 18,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
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
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{title}</div>
          <button
            type="button"
            onClick={onDismiss}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* User Name */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              User : Team / Staff Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team or staff member name..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none'
              }}
            />
          </div>

          {/* Password PIN (Numbers Only) */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Password PIN (Numbers Only)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={passwordPin}
              onChange={(e) => setPasswordPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g.: 1234567890"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none'
              }}
            />
          </div>

          {/* Select Team / Department Chips */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Select Team / Department:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teamsList.map((team) => {
                const isSelected = teamName === team
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => handleTeamSelect(team)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: isSelected ? '#7E22CE' : '#CBD5E1',
                      background: isSelected ? '#F3E8FF' : '#FFFFFF',
                      color: isSelected ? '#7E22CE' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {team}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Phone Number / WhatsApp (+62) */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Phone Number / WhatsApp (+62)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g.: +6281234567890"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) return
              const cleanPhone = formatToIndonesianWhatsApp(phone)
              onSubmit(name.trim(), selectedRole, teamName, cleanPhone, passwordPin)
            }}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: name.trim() ? '#7E22CE' : '#94A3B8',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: name.trim() ? 'pointer' : 'default',
              boxShadow: name.trim() ? '0 2px 6px rgba(126, 34, 206, 0.25)' : 'none'
            }}
          >
            Save Access Settings
          </button>
        </div>
      </div>
    </div>
  )
}
