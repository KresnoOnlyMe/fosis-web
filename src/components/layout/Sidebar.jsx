import React from 'react'
import { LogOut } from 'lucide-react'
import { NAV_SECTIONS } from '../../constants/navigation'
import { canViewModule } from '../../utils/permissions'

export default function Sidebar({ active, onNavigate, user, onLogout, collapsed = false }) {
  const initials = user?.initials || (user?.name ? user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'SI')
  const userName = user?.name || 'Sanderlina Imelda'
  const userRole = user?.role || (userName === 'Sanderlina Imelda' ? 'Super Admin' : 'Staff')

  return (
    <aside className={`sidebar ops-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-wrap">
          <div className="brand-avatar-box">{initials}</div>
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-title">FIELD OPERATIONS</div>
              <div className="brand-subtitle">{userName} • {userRole}</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav-grouped">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => {
              return canViewModule(user, item.id)
            })

            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="sidebar-section">
                {!collapsed && (
                  <div className="sidebar-section-title">{section.title}</div>
                )}
                <div className="sidebar-section-items">
                  {visibleItems.map(({ id, label, icon: Icon }) => {
                    const isActive = active === id
                    return (
                      <button
                        key={id}
                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onNavigate(id)}
                        title={collapsed ? label : undefined}
                      >
                        <Icon size={19} className="nav-icon" active={isActive} />
                        {!collapsed && <span>{label}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-profile-card">
          <div className="avatar profile-avatar">{initials}</div>
          {!collapsed && (
            <div className="profile-info">
              <div className="profile-name">{userName}</div>
              <div className="profile-role">{userRole}</div>
            </div>
          )}
          <button
            className="icon-btn profile-logout"
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
