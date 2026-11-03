import React from 'react'
import { X } from 'lucide-react'
import { NAV_SECTIONS, MOBILE_BOTTOM } from '../../constants/navigation'
import { canViewModule } from '../../utils/permissions'

export function MobileDrawer({ open, onClose, active, onNavigate, user }) {
  const initials = user?.initials || (user?.name ? user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'SI')
  const userName = user?.name || 'Sanderlina Imelda'
  const userRole = user?.role || (userName === 'Sanderlina Imelda' ? 'Super Admin' : 'Staff')

  return (
    <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="drawer ops-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-avatar">{initials}</div>
          <div className="drawer-header-text">
            <div className="drawer-header-title">FIELD OPERATIONS</div>
            <div className="drawer-header-subtitle">
              {userName} • {userRole}
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="drawer-nav">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => canViewModule(user, item.id))
            if (visibleItems.length === 0) return null
            return (
              <div key={section.title} className="drawer-section">
                <div className="drawer-section-title">{section.title}</div>
                <div className="drawer-section-items">
                  {visibleItems.map(({ id, label, icon: Icon }) => {
                    const isActive = active === id
                    return (
                      <button
                        key={id}
                        className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          onNavigate(id)
                          onClose()
                        }}
                      >
                        <Icon size={19} className="drawer-nav-icon" active={isActive} />
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function MobileBottom({ active, onNavigate }) {
  return (
    <nav className="mobile-bottom">
      {MOBILE_BOTTOM.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={active === id ? 'active' : ''}
          onClick={() => onNavigate(id)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
