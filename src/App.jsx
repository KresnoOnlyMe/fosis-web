import React, { useMemo, useState, useEffect } from 'react'

import AppShell from './components/layout/AppShell'
import LoginPage from './screens/LoginPage'
import DashboardPage from './screens/DashboardPage'
import OperationsListPage from './screens/OperationsListPage'
import AdminPage from './screens/AdminPage'
import PermitPage from './screens/PermitPage'
import WorkflowPage from './screens/WorkflowPage'
import VehiclePage from './screens/VehiclePage'
import ChatPage from './screens/ChatPage'
import UserManagementPage from './screens/UserManagementPage'
import ExecutiveOverview from './components/dashboard/ExecutiveOverview'
import EngineerKPIDashboard from './components/dashboard/EngineerKPIDashboard'

import TicketDialog from './components/dialogs/TicketDialog'
import AddTicketDialog from './components/dialogs/AddTicketDialog'
import ConfirmDialog from './components/dialogs/ConfirmDialog'
import ErrorBoundary from './components/ui/ErrorBoundary'

import { FosisProvider, useFosis } from './context/FosisContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { canViewModule, canEditTicket, canCreateTicket, getVisibleTickets } from './utils/permissions'

function FosisApp() {
  const {
    activeUser,
    isAuthenticated,
    online,
    setOnline,
    logout,
    setActiveUser,
    tickets,
    permits,
    vehicleLogs,
    chatMessages,
    users,
    addTicket,
    updateTicket,
    deleteTicket,
    submitByTechnician,
    verifyByIC,
    lockByAdmin,
    unlockByAdmin,
    approveByDeptHead,
    addPermit,
    deletePermit,
    approvePermit,
    importPermits,
    addVehicleLog,
    updateVehicleLog,
    deleteVehicleLog,
    addUser,
    updateUser,
    deleteUser
  } = useFosis()

  const { success, info, warning } = useToast()

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('tab') || 'dashboard'
    } catch {
      return 'dashboard'
    }
  })

  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const [ticketToDelete, setTicketToDelete] = useState(null)

  const [addState, setAddState] = useState({
    open: false,
    mode: 'create',
    type: 'TROUBLESHOOT',
    ticketData: null,
    startWithTypePicker: false
  })

  // Synchronize URL tab parameter for bookmarkability
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', activeTab)
      window.history.replaceState({}, '', url.toString())
    } catch { }
  }, [activeTab])

  // Central active selected ticket with robust String casting and clean matching
  const selectedTicket = useMemo(() => {
    if (selectedTicketId === null || selectedTicketId === undefined) return null
    const targetStr = String(selectedTicketId).trim().toLowerCase()
    const cleanTargetStr = targetStr.replace(/^[\[\({\s]+|[\]\)}\s]+$/g, '')

    return (
      tickets.find((t) => {
        if (!t) return false
        const idStr = String(t.id).trim().toLowerCase()
        const ticketNoStr = String(t.ticketNo || '').trim().toLowerCase()
        const cleanTicketNoStr = ticketNoStr.replace(/^[\[\({\s]+|[\]\)}\s]+$/g, '')

        return (
          idStr === targetStr ||
          ticketNoStr === targetStr ||
          (cleanTargetStr && cleanTicketNoStr === cleanTargetStr)
        )
      }) || null
    )
  }, [selectedTicketId, tickets])

  // Running Jobs: active operational tasks per role & SRS that are not locked
  const runningJobsList = useMemo(() => {
    if (!activeUser) return []
    const visible = getVisibleTickets(activeUser, tickets)
    return visible.filter(
      (x) =>
        !x.locked &&
        x.workflowStatus !== 'Disahkan Admin Hub' &&
        x.workflowStatus !== 'Approved by Admin Hub' &&
        x.workflowStatus !== 'Disahkan Dept. Head' &&
        x.workflowStatus !== 'Approved by Dept. Head' &&
        x.workflowStatus !== 'DONE'
    )
  }, [activeUser, tickets])

  const runningJobs = runningJobsList.length

  if (!isAuthenticated || !activeUser) {
    return (
      <LoginPage
        users={users}
        onLoginSuccess={(user) => {
          setActiveUser(user)
          success(`Welcome back, ${user.name}! Session started successfully.`)
        }}
      />
    )
  }

  const openAdd = (type, startWithTypePicker = false) => {
    if (!canCreateTicket(activeUser, type)) {
      warning(`You do not have permission to create ${type} tickets.`)
      return
    }
    setAddState({
      open: true,
      mode: 'create',
      type,
      ticketData: null,
      startWithTypePicker
    })
  }

  const openEdit = (ticket) => {
    if (!canEditTicket(activeUser, ticket)) {
      warning('You do not have permission to edit this ticket.')
      return
    }
    setAddState({
      open: true,
      mode: 'edit',
      type: ticket.type || 'TROUBLESHOOT',
      ticketData: ticket,
      startWithTypePicker: false
    })
  }

  const handleConfirmDeleteTicket = () => {
    if (!ticketToDelete) return
    const targetNo = ticketToDelete.ticketNo || ticketToDelete.id
    const res = deleteTicket(ticketToDelete.id)
    if (res && res.success === false) {
      warning(res.message || 'Failed to delete ticket.')
    } else {
      success(`Ticket ${targetNo} removed successfully.`)
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null)
      }
    }
    setTicketToDelete(null)
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutConfirm(false)
    setActiveTab('dashboard')
    info('Your session has ended safely.')
  }

  let pageContent = null

  switch (activeTab) {
    case 'troubleshoot':
      pageContent = (
        <OperationsListPage
          type="TROUBLESHOOT"
          tickets={tickets.filter((x) => x.type === 'TROUBLESHOOT')}
          onSelect={(t) => setSelectedTicketId(t.id)}
          onEdit={(t) => openEdit(t)}
          onAdd={() => openAdd('TROUBLESHOOT')}
        />
      )
      break

    case 'maintenance':
      pageContent = (
        <OperationsListPage
          type="MAINTENANCE"
          tickets={tickets.filter((x) => x.type === 'MAINTENANCE')}
          onSelect={(t) => setSelectedTicketId(t.id)}
          onEdit={(t) => openEdit(t)}
          onAdd={() => openAdd('MAINTENANCE')}
        />
      )
      break

    case 'administrasi':
      if (!canViewModule(activeUser, 'administrasi')) {
        pageContent = (
          <div className="page" style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
            <h3 style={{ color: '#0F172A', marginBottom: 8 }}>Access Restricted</h3>
            <p style={{ fontSize: 13 }}>You do not have permission to access the Administration module.</p>
          </div>
        )
      } else {
        pageContent = (
          <AdminPage
            tickets={tickets}
            onAdd={() => openAdd('ADMINISTRASI', false)}
            onSelect={(t) => setSelectedTicketId(t.id)}
            onEdit={(t) => openEdit(t)}
          />
        )
      }
      break

    case 'perijinan':
      pageContent = (
        <PermitPage
          permits={permits}
          activeUser={activeUser}
          onApprovePermit={(permit, actionOrApproved, reason) => {
            if (actionOrApproved === 'SUBMIT') {
              // submit permit
              approvePermit(permit.id, 'SUBMIT')
              info(`Work Permit ${permit.permitNo} submitted for approval.`)
            } else if (actionOrApproved === true) {
              const res = approvePermit(permit.id, true)
              if (res && res.success === false) {
                warning(res.message)
              } else {
                success(`Work Permit ${permit.permitNo} approved!`)
              }
            } else {
              const res = approvePermit(permit.id, false, reason)
              if (res && res.success === false) {
                warning(res.message)
              } else {
                warning(`Work Permit ${permit.permitNo} rejected. Reason: ${reason || '-'}`)
              }
            }
          }}
          onCreatePermit={(newPermit) => {
            addPermit(newPermit)
            success(`Work Permit ${newPermit.permitNo} registered successfully.`)
          }}
          onDeletePermit={(permit) => {
            deletePermit(permit)
            info(`Work Permit ${permit.permitNo} deleted.`)
          }}
          onImportPermits={(batch) => {
            importPermits(batch)
            success(`Batch work permits import completed!`)
          }}
        />
      )
      break

    case 'workflow':
      pageContent = (
        <WorkflowPage
          tickets={tickets}
          activeUser={activeUser}
          onSelectItem={(t) => setSelectedTicketId(t.id)}
          onEditItem={(item) => openEdit(item)}
          onSubmitTeknisi={(item) => {
            submitByTechnician(item.id)
            success(`Ticket ${item.ticketNo} submitted to IC Team!`)
          }}
          onVerifyLeader={(item) => {
            verifyByIC(item.id)
            success(`Ticket ${item.ticketNo} verified by IC Team!`)
          }}
          onToggleLockAdmin={(item) => {
            if (item.locked) {
              unlockByAdmin(item.id)
              info(`Ticket ${item.ticketNo} unlocked by Admin.`)
            } else {
              lockByAdmin(item.id)
              success(`Ticket ${item.ticketNo} integrity locked by Admin!`)
            }
          }}
          onApproveDeptHead={(item, note) => {
            approveByDeptHead(item.id, note)
            success(`Ticket ${item.ticketNo} authorized by Department Head!`)
          }}
        />
      )
      break

    case 'kendaraan':
      pageContent = (
        <VehiclePage
          logs={vehicleLogs}
          setLogs={(updater) => {
            if (typeof updater === 'function') {
              const nextList = updater(vehicleLogs)
              if (nextList.length > vehicleLogs.length) {
                addVehicleLog(nextList[0])
                success('New fleet dispatch log recorded!')
              } else if (nextList.length < vehicleLogs.length) {
                const deleted = vehicleLogs.find((v) => !nextList.some((n) => n.id === v.id))
                if (deleted) {
                  deleteVehicleLog(deleted)
                  info(`Vehicle log ${deleted.platKendaraan} removed.`)
                }
              } else {
                const updated = nextList.find((n) => {
                  const orig = vehicleLogs.find((v) => v.id === n.id)
                  return orig && JSON.stringify(orig) !== JSON.stringify(n)
                })
                if (updated) {
                  updateVehicleLog(updated)
                  success(`Vehicle log ${updated.platKendaraan} updated!`)
                }
              }
            }
          }}
          activeUser={activeUser}
        />
      )
      break

    case 'chat':
      pageContent = (
        <ChatPage
          messages={chatMessages}
          online={online}
          activeUser={activeUser}
          items={tickets}
          permits={permits}
          onSelectItem={(item) => setSelectedTicketId(item.id)}
        />
      )
      break

    case 'users':
      pageContent = (
        <UserManagementPage
          users={users}
          activeUser={activeUser}
          onUpdateUser={(updated) => {
            updateUser(updated)
            success(`Staff profile ${updated.name} updated successfully!`)
          }}
          onAddUser={(name, role, teamName, phone, passwordPin) => {
            addUser(name, role, teamName, phone, passwordPin)
            success(`Staff member ${name} (${role}) registered successfully!`)
          }}
          onDeleteUser={(target) => {
            deleteUser(target)
            info(`Staff member ${target.name} has been deactivated.`)
          }}
        />
      )
      break

    case 'executive':
      pageContent = (
        <div className="page" style={{ padding: 20 }}>
          <ExecutiveOverview tickets={tickets} onNavigate={setActiveTab} />
        </div>
      )
      break

    case 'engineer-kpi':
      pageContent = (
        <div className="page" style={{ padding: 20 }}>
          <EngineerKPIDashboard
            tickets={tickets}
            users={users}
            onSelectTicket={(target) => {
              if (!target) return
              const idVal = typeof target === 'object' ? (target.id ?? target.ticketNo) : target
              setSelectedTicketId(idVal)
            }}
          />
        </div>
      )
      break

    case 'dashboard':
    default:
      pageContent = (
        <DashboardPage
          tickets={tickets}
          onNavigate={setActiveTab}
          onSelectTicket={(target) => {
            if (!target) return
            const idVal = typeof target === 'object' ? (target.id ?? target.ticketNo) : target
            setSelectedTicketId(idVal)
          }}
          onAdd={() => openAdd('TROUBLESHOOT')}
        />
      )
      break
  }

  return (
    <div className="app">
      <AppShell
        active={activeTab}
        onNavigate={setActiveTab}
        user={activeUser}
        onLogout={() => setShowLogoutConfirm(true)}
        online={online}
        onToggleOnline={() => setOnline(!online)}
        pendingSync={online ? 0 : 3}
        runningJobs={runningJobs}
        runningJobsList={runningJobsList}
        onSelectTicket={(target) => {
          if (!target) return
          const idVal = typeof target === 'object' ? (target.id ?? target.ticketNo) : target
          setSelectedTicketId(idVal)
        }}
      >
        {pageContent}
      </AppShell>

      {/* 2-Column Desktop Ticket Detail Dialog with Error Boundary */}
      {selectedTicketId !== null && selectedTicketId !== undefined && (
        <ErrorBoundary onReset={() => setSelectedTicketId(null)}>
          <TicketDialog
            item={selectedTicket}
            activeUser={activeUser}
            onClose={() => setSelectedTicketId(null)}
            onDismiss={() => setSelectedTicketId(null)}
            onEditTicket={(t) => openEdit(t)}
            onDeleteTicket={(t) => setTicketToDelete(t)}
            onSubmitTeknisi={(item) => {
              submitByTechnician(item.id)
              success(`Ticket ${item.ticketNo} submitted to IC Team!`)
            }}
            onVerifyLeader={(item) => {
              verifyByIC(item.id)
              success(`Ticket ${item.ticketNo} verified by IC Team!`)
            }}
            onToggleLockAdmin={(item) => {
              if (item.locked) {
                unlockByAdmin(item.id)
                info(`Ticket ${item.ticketNo} integrity unlocked.`)
              } else {
                lockByAdmin(item.id)
                success(`Ticket ${item.ticketNo} integrity locked!`)
              }
            }}
            onApproveDeptHead={(item, comment) => {
              approveByDeptHead(item.id, comment)
              success(`Ticket ${item.ticketNo} authorized by Department Head!`)
            }}
            onExportPdf={(item) => {
              info(`PDF document for ticket ${item.ticketNo} downloaded.`)
            }}
          />
        </ErrorBoundary>
      )}

      {/* Create / Edit Ticket Modal */}
      <AddTicketDialog
        open={addState.open}
        mode={addState.mode || 'create'}
        initialType={addState.type}
        ticketData={addState.ticketData}
        startWithTypePicker={!!addState.startWithTypePicker}
        onClose={() => setAddState((v) => ({ ...v, open: false }))}
        onSubmit={(ticketFormData) => {
          if (addState.mode === 'edit' && addState.ticketData) {
            const res = updateTicket(addState.ticketData.id, ticketFormData)
            if (res && res.success === false) {
              warning(res.message || 'Failed to update ticket.')
              return res
            } else {
              const updatedNo = res?.ticket?.ticketNo || addState.ticketData.ticketNo
              success(`Ticket ${updatedNo} updated successfully!`)
              setAddState((v) => ({ ...v, open: false }))
              return res
            }
          } else {
            const res = addTicket(ticketFormData)
            if (res && res.success === false) {
              warning(res.message || 'Failed to create ticket.')
              return res
            } else {
              const createdNo = res?.ticket?.ticketNo || ticketFormData.type
              success(`Ticket ${createdNo} created successfully!`)
              setAddState((v) => ({ ...v, open: false }))
              return res
            }
          }
        }}
      />

      {/* Delete Ticket Confirmation */}
      <ConfirmDialog
        isOpen={!!ticketToDelete}
        title="Delete Operational Ticket"
        message={`Are you sure you want to delete ticket ${ticketToDelete?.ticketNo || ''}? This action cannot be undone.`}
        confirmText="Delete Ticket"
        confirmTone="danger"
        onConfirm={handleConfirmDeleteTicket}
        onCancel={() => setTicketToDelete(null)}
      />

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Session Sign Out"
        message={`Hello ${activeUser.name}, are you sure you want to log out of FOSIS Web Ops?`}
        confirmText="Yes, Sign Out"
        confirmTone="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary title="An Error Occurred While Loading Page">
      <ToastProvider>
        <FosisProvider>
          <FosisApp />
        </FosisProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}