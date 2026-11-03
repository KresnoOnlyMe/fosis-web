import React, { useEffect, useState } from 'react'

import Sidebar from './Sidebar'
import TopBar from './TopBar'



export default function AppShell({
  active,
  onNavigate,
  user,
  onLogout,
  // ONLINE STATUS
  online,
  onToggleOnline,
  // HEADER INFO
  pendingSync,
  runningJobs,
  runningJobsList,
  onSelectTicket,
  children
}) {
  const [drawerOpen, setDrawerOpen] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('drawer') === '1'
    } catch {
      return false
    }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {

      return (
        localStorage.getItem(
          'fosis-sidebar-collapsed'
        ) === '1'
      )
    } catch {
      return false

    }

  })

  /*
    SAVE SIDEBAR STATE
  */

  useEffect(() => {
    try {
      localStorage.setItem(

        'fosis-sidebar-collapsed',

        sidebarCollapsed
          ?
          '1'
          :
          '0'

      )
    } catch { }
  }, [sidebarCollapsed])
  return (
    <div

      className={

        `shell ${sidebarCollapsed
          ?
          'sidebar-collapsed'
          :
          ''
        }`

      }

    >


      {/* SIDEBAR DESKTOP */}

      <Sidebar

        active={active}

        onNavigate={onNavigate}

        user={user}

        onLogout={onLogout}

        collapsed={sidebarCollapsed}

      />







      {/* MAIN CONTENT */}

      <main className="main">





        {/* TOPBAR */}

        <TopBar
          active={active}
          onNavigate={onNavigate}
          user={user}
          online={online}
          onToggleOnline={onToggleOnline}
          pendingSync={pendingSync}
          runningJobs={runningJobs}
          runningJobsList={runningJobsList}
          onSelectTicket={onSelectTicket}
          onMenu={() => setDrawerOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        />







        {/* PAGE CONTENT */}

        <div className="content">


          {children}


        </div>






      </main>







      {/* WEB DESKTOP FOCUS: MobileNav components deactivated for pure Web Desktop experience */}
    </div>
  )
}