import React from 'react'
import {
  LayoutGrid,
  Wrench,
  ClipboardCheck,
  FileText,
  Workflow,
  Car,
  MessageSquareText,
} from 'lucide-react'

export function DashboardIcon({ size = 19, className = '' }) {
  return React.createElement(LayoutGrid, { size, className, fill: 'currentColor', strokeWidth: 2 })
}

export function TroubleShootIcon({ size = 19, active = false, className = '' }) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      className,
    },
    React.createElement('path', {
      d: 'M10.268 3.558C11.038 2.224 12.962 2.224 13.732 3.558L21.732 17.417C22.502 18.75 21.54 20.417 20 20.417H4C2.46 20.417 1.498 18.75 2.268 17.417L10.268 3.558Z',
      fill: '#FFFFFF',
    }),
    React.createElement('path', {
      d: 'M12 9V13.5',
      stroke: active ? '#193b76' : '#0b2354',
      strokeWidth: '2.2',
      strokeLinecap: 'round',
    }),
    React.createElement('circle', {
      cx: '12',
      cy: '17',
      r: '1.2',
      fill: active ? '#193b76' : '#0b2354',
    })
  )
}

export function MaintenanceIcon({ size = 19, className = '' }) {
  return React.createElement(Wrench, { size, className, strokeWidth: 2.4, fill: 'currentColor' })
}

export function AdministrationIcon({ size = 19, className = '' }) {
  return React.createElement(FileText, { size, className, strokeWidth: 2.2 })
}

export function VehicleIcon({ size = 19, className = '' }) {
  return React.createElement(Car, { size, className, strokeWidth: 2.2 })
}

export function ChatingIcon({ size = 19, className = '' }) {
  return React.createElement(MessageSquareText, { size, className, strokeWidth: 2.2 })
}

export function TeamAccessIcon({ size = 19, className = '' }) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      className,
    },
    React.createElement('path', {
      d: 'M12 2L4 5V11C4 16.5 7.5 21.5 12 22C16.5 21.5 20 16.5 20 11V5L12 2Z',
      fill: '#FFFFFF',
    }),
    React.createElement('circle', { cx: '12', cy: '9.5', r: '2.2', fill: '#0b2354' }),
    React.createElement('path', {
      d: 'M8.5 16C8.5 14 10 13 12 13C14 13 15.5 14 15.5 16',
      stroke: '#0b2354',
      strokeWidth: '2',
      strokeLinecap: 'round',
    })
  )
}

export function LicensingIcon({ size = 19, className = '' }) {
  return React.createElement(ClipboardCheck, { size, className, strokeWidth: 2.2 })
}

export function WorkflowIcon({ size = 19, className = '' }) {
  return React.createElement(Workflow, { size, className, strokeWidth: 2.2 })
}

export const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    ],
  },
  {
    title: 'OPERATION',
    items: [
      { id: 'troubleshoot', label: 'Troubleshoot', icon: TroubleShootIcon },
      { id: 'maintenance', label: 'Maintenance', icon: MaintenanceIcon },
      { id: 'perijinan', label: 'Work Permit', icon: LicensingIcon },
      { id: 'administrasi', label: 'Administration', icon: AdministrationIcon },
    ],
  },
  {
    title: 'CONTROL',
    items: [
      { id: 'workflow', label: 'Workflow', icon: WorkflowIcon },
      { id: 'kendaraan', label: 'Vehicles', icon: VehicleIcon },
      { id: 'chat', label: 'Field Chat', icon: ChatingIcon },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'users', label: 'Team Access', icon: TeamAccessIcon },
    ],
  },
]

export const NAV_ITEMS = NAV_SECTIONS.flatMap((sec) => sec.items)

export const MOBILE_BOTTOM = NAV_ITEMS.filter((x) =>
  ['troubleshoot', 'maintenance', 'administrasi'].includes(x.id)
)
