import React, { useMemo, useState } from 'react'
import {
  Car,
  Bike,
  Plus,
  Search,
  MapPin,
  ExternalLink,
  Table,
  LayoutGrid,
  Map as MapIcon,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  ChevronDown,
  Navigation,
  Edit,
  Trash2,
  RefreshCw,
  PlayCircle,
  X,
  Save,
  Check,
  Building2,
  RotateCcw,
  ShieldCheck,
  FileCheck,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  normalizeRole,
  ROLES,
  canBorrowVehicle,
  canEditVehicle,
  canDeleteVehicle,
  canReturnOwnVehicle,
  canRecordVehicleReturnForTechnician,
  canVerifyVehicleReturn,
  isVehicleBorrower,
  isAuthorizedSuperAdmin,
  normalizeVehicleStatus,
  getVehicleStatusBadge
} from '../utils/permissions'

// Default Menara Kadin Basecamp coordinates
const KADIN_LAT = -6.2322
const KADIN_LNG = 106.8317

// Create Custom Pins for Leaflet Map
const kadinIcon = L.divIcon({
  className: '',
  html: `<div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); border: 2.5px solid #facc15; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">🏢</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

const getVehicleIcon = (isMotor) => {
  const bg = isMotor ? 'linear-gradient(135deg, #7e22ce, #6b21a8)' : 'linear-gradient(135deg, #0284c7, #0369a1)'
  const emoji = isMotor ? '🛵' : '🚗'
  return L.divIcon({
    className: '',
    html: `<div style="background: ${bg}; border: 2px solid #ffffff; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  })
}

// Controller to fly to targeted vehicle on map
function MapCenterController({ center, zoom }) {
  const map = useMap()
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1 })
    }
  }, [center, zoom, map])
  return null
}

export default function VehiclePage({ logs = [], setLogs, activeUser }) {
  // View Modes: SPREADSHEET_TABLE, CARD_LIST, MAP_SPLIT_VIEW
  const [viewMode, setViewMode] = useState('SPREADSHEET_TABLE')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showStats, setShowStats] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Dialog States
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [returnTarget, setReturnTarget] = useState(null)
  const [accTarget, setAccTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [ignoreTarget, setIgnoreTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [liveMapTarget, setLiveMapTarget] = useState(null)
  const [mapStyle, setMapStyle] = useState('real') // 'real' = Google Maps, 'vektor' = OSM

  // Permission flags for activeUser
  const isSuperAdminUser = isAuthorizedSuperAdmin(activeUser)
  const canBorrow = canBorrowVehicle(activeUser)
  const canEdit = canEditVehicle(activeUser)
  const canDelete = canDeleteVehicle(activeUser)

  // Helper date parser
  const parseDateParts = (dateStr = '') => {
    const clean = dateStr.replace(/-/g, '/').trim()
    const parts = clean.split('/')
    const day = parseInt(parts[0], 10) || 1
    const month = parts[1] || '09'
    return { day, month }
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !searchQuery ||
        (log.platKendaraan || '').toLowerCase().includes(q) ||
        (log.ticket || '').toLowerCase().includes(q) ||
        (log.pic || '').toLowerCase().includes(q) ||
        (log.team || '').toLowerCase().includes(q) ||
        (log.ketDestination || '').toLowerCase().includes(q) ||
        (log.typeKendaraan || '').toLowerCase().includes(q) ||
        (log.tanggal || '').toLowerCase().includes(q)

      const { day, month } = parseDateParts(log.tanggal)
      const isThisWeek = month === '09' && day >= 8 && day <= 14
      const isThisMonth = month === '09'

      const normalizedStatus = normalizeVehicleStatus(log.statusArmada)

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DIPINJAM' && normalizedStatus === 'DIPINJAM') ||
        (statusFilter === 'MENUNGGU_ACC' && normalizedStatus === 'MENUNGGU_ACC_KEMBALI') ||
        (statusFilter === 'SELESAI' && normalizedStatus === 'SELESAI') ||
        (statusFilter === 'PERLU_PERBAIKAN' && normalizedStatus === 'PERLU_PERBAIKAN_KEMBALI') ||
        (statusFilter === 'DIABAIKAN' && normalizedStatus === 'DIABAIKAN')

      const matchCat =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'MOBIL' && !log.isMotor) ||
        (categoryFilter === 'MOTOR' && log.isMotor) ||
        (categoryFilter === 'SO' && (log.team || '').toUpperCase() === 'SO') ||
        (categoryFilter === 'SM' && (log.team || '').toUpperCase() === 'SM') ||
        (categoryFilter === 'THIS_WEEK' && isThisWeek) ||
        (categoryFilter === 'THIS_MONTH' && isThisMonth)

      return matchSearch && matchStatus && matchCat
    })
  }, [logs, searchQuery, statusFilter, categoryFilter])

  // Statistics
  const stats = useMemo(() => {
    const mobil = logs.filter((l) => !l.isMotor)
    const motor = logs.filter((l) => l.isMotor)
    const dipinjam = logs.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'DIPINJAM').length
    const acc = logs.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'MENUNGGU_ACC_KEMBALI').length
    const selesai = logs.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'SELESAI').length
    const perluPerbaikan = logs.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'PERLU_PERBAIKAN_KEMBALI').length
    const diabaikan = logs.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'DIABAIKAN').length
    const so = logs.filter((l) => (l.team || '').toUpperCase() === 'SO').length
    const sm = logs.filter((l) => (l.team || '').toUpperCase() === 'SM').length
    return {
      total: logs.length,
      mobil: mobil.length,
      mobilDispatched: mobil.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'DIPINJAM').length,
      mobilAcc: mobil.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'MENUNGGU_ACC_KEMBALI').length,
      mobilCompleted: mobil.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'SELESAI').length,
      motor: motor.length,
      motorDispatched: motor.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'DIPINJAM').length,
      motorAcc: motor.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'MENUNGGU_ACC_KEMBALI').length,
      motorCompleted: motor.filter((l) => normalizeVehicleStatus(l.statusArmada) === 'SELESAI').length,
      dipinjam,
      acc,
      selesai,
      perluPerbaikan,
      diabaikan,
      so,
      sm
    }
  }, [logs])

  // Actions
  const handleAddLog = (newLog) => {
    if (!canBorrowVehicle(activeUser)) {
      alert('Access Denied: Your role is not authorized to borrow vehicles.')
      return
    }
    setLogs?.((prev) => [newLog, ...prev])
    setShowAddDialog(false)
  }

  const handleReturnSubmit = (updated) => {
    setLogs?.((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setReturnTarget(null)
  }

  const handleAccSubmit = (updated) => {
    if (!canVerifyVehicleReturn(activeUser, updated)) {
      alert('Access Denied: Only IC Team Leader or Super Admin is authorized to verify returns.')
      return
    }
    setLogs?.((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setAccTarget(null)
  }

  const handleRejectSubmit = (updated) => {
    if (!canVerifyVehicleReturn(activeUser, updated)) {
      alert('Access Denied: Only IC Team Leader or Super Admin is authorized to reject returns.')
      return
    }
    setLogs?.((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setRejectTarget(null)
  }

  const handleIgnoreSubmit = (updated) => {
    if (!canVerifyVehicleReturn(activeUser, updated)) {
      alert('Access Denied: Only IC Team Leader or Super Admin is authorized to dismiss returns.')
      return
    }
    setLogs?.((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setIgnoreTarget(null)
  }

  const handleEditSubmit = (updated) => {
    if (!canEditVehicle(activeUser)) {
      alert('Access Denied: Only Super Admin is authorized to edit vehicle logs.')
      return
    }
    setLogs?.((prev) => prev.map((l) => (l.id === updated.id ? { ...updated, _actionType: 'EDIT' } : l)))
    setEditTarget(null)
  }

  const handleDelete = (id) => {
    if (!canDeleteVehicle(activeUser)) {
      alert('Access Denied: Only Super Admin is authorized to delete vehicle logs.')
      return
    }
    setLogs?.((prev) => prev.filter((l) => l.id !== id))
    setDeleteTarget(null)
  }

  return (
    <div className="page vehicle-page-container" style={{ gap: 10 }}>
      {/* 1. TOP BRAND BANNER */}
      <div
        style={{
          background: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          borderRadius: 14,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#2563EB',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Car size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1E3A8A', letterSpacing: '-0.2px' }}>
                  Fleet Operational Logbook
                </h1>
                <span
                  style={{
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 5
                  }}
                >
                  {logs.length}
                </span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={13} />
                <span>🏢 Menara Kadin Indonesia (Fleet Operations Basecamp)</span>
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              style={{
                background: showStats ? '#2563EB' : '#DBEAFE',
                color: showStats ? '#ffffff' : '#1E40AF',
                border: 0,
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <BarChart3 size={13} />
              <span>{showStats ? 'Hide Statistics' : 'Statistics'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                const newSim = {
                  id: `veh-${Date.now()}`,
                  tanggal: '10/09/2026',
                  pic: 'Fadli & Kurniawan (Simulasi)',
                  team: 'SO',
                  timeOut: nowTime,
                  timeIn: '-',
                  tanggalKembali: '-',
                  ticket: 'E/SIMULASI/0911',
                  platKendaraan: 'B 9999 FOS',
                  typeKendaraan: 'Grandmax',
                  ketDestination: 'Cyber 1 (Mampang)',
                  odometerOut: '34,120 KM',
                  odometerIn: '-',
                  fuelLevel: 'Full (90%)',
                  fuelLevelIn: '-',
                  statusArmada: 'DIPINJAM',
                  catatanPinjam: 'Simulasi rute armada lapangan real-time',
                  catatanKembali: '-',
                  accBy: '-',
                  accRole: '-',
                  accTime: '-',
                  accNotes: '-',
                  latitude: -6.2383,
                  longitude: 106.821,
                  isMotor: false
                }
                handleAddLog(newSim)
                setViewMode('MAP_SPLIT_VIEW')
              }}
              style={{
                background: '#F3E8FF',
                color: '#7E22CE',
                border: '1px solid #E9D5FF',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <PlayCircle size={13} />
              <span>Simulasi Cepat</span>
            </button>
          </div>
        </div>

        {/* Collapsible Stats Row */}
        {showStats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 10,
              paddingTop: 8,
              borderTop: '1px solid #DBEAFE'
            }}
          >
            {/* Box Mobil */}
            <div
              onClick={() => setCategoryFilter('MOBIL')}
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0369A1' }}>🚗 ARMADA MOBIL</span>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#E0F2FE', color: '#0284C7', padding: '2px 6px', borderRadius: 4 }}>
                  {stats.mobil} Unit
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#0C4A6E', marginTop: 4 }}>
                {stats.mobil} Pemakaian
              </div>
              <div style={{ fontSize: 9.5, color: '#0284C7', marginTop: 2 }}>Grandmax, Avanza, Luxio • SO & SM</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9.5, fontWeight: 700 }}>
                <span style={{ color: '#0284C7' }}>Pinjam: {stats.mobilDispatched}</span>
                <span style={{ color: '#D97706' }}>ACC: {stats.mobilAcc}</span>
                <span style={{ color: '#16A34A' }}>Completed: {stats.mobilCompleted}</span>
              </div>
            </div>

            {/* Box Motor */}
            <div
              onClick={() => setCategoryFilter('MOTOR')}
              style={{
                background: '#FAF5FF',
                border: '1px solid #E9D5FF',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#6B21A8' }}>🛵 SEPEDA MOTOR</span>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#F3E8FF', color: '#7E22CE', padding: '2px 6px', borderRadius: 4 }}>
                  {stats.motor} Unit
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#581C87', marginTop: 4 }}>
                {stats.motor} Pemakaian
              </div>
              <div style={{ fontSize: 9.5, color: '#7E22CE', marginTop: 2 }}>LEXY, NMAX, Vario • SO & SM</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9.5, fontWeight: 700 }}>
                <span style={{ color: '#7E22CE' }}>Pinjam: {stats.motorDispatched}</span>
                <span style={{ color: '#D97706' }}>ACC: {stats.motorAcc}</span>
                <span style={{ color: '#16A34A' }}>Completed: {stats.motorCompleted}</span>
              </div>
            </div>

            {/* Box Status Operasional */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>
                STATUS OPERASIONAL & ACC
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>🚘 Dispatched:</span>
                  <b>{stats.dipinjam} Unit</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>⏳ Pending IC Approval:</span>
                  <b style={{ color: '#D97706' }}>{stats.acc} Form</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>✅ Completed (Di-ACC):</span>
                  <b style={{ color: '#16A34A' }}>{stats.selesai} Unit</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. VIEW MODE SEGMENTED SWITCHER (Tabel Matriks | Berkas Kartu | Peta GPS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            background: '#ffffff',
            border: '1.5px solid #CBD5E1',
            borderRadius: 12,
            padding: 3,
            gap: 4
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('SPREADSHEET_TABLE')}
            style={{
              border: 0,
              borderRadius: 9,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: viewMode === 'SPREADSHEET_TABLE' ? '#2563EB' : 'transparent',
              color: viewMode === 'SPREADSHEET_TABLE' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <Table size={14} />
            <span>Tabel Matriks (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('CARD_LIST')}
            style={{
              border: 0,
              borderRadius: 9,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: viewMode === 'CARD_LIST' ? '#2563EB' : 'transparent',
              color: viewMode === 'CARD_LIST' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={14} />
            <span>Format Kartu Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('MAP_SPLIT_VIEW')}
            style={{
              border: 0,
              borderRadius: 9,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: viewMode === 'MAP_SPLIT_VIEW' ? '#2563EB' : 'transparent',
              color: viewMode === 'MAP_SPLIT_VIEW' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <MapIcon size={14} />
            <span>Google Maps Real & Radar</span>
          </button>
        </div>

        {/* Action Tambah Peminjaman - Hidden for Dept Head (Strict Read-Only) */}
        {canBorrow && (
          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            style={{
              background: '#16A34A',
              color: '#ffffff',
              border: 0,
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
            }}
          >
            <Plus size={15} />
            <span>New Vehicle Dispatch</span>
          </button>
        )}
      </div>

      {/* 3. SEARCH & FILTER CHIP BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #CBD5E1',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, PIC, ticket, vehicle type, destination..."
              style={{ fontSize: 12.5 }}
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="icon-btn"
              style={{ flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips Horizontal Row */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B', whiteSpace: 'nowrap' }}>Status:</span>
          {[
            { id: 'ALL', label: 'All Statuses' },
            { id: 'DIPINJAM', label: 'Dispatched' },
            { id: 'MENUNGGU_ACC', label: 'Pending IC Approval' },
            { id: 'SELESAI', label: 'Completed' },
            { id: 'PERLU_PERBAIKAN', label: 'Needs Rectification' },
            { id: 'DIABAIKAN', label: 'Dismissed' }
          ].map((st) => {
            const active = statusFilter === st.id
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                style={{
                  border: active ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                  background: active ? '#2563EB' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  borderRadius: 20,
                  padding: '5px 11px',
                  fontSize: 10.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {st.label}
              </button>
            )
          })}

          <div style={{ width: 1, height: 16, background: '#CBD5E1', margin: '0 4px', flexShrink: 0 }} />

          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B', whiteSpace: 'nowrap' }}>Fleet:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'MOBIL', label: '🚗 Car' },
            { id: 'MOTOR', label: '🛵 Motorcycle' },
            { id: 'SO', label: 'Team SO' },
            { id: 'SM', label: 'Team SM' },
            { id: 'THIS_WEEK', label: '📅 This Week' }
          ].map((cat) => {
            const active = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  border: active ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                  background: active ? '#0284C7' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  borderRadius: 20,
                  padding: '5px 11px',
                  fontSize: 10.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. MAIN CONTENT CONTAINER */}
      <div style={{ flex: 1, minHeight: 460 }}>
        {/* VIEW 1: SPREADSHEET TABLE */}
        {viewMode === 'SPREADSHEET_TABLE' && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Table Top Header Bar */}
            <div
              style={{
                background: '#0F172A',
                color: '#ffffff',
                padding: '9px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
                <Table size={15} color="#38BDF8" />
                <span>TABEL MATRIKS ({filteredLogs.length} Record)</span>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Geser kanan untuk melihat kolom lengkap ➔</span>
            </div>

            {/* Table Scrollable Container */}
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table style={{ minWidth: 1280 }}>
                <thead>
                  <tr style={{ background: '#E2E8F0', borderBottom: '1.5px solid #CBD5E1' }}>
                    <th style={{ width: 45, textAlign: 'center' }}>No</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Tanggal</th>
                    <th style={{ width: 130 }}>PIC</th>
                    <th style={{ width: 65, textAlign: 'center' }}>Team</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Time Out</th>
                    <th style={{ width: 130, textAlign: 'center' }}>Ticket</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Plat</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Type</th>
                    <th style={{ width: 150 }}>Ket. Destination</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Time In</th>
                    <th style={{ width: 120 }}>Odometer & Fuel Level</th>
                    <th style={{ width: 170, textAlign: 'center' }}>Status & ACC IC</th>
                    <th style={{ width: 140, textAlign: 'center' }}>Aksi & GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: '36px 0', color: '#64748B' }}>
                        No vehicle logs match the search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={log.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ textAlign: 'center', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#1E293B' }}>{log.tanggal}</td>
                        <td>
                          <b>{log.pic}</b>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: (log.team || '').toUpperCase() === 'SO' ? '#DCFCE7' : '#FEF3C7',
                              color: (log.team || '').toUpperCase() === 'SO' ? '#166534' : '#92400E',
                              padding: '2px 7px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 900
                            }}
                          >
                            {log.team}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 700 }}>
                            {log.timeOut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: (log.ticket || '').startsWith('E/') ? '#FEE2E2' : '#E0F2FE',
                              color: (log.ticket || '').startsWith('E/') ? '#991B1B' : '#075985',
                              padding: '2px 7px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800
                            }}
                          >
                            {log.ticket}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#0F172A', color: '#FCD34D', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 900 }}>
                            {log.platKendaraan}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: log.isMotor ? '#7E22CE' : '#1D4ED8' }}>
                            {log.isMotor ? '🛵 ' : '🚗 '}
                            {log.typeKendaraan}
                          </span>
                        </td>
                        <td>{log.ketDestination}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: log.timeIn !== '-' ? '#15803D' : '#94A3B8', fontWeight: 700 }}>
                            {log.timeIn}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>Odo: {log.odometerOut}</div>
                          <div style={{ fontSize: 9.5, color: '#64748B' }}>Fuel Level: {log.fuelLevel}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {(() => {
                            const status = normalizeVehicleStatus(log.statusArmada)
                            const badge = getVehicleStatusBadge(status)
                            const isOriginalBorrower = isVehicleBorrower(activeUser, log)
                            const canICAct = canRecordVehicleReturnForTechnician(activeUser, log) || canVerifyVehicleReturn(activeUser, log)
                            const isDeptHead = normalizeRole(activeUser?.role) === ROLES.DEPT_HEAD

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span
                                  style={{
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {status === 'SELESAI' && <CheckCircle size={11} color="#16A34A" />}
                                  {badge.label}
                                </span>

                                {/* 1. STATUS: DIPINJAM */}
                                {status === 'DIPINJAM' && !isDeptHead && (
                                  <>
                                    {isOriginalBorrower && (
                                      <button
                                        type="button"
                                        onClick={() => setReturnTarget(log)}
                                        style={{
                                          background: '#2563EB',
                                          color: '#ffffff',
                                          border: 0,
                                          borderRadius: 6,
                                          padding: '4px 8px',
                                          fontSize: 9.5,
                                          fontWeight: 800,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Return Vehicle
                                      </button>
                                    )}
                                    {!isOriginalBorrower && canICAct && (
                                      <button
                                        type="button"
                                        onClick={() => setReturnTarget(log)}
                                        style={{
                                          background: '#0284C7',
                                          color: '#ffffff',
                                          border: 0,
                                          borderRadius: 6,
                                          padding: '4px 8px',
                                          fontSize: 9.5,
                                          fontWeight: 800,
                                          cursor: 'pointer'
                                        }}
                                        title="Log vehicle return on behalf of borrower engineer"
                                      >
                                        Catat Pengembalian
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* 2. STATUS: MENUNGGU_ACC_KEMBALI */}
                                {status === 'MENUNGGU_ACC_KEMBALI' && canVerifyVehicleReturn(activeUser, log) && (
                                  <div style={{ display: 'inline-flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => setAccTarget(log)}
                                      style={{
                                        background: '#16A34A',
                                        color: '#ffffff',
                                        border: 0,
                                        borderRadius: 5,
                                        padding: '3px 6px',
                                        fontSize: 9,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title="Approve Vehicle Return"
                                    >
                                      Diterima
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectTarget(log)}
                                      style={{
                                        background: '#DC2626',
                                        color: '#ffffff',
                                        border: 0,
                                        borderRadius: 5,
                                        padding: '3px 6px',
                                        fontSize: 9,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title="Tolak Pengembalian (Minta Perbaikan)"
                                    >
                                      Needs Rectification
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIgnoreTarget(log)}
                                      style={{
                                        background: '#475569',
                                        color: '#ffffff',
                                        border: 0,
                                        borderRadius: 5,
                                        padding: '3px 6px',
                                        fontSize: 9,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title="Abaikan Sementara"
                                    >
                                      Dismissed
                                    </button>
                                  </div>
                                )}

                                {/* 3. STATUS: PERLU_PERBAIKAN_KEMBALI */}
                                {status === 'PERLU_PERBAIKAN_KEMBALI' && isOriginalBorrower && (
                                  <button
                                    type="button"
                                    onClick={() => setReturnTarget(log)}
                                    style={{
                                      background: '#EA580C',
                                      color: '#ffffff',
                                      border: 0,
                                      borderRadius: 6,
                                      padding: '4px 8px',
                                      fontSize: 9.5,
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Perbaiki Pengembalian
                                  </button>
                                )}

                                {/* 4. STATUS: DIABAIKAN - IC can follow-up verification */}
                                {status === 'DIABAIKAN' && canVerifyVehicleReturn(activeUser, log) && (
                                  <button
                                    type="button"
                                    onClick={() => setAccTarget(log)}
                                    style={{
                                      background: '#D97706',
                                      color: '#ffffff',
                                      border: 0,
                                      borderRadius: 5,
                                      padding: '3px 7px',
                                      fontSize: 9,
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="Proses Verifikasi Tertunda"
                                  >
                                    Verifikasi Lanjutan
                                  </button>
                                )}
                              </div>
                            )
                          })()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {/* View Action - Available to All Roles */}
                            <button
                              type="button"
                              onClick={() => setViewTarget(log)}
                              className="icon-btn"
                              style={{ width: 28, height: 28, color: '#0F172A', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                              title="View Vehicle Details (Read-Only)"
                            >
                              <Eye size={14} />
                            </button>
                            {/* Maps Action - Available to All Roles */}
                            <button
                              type="button"
                              onClick={() => setLiveMapTarget(log)}
                              style={{
                                background: '#E0F2FE',
                                color: '#0369A1',
                                border: '1px solid #BAE6FD',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <MapPin size={11} />
                              <span>Maps</span>
                            </button>
                            {/* Edit Action - EXCLUSIVELY for Super Admin sanderlina.imelda */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => setEditTarget(log)}
                                className="icon-btn"
                                style={{ width: 28, height: 28, color: '#2563EB' }}
                                title="Edit Vehicle Log (Super Admin)"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {/* Delete Action - EXCLUSIVELY for Super Admin sanderlina.imelda */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(log)}
                                className="icon-btn"
                                style={{ width: 28, height: 28, color: '#DC2626' }}
                                title="Delete Vehicle Log (Super Admin)"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: CARD LIST */}
        {viewMode === 'CARD_LIST' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                background: '#0F172A',
                color: '#ffffff',
                padding: '9px 14px',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
                <LayoutGrid size={15} color="#38BDF8" />
                <span>BERKAS LOGBOOK ({filteredLogs.length} Record)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: '#0F172A', color: '#FCD34D', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
                        {log.platKendaraan}
                      </span>
                      <span
                        style={{
                          background: log.isMotor ? '#F3E8FF' : '#EFF6FF',
                          color: log.isMotor ? '#7E22CE' : '#1D4ED8',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800
                        }}
                      >
                        {log.isMotor ? '🛵 ' : '🚗 '}
                        {log.typeKendaraan}
                      </span>
                      <span
                        style={{
                          background: (log.team || '').toUpperCase() === 'SO' ? '#DCFCE7' : '#FEF3C7',
                          color: (log.team || '').toUpperCase() === 'SO' ? '#166534' : '#92400E',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800
                        }}
                      >
                        Team {log.team}
                      </span>
                    </div>

                    {(() => {
                      const status = normalizeVehicleStatus(log.statusArmada)
                      const badge = getVehicleStatusBadge(status)
                      return (
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {status === 'SELESAI' && <CheckCircle size={11} color="#16A34A" />}
                          {badge.label}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Body Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Tiket: <b style={{ color: '#0F172A' }}>{log.ticket}</b> • Tgl: {log.tanggal}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                        Destination: {log.ketDestination}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
                        Driver PIC: {log.pic}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <div style={{ color: '#2563EB', fontWeight: 700 }}>Out: {log.timeOut}</div>
                      <div style={{ color: log.timeIn !== '-' ? '#16A34A' : '#94A3B8', fontWeight: 700 }}>
                        In: {log.timeIn}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry pill */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '6px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10.5
                    }}
                  >
                    <span>Odo: <b>{log.odometerOut}</b></span>
                    <span>Fuel Level: <b>{log.fuelLevel}</b></span>
                    <span style={{ color: '#0284C7' }}>GPS: {log.latitude?.toFixed(4)}, {log.longitude?.toFixed(4)}</span>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setViewTarget(log)}
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: '#0F172A', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                        title="View Vehicle Details (Read-Only)"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveMapTarget(log)}
                        style={{
                          background: '#E0F2FE',
                          color: '#0369A1',
                          border: '1px solid #BAE6FD',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <MapPin size={13} />
                        <span>Maps</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {(() => {
                        const status = normalizeVehicleStatus(log.statusArmada)
                        const isOriginalBorrower = isVehicleBorrower(activeUser, log)
                        const canICAct = canRecordVehicleReturnForTechnician(activeUser, log) || canVerifyVehicleReturn(activeUser, log)
                        const isDeptHead = normalizeRole(activeUser?.role) === ROLES.DEPT_HEAD

                        if (isDeptHead) return null

                        if (status === 'DIPINJAM') {
                          if (isOriginalBorrower) {
                            return (
                              <button
                                type="button"
                                onClick={() => setReturnTarget(log)}
                                style={{
                                  background: '#2563EB',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Return
                              </button>
                            )
                          }
                          if (!isOriginalBorrower && canICAct) {
                            return (
                              <button
                                type="button"
                                onClick={() => setReturnTarget(log)}
                                style={{
                                  background: '#0284C7',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="Log vehicle return on behalf of field engineer"
                              >
                                Log Return
                              </button>
                            )
                          }
                        }

                        if (status === 'MENUNGGU_ACC_KEMBALI' && canVerifyVehicleReturn(activeUser, log)) {
                          return (
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => setAccTarget(log)}
                                style={{
                                  background: '#16A34A',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px 8px',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="ACC Pengembalian"
                              >
                                Diterima
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(log)}
                                style={{
                                  background: '#DC2626',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px 8px',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="Tolak Pengembalian"
                              >
                                Needs Rectification
                              </button>
                              <button
                                type="button"
                                onClick={() => setIgnoreTarget(log)}
                                style={{
                                  background: '#475569',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px 8px',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="Abaikan Pengembalian"
                              >
                                Dismissed
                              </button>
                            </div>
                          )
                        }

                        if (status === 'PERLU_PERBAIKAN_KEMBALI' && isOriginalBorrower) {
                          return (
                            <button
                              type="button"
                              onClick={() => setReturnTarget(log)}
                              style={{
                                background: '#EA580C',
                                color: '#ffffff',
                                border: 0,
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Perbaiki
                            </button>
                          )
                        }

                        if (status === 'DIABAIKAN' && canVerifyVehicleReturn(activeUser, log)) {
                          return (
                            <button
                              type="button"
                              onClick={() => setAccTarget(log)}
                              style={{
                                background: '#D97706',
                                color: '#ffffff',
                                border: 0,
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Verifikasi Lanjutan
                            </button>
                          )
                        }

                        return null
                      })()}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditTarget(log)}
                          className="icon-btn"
                          style={{ width: 30, height: 30, color: '#2563EB' }}
                          title="Edit Vehicle Log (Super Admin)"
                        >
                          <Edit size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(log)}
                          className="icon-btn"
                          style={{ width: 30, height: 30, color: '#DC2626' }}
                          title="Delete Vehicle Log (Super Admin)"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: MAP SPLIT VIEW (Google Maps Real & Radar) */}
        {viewMode === 'MAP_SPLIT_VIEW' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
              gap: 12,
              height: 580,
              background: '#ffffff',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              padding: 10,
              overflow: 'hidden'
            }}
          >
            {/* Left: Interactive Real Leaflet / Google Maps */}
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: '100%', minHeight: 400 }}>
              <MapContainer
                center={
                  selectedVehicle
                    ? [selectedVehicle.latitude, selectedVehicle.longitude]
                    : [KADIN_LAT, KADIN_LNG]
                }
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                {/* Tile Layer based on mapStyle */}
                {mapStyle === 'real' ? (
                  <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Maps"
                  />
                ) : (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                )}

                {/* Zoom Controls at bottomright to avoid overlap with floating indicator */}
                <ZoomControl position="bottomright" />

                <MapCenterController
                  center={
                    selectedVehicle
                      ? [selectedVehicle.latitude, selectedVehicle.longitude]
                      : [KADIN_LAT, KADIN_LNG]
                  }
                  zoom={selectedVehicle ? 16 : 14}
                />

                {/* Basecamp Marker Menara Kadin */}
                <Marker position={[KADIN_LAT, KADIN_LNG]} icon={kadinIcon}>
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <div style={{ fontWeight: 900, color: '#1E3A8A', fontSize: 13 }}>
                        🏢 KANTOR MENARA KADIN
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                        Titik Awal Basecamp Peminjaman & Pengembalian Armada
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${KADIN_LAT},${KADIN_LNG}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          marginTop: 8,
                          background: '#2563EB',
                          color: '#ffffff',
                          padding: '5px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        🧭 Buka Google Maps
                      </a>
                    </div>
                  </Popup>
                </Marker>

                {/* Markers for all vehicles */}
                {filteredLogs.map((veh) => (
                  <Marker
                    key={veh.id}
                    position={[veh.latitude || KADIN_LAT, veh.longitude || KADIN_LNG]}
                    icon={getVehicleIcon(veh.isMotor)}
                    eventHandlers={{
                      click: () => setSelectedVehicle(veh)
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 190 }}>
                        <div style={{ fontWeight: 900, color: '#0F172A', fontSize: 13 }}>
                          {veh.platKendaraan} ({veh.typeKendaraan})
                        </div>
                        <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>
                          <b>PIC:</b> {veh.pic} (Team {veh.team})<br />
                          <b>Destination:</b> {veh.ketDestination}<br />
                          <b>Status:</b> {veh.statusArmada}<br />
                          <b>Odo / Fuel Level:</b> {veh.odometerOut} • {veh.fuelLevel}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLiveMapTarget(veh)}
                          style={{
                            width: '100%',
                            marginTop: 8,
                            background: '#0284C7',
                            color: '#ffffff',
                            border: 0,
                            padding: '6px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🧭 Buka Radar Live
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Floating Map Style Toggle (Google Maps Real / Vektor) */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  zIndex: 1000,
                  display: 'inline-flex',
                  background: 'rgba(15, 23, 42, 0.88)',
                  borderRadius: 10,
                  padding: 3,
                  gap: 2,
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setMapStyle('real')}
                  style={{
                    border: 0,
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: mapStyle === 'real' ? '#2563EB' : 'transparent',
                    color: mapStyle === 'real' ? '#ffffff' : '#94A3B8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🌍 Google Maps Real
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('vektor')}
                  style={{
                    border: 0,
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: mapStyle === 'vektor' ? '#2563EB' : 'transparent',
                    color: mapStyle === 'vektor' ? '#ffffff' : '#94A3B8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🗺️ Vektor
                </button>
              </div>

              {/* Floating Live GPS Indicator - moved to top-right to avoid covering zoom */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(15, 23, 42, 0.92)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 1000,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #38BDF8',
                  maxWidth: '60%'
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(22, 163, 74, 0.3)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <Navigation size={12} color="#4ADE80" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800 }}>GPS Live</span>
                    <span style={{ background: '#16A34A', fontSize: 8.5, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedVehicle
                      ? `${selectedVehicle.platKendaraan} • ${selectedVehicle.latitude?.toFixed(4)}, ${selectedVehicle.longitude?.toFixed(4)}`
                      : '🏢 Menara Kadin • -6.2322, 106.8317'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sidebar Vehicle List */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                Daftar Armada ({filteredLogs.length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredLogs.map((log) => {
                  const isSelected = selectedVehicle?.id === log.id
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedVehicle(log)}
                      style={{
                        background: isSelected ? '#EFF6FF' : '#ffffff',
                        border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: '#1E293B', color: '#FCD34D', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 900 }}>
                          {log.platKendaraan}
                        </span>
                        {(() => {
                          const status = normalizeVehicleStatus(log.statusArmada)
                          const badge = getVehicleStatusBadge(status)
                          return (
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 9.5,
                                fontWeight: 800
                              }}
                            >
                              {badge.label}
                            </span>
                          )
                        })()}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {log.typeKendaraan} - PIC: {log.pic}
                      </div>
                      <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>
                        Tiket: {log.ticket} • Out: {log.timeOut}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                        Destination: {log.ketDestination}
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewTarget(log)
                          }}
                          style={{
                            background: '#F1F5F9',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: '5px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Lihat Detail (Read-Only)"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLiveMapTarget(log)
                          }}
                          style={{
                            flex: 1,
                            background: '#0284C7',
                            color: '#ffffff',
                            border: 0,
                            borderRadius: 6,
                            padding: '5px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Radar GPS
                        </button>
                        {(() => {
                          const status = normalizeVehicleStatus(log.statusArmada)
                          const isOriginalBorrower = isVehicleBorrower(activeUser, log)
                          const canICAct = canRecordVehicleReturnForTechnician(activeUser, log) || canVerifyVehicleReturn(activeUser, log)
                          const isDeptHead = normalizeRole(activeUser?.role) === ROLES.DEPT_HEAD

                          if (isDeptHead) return null

                          if (status === 'DIPINJAM') {
                            if (isOriginalBorrower) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setReturnTarget(log)
                                  }}
                                  style={{
                                    flex: 1,
                                    background: '#2563EB',
                                    color: '#ffffff',
                                    border: 0,
                                    borderRadius: 6,
                                    padding: '5px',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Return
                                </button>
                              )
                            }
                            if (!isOriginalBorrower && canICAct) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setReturnTarget(log)
                                  }}
                                  style={{
                                    flex: 1,
                                    background: '#0284C7',
                                    color: '#ffffff',
                                    border: 0,
                                    borderRadius: 6,
                                    padding: '5px',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Log vehicle return on behalf of field engineer"
                                >
                                  Log Return
                                </button>
                              )
                            }
                          }

                          if (status === 'MENUNGGU_ACC_KEMBALI' && canVerifyVehicleReturn(activeUser, log)) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setAccTarget(log)
                                }}
                                style={{
                                  flex: 1,
                                  background: '#16A34A',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                ACC IC
                              </button>
                            )
                          }

                          if (status === 'PERLU_PERBAIKAN_KEMBALI' && isOriginalBorrower) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReturnTarget(log)
                                }}
                                style={{
                                  flex: 1,
                                  background: '#EA580C',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Perbaiki
                              </button>
                            )
                          }

                          if (status === 'DIABAIKAN' && canVerifyVehicleReturn(activeUser, log)) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setAccTarget(log)
                                }}
                                style={{
                                  flex: 1,
                                  background: '#D97706',
                                  color: '#ffffff',
                                  border: 0,
                                  borderRadius: 6,
                                  padding: '5px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Verifikasi
                              </button>
                            )
                          }

                          return null
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 0: DETAIL KENDARAAN (View Read-Only Dialog)            */}
      {/* ============================================================ */}
      {viewTarget && (
        <ViewVehicleDetailModal
          log={viewTarget}
          onClose={() => setViewTarget(null)}
          onOpenMap={() => {
            const t = viewTarget
            setViewTarget(null)
            setLiveMapTarget(t)
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 1: TAMBAH PEMINJAMAN KENDARAAN (Add Vehicle Loan Dialog)  */}
      {/* ============================================================ */}
      {showAddDialog && (
        <AddVehicleLoanModal
          activeUser={activeUser}
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddLog}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: FORM PENGEMBALIAN KENDARAAN (Return Dialog)            */}
      {/* ============================================================ */}
      {returnTarget && (
        <ReturnVehicleModal
          log={returnTarget}
          activeUser={activeUser}
          onClose={() => setReturnTarget(null)}
          onSubmit={handleReturnSubmit}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3: PERSETUJUAN & DITERIMA OLEH IC (Acc Return Dialog)    */}
      {/* ============================================================ */}
      {accTarget && (
        <AccReturnModal
          log={accTarget}
          activeUser={activeUser}
          onClose={() => setAccTarget(null)}
          onSubmit={handleAccSubmit}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3B: PENOLAKAN PENGEMBALIAN OLEH IC (Reject Return Dialog) */}
      {/* ============================================================ */}
      {rejectTarget && (
        <RejectReturnModal
          log={rejectTarget}
          activeUser={activeUser}
          onClose={() => setRejectTarget(null)}
          onSubmit={handleRejectSubmit}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3C: ABAIKAN PENGEMBALIAN OLEH IC (Ignore Return Dialog)  */}
      {/* ============================================================ */}
      {ignoreTarget && (
        <IgnoreReturnModal
          log={ignoreTarget}
          activeUser={activeUser}
          onClose={() => setIgnoreTarget(null)}
          onSubmit={handleIgnoreSubmit}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 4: EDIT LOG KENDARAAN (Super Admin Only)                */}
      {/* ============================================================ */}
      {editTarget && (
        <EditVehicleModal
          log={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 5: KONFIRMASI HAPUS (Super Admin Only)                  */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)} style={{ zIndex: 10000 }}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 20, borderRadius: 16 }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: '#DC2626' }}>Delete Vehicle Log</h3>
            <p style={{ fontSize: 12, color: '#475569', margin: '10px 0 16px' }}>
              Apakah Anda yakin ingin menghapus data peminjaman armada <b>{deleteTarget.platKendaraan}</b> ({deleteTarget.ticket} - {deleteTarget.pic})?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#ffffff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 0,
                  background: '#DC2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: LIVE TRACKING & RADAR POPUP                           */}
      {/* ============================================================ */}
      {liveMapTarget && (
        <LiveRadarMapModal
          log={liveMapTarget}
          onClose={() => setLiveMapTarget(null)}
        />
      )}
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Add Vehicle Loan Modal
// -------------------------------------------------------------
function AddVehicleLoanModal({ activeUser, onClose, onSubmit }) {
  const [judulPekerjaan, setJudulPekerjaan] = useState('Field Operation Maintenance & Vehicle Dispatch')
  const [bulan, setBulan] = useState('SEPTEMBER')
  const [tahun, setTahun] = useState('2026')
  const [tanggal, setTanggal] = useState('10/09/2026')
  const [pic, setPic] = useState('Hadi & Qori')
  const [team, setTeam] = useState('SO')
  const [timeOut, setTimeOut] = useState('10:38')
  const [ticket, setTicket] = useState('E/260909/0028')
  const [platKendaraan, setPlatKendaraan] = useState('B 2924 SKN')
  const [typeKendaraan, setTypeKendaraan] = useState('Grandmax')
  const [ketDestination, setKetDestination] = useState('Cilandak')
  const [odometerOut, setOdometerOut] = useState('45,210 KM')
  const [fuelLevel, setFuelLevel] = useState('Full (90%)')
  const [catatanPinjam, setCatatanPinjam] = useState('Peminjaman armada mobil untuk penanganan lapangan')

  const vehiclePresets = [
    { plat: 'B 2924 SKN', type: 'Grandmax' },
    { plat: 'B 4605 SOU', type: 'LEXY' },
    { plat: 'B 1241 U', type: 'AVANZA' },
    { plat: 'B 4616 SOU', type: 'LEXY' },
    { plat: 'B 9872 KBA', type: 'Grandmax' },
    { plat: 'B 3321 TZA', type: 'AVANZA' }
  ]

  const teamPresets = [
    { name: 'Hadi & Qori', team: 'SO' },
    { name: 'Carlos & Syahril', team: 'SO' },
    { name: 'Yosep', team: 'SM' },
    { name: 'Anil', team: 'SM' },
    { name: 'M.Rusli', team: 'SM' },
    { name: 'Alqori Dewantara & Ahmad Ibrahim', team: 'SO' }
  ]

  const ticketPresets = ['E/260909/0028', 'E/260909/0033', 'Storing', 'Aktifasi Switch Ring 7', 'E/260909/0019']

  const handleSave = (e) => {
    e.preventDefault()
    if (!platKendaraan || !pic) return

    const isMotor =
      typeKendaraan.toLowerCase().includes('lexy') ||
      typeKendaraan.toLowerCase().includes('nmax') ||
      typeKendaraan.toLowerCase().includes('vario') ||
      typeKendaraan.toLowerCase().includes('beat')

    const newLog = {
      id: `veh-${Date.now()}`,
      tanggal,
      pic,
      borrowerUserId: activeUser?.id || activeUser?.employeeId || null,
      borrowerUsername: activeUser?.username || '',
      borrowerName: activeUser?.name || pic,
      team,
      timeOut,
      timeIn: '-',
      tanggalKembali: '-',
      ticket,
      platKendaraan,
      typeKendaraan,
      ketDestination,
      odometerOut,
      odometerIn: '-',
      fuelLevel,
      fuelLevelIn: '-',
      statusArmada: 'DIPINJAM',
      catatanPinjam,
      catatanKembali: '-',
      accBy: '-',
      accRole: '-',
      accTime: '-',
      accNotes: '-',
      latitude: -6.2922 + (Math.random() - 0.5) * 0.04,
      longitude: 106.8041 + (Math.random() - 0.5) * 0.04,
      isMotor
    }
    onSubmit(newLog)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{
          width: 'min(760px, 94vw)',
          maxHeight: '92vh',
          borderRadius: 20,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
              Input Data Operasional FOSIS
            </h2>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>
              Vehicle Dispatch Logbook / Field Form
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Judul Pekerjaan */}
          <div className="fosis-field-box">
            <label className="fosis-field-label">Job Title / Brief Work Description <span style={{ color: '#EF4444', fontWeight: 900 }}>*</span></label>
            <input
              className="fosis-field-input"
              required
              value={judulPekerjaan}
              onChange={(e) => setJudulPekerjaan(e.target.value)}
            />
          </div>

          {/* Bulan & Tahun */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Bulan</label>
              <input className="fosis-field-input" value={bulan} onChange={(e) => setBulan(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Tahun</label>
              <input className="fosis-field-input" value={tahun} onChange={(e) => setTahun(e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
            Administrative Parameters (Vehicle Registry Structure):
          </div>

          {/* Tanggal & Time out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Tanggal</label>
              <input className="fosis-field-input" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Time Out</label>
              <input className="fosis-field-input" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
            </div>
          </div>

          {/* PIC & Team */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">PIC Driver Lapangan</label>
              <input className="fosis-field-input" required value={pic} onChange={(e) => setPic(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Team (SO / SM)</label>
              <div className="fosis-select-wrapper">
                <select className="fosis-field-input select-clean" value={team} onChange={(e) => setTeam(e.target.value)}>
                  <option value="SO">SO</option>
                  <option value="SM">SM</option>
                </select>
                <ChevronDown size={14} className="fosis-select-arrow" />
              </div>
            </div>
          </div>

          {/* Pilihan Cepat PIC */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {teamPresets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setPic(p.name)
                  setTeam(p.team)
                }}
                style={{
                  border: pic === p.name ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                  background: pic === p.name ? '#E0F2FE' : '#ffffff',
                  color: pic === p.name ? '#0369A1' : '#334155',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p.name} ({p.team})
              </button>
            ))}
          </div>

          {/* Ticket & Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Ticket</label>
              <input className="fosis-field-input" value={ticket} onChange={(e) => setTicket(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Ket. Destination</label>
              <input className="fosis-field-input" value={ketDestination} onChange={(e) => setKetDestination(e.target.value)} />
            </div>
          </div>

          {/* Plat & Vehicle Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">License Plate</label>
              <input className="fosis-field-input" required value={platKendaraan} onChange={(e) => setPlatKendaraan(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Vehicle Type</label>
              <input className="fosis-field-input" value={typeKendaraan} onChange={(e) => setTypeKendaraan(e.target.value)} />
            </div>
          </div>

          {/* Pilihan Cepat Armada */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {vehiclePresets.map((vp) => (
              <button
                key={vp.plat}
                type="button"
                onClick={() => {
                  setPlatKendaraan(vp.plat)
                  setTypeKendaraan(vp.type)
                }}
                style={{
                  border: platKendaraan === vp.plat ? '1.5px solid #16A34A' : '1px solid #CBD5E1',
                  background: platKendaraan === vp.plat ? '#DCFCE7' : '#ffffff',
                  color: platKendaraan === vp.plat ? '#166534' : '#334155',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {vp.plat} ({vp.type})
              </button>
            ))}
          </div>

          {/* Odometer & Fuel Level */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Odometer Awal</label>
              <input className="fosis-field-input" value={odometerOut} onChange={(e) => setOdometerOut(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Fuel Level Awal</label>
              <input className="fosis-field-input" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} />
            </div>
          </div>

          {/* Catatan Pinjam */}
          <div className="fosis-field-box">
            <label className="fosis-field-label">Field Dispatch Notes</label>
            <input className="fosis-field-input" value={catatanPinjam} onChange={(e) => setCatatanPinjam(e.target.value)} />
          </div>

          {/* GPS Lock Banner */}
          <div
            style={{
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: '#14532D' }}>
              <ShieldCheck size={16} color="#15803D" />
              <span>GPS LOCK : LOKASI TERKUNCI OTOMATIS SENSOR GPS AKTIF</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#166534' }}>
              Koordinat terunci saat input data: -6.2322, 106.8317 (Akurasi Presisi Device Menara Kadin)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.4,
              padding: '10px',
              borderRadius: 10,
              border: 0,
              background: '#2563EB',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Save size={15} />
            <span>Save Record</span>
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: View Vehicle Detail Modal (Read-Only for all roles)
// -------------------------------------------------------------
function ViewVehicleDetailModal({ log, onClose, onOpenMap }) {
  const status = normalizeVehicleStatus(log.statusArmada)
  const badge = getVehicleStatusBadge(status)

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 94vw)',
          maxHeight: '90vh',
          borderRadius: 16,
          background: '#ffffff',
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
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#2563EB',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff'
              }}
            >
              <Eye size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                Vehicle Detailed Information
              </h3>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Informasi Logbook Operasional (Mode Baca Saja)
              </div>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status banner */}
          <div
            style={{
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: badge.color, textTransform: 'uppercase' }}>
                Fleet Status
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: badge.color, marginTop: 2 }}>
                {badge.label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: '#0F172A', color: '#FCD34D', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
                {log.platKendaraan}
              </span>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontWeight: 700 }}>
                {log.typeKendaraan} ({log.isMotor ? 'Motorcycle' : 'Operational Vehicle'})
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>Peminjam / Driver (PIC)</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', marginTop: 3 }}>{log.pic}</div>
              {log.borrowerName && (
                <div style={{ fontSize: 10, color: '#2563EB', marginTop: 2 }}>Akun: {log.borrowerName} ({log.borrowerUsername || 'id: ' + log.borrowerUserId})</div>
              )}
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>Team & Task Ticket</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', marginTop: 3 }}>
                Team {log.team} • <span style={{ color: '#2563EB' }}>{log.ticket}</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>Destination & Dispatch Notes</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginTop: 3 }}>{log.ketDestination}</div>
              <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>{log.catatanPinjam || '-'}</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>Departure Time (Out)</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1E3A8A', marginTop: 3 }}>
                {log.tanggal} at {log.timeOut} WIB
              </div>
              <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                Initial Odo: <b>{log.odometerOut}</b> • Fuel Level: <b>{log.fuelLevel}</b>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>Return Time (In)</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: log.timeIn !== '-' ? '#16A34A' : '#94A3B8', marginTop: 3 }}>
                {log.tanggalKembali && log.tanggalKembali !== '-' ? log.tanggalKembali : log.tanggal} at {log.timeIn} WIB
              </div>
              <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                Final Odo: <b>{log.odometerIn || '-'}</b> • Fuel Level: <b>{log.fuelLevelIn || '-'}</b>
              </div>
              {log.catatanKembali && log.catatanKembali !== '-' && (
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 3, fontStyle: 'italic' }}>
                  "{log.catatanKembali}"
                </div>
              )}
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700 }}>IC Audit & Verification</div>
              {log.recordedByIC && (
                <div style={{ fontSize: 10.5, color: '#0369A1', marginTop: 2 }}>
                  Recorded by IC: <b>{log.recordedByIC}</b> ({log.recordedByICRole})
                </div>
              )}
              {log.accBy && log.accBy !== '-' ? (
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>
                    Verified: {log.accBy} ({log.accRole})
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Time: {log.accTime}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>Notes: "{log.accNotes}"</div>
                </div>
              ) : log.rejectedBy ? (
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626' }}>
                    Needs Rectification by: {log.rejectedBy} ({log.rejectedRole})
                  </div>
                  <div style={{ fontSize: 10, color: '#B91C1C' }}>Reason: "{log.rejectionReason}"</div>
                </div>
              ) : log.ignoredBy ? (
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
                    Dismissed by: {log.ignoredBy} ({log.ignoredRole})
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Reason: "{log.ignoredReason}"</div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Belum diverifikasi</div>
              )}
            </div>
          </div>

          {/* GPS Coordinates info */}
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#1E40AF' }}>Lokasi Sensor GPS Terakhir:</div>
              <div style={{ fontSize: 11, color: '#2563EB', marginTop: 1 }}>
                Lat: {log.latitude ? log.latitude.toFixed(4) : 'Tidak tersedia'} • Lng: {log.longitude ? log.longitude.toFixed(4) : 'Tidak tersedia'}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenMap}
              style={{
                background: '#2563EB',
                color: '#ffffff',
                border: 0,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <MapPin size={12} />
              <span>Buka Peta</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Return Vehicle Modal
// -------------------------------------------------------------
function ReturnVehicleModal({ log, activeUser, onClose, onSubmit }) {
  const currentDate = new Date().toLocaleDateString('id-ID')
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // Parse starting numeric odometer
  const parseOdoNumber = (str = '') => {
    const cleaned = String(str).replace(/[^0-9]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const initialOdoNum = parseOdoNumber(log.odometerOut)
  const defaultReturnOdo = initialOdoNum ? `${initialOdoNum + 45} KM` : '45,280 KM'

  const [tanggalKembali, setTanggalKembali] = useState(log.tanggalKembali && log.tanggalKembali !== '-' ? log.tanggalKembali : currentDate)
  const [timeIn, setTimeIn] = useState(log.timeIn && log.timeIn !== '-' ? log.timeIn : currentTime)
  const [odometerIn, setOdometerIn] = useState(log.odometerIn && log.odometerIn !== '-' ? log.odometerIn : defaultReturnOdo)
  const [fuelLevelIn, setFuelLevelIn] = useState(log.fuelLevelIn && log.fuelLevelIn !== '-' ? log.fuelLevelIn : 'Full (80%)')
  const [catatanKembali, setCatatanKembali] = useState(
    log.catatanKembali && log.catatanKembali !== '-'
      ? log.catatanKembali
      : 'Vehicle returned to office parking bay, keys and vehicle documents handed over to security post.'
  )
  const [errorMessage, setErrorMessage] = useState('')

  const isTechnicianBorrower = isVehicleBorrower(activeUser, log)
  const isICUser = canRecordVehicleReturnForTechnician(activeUser, log)

  const handleSave = (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!tanggalKembali || !timeIn || !odometerIn) {
      setErrorMessage('Return date, return time, and final odometer reading are required.')
      return
    }

    const numIn = parseOdoNumber(odometerIn)
    const numOut = parseOdoNumber(log.odometerOut)

    if (numIn > 0 && numOut > 0 && numIn < numOut) {
      setErrorMessage(`Odometer Masuk (${numIn} KM) tidak boleh lebih kecil dari Odometer Awal (${numOut} KM).`)
      return
    }

    const updated = {
      ...log,
      tanggalKembali,
      timeIn,
      odometerIn,
      fuelLevelIn,
      catatanKembali,
      statusArmada: 'MENUNGGU_ACC_KEMBALI',
      recordedByIC: isICUser && !isTechnicianBorrower ? activeUser?.name : log.recordedByIC || null,
      recordedByICRole: isICUser && !isTechnicianBorrower ? activeUser?.role : log.recordedByICRole || null,
      submittedReturnAt: new Date().toISOString()
    }

    onSubmit(updated)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{
          width: 'min(560px, 94vw)',
          borderRadius: 16,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
              {isICUser && !isTechnicianBorrower ? 'Record Vehicle Return (On Behalf of Field Engineer)' : 'Vehicle Return Form'}
            </h3>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              {log.platKendaraan} ({log.typeKendaraan}) - Original Borrower: <b>{log.pic}</b>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isICUser && !isTechnicianBorrower && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: 8, fontSize: 11, color: '#1E40AF' }}>
              ℹ️ You are recording this return on behalf of the original borrower <b>{log.pic}</b>. Original borrower identity will be retained.
            </div>
          )}

          {errorMessage && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 8, fontSize: 11, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ background: '#0F172A', color: '#ffffff', padding: 10, borderRadius: 8, fontSize: 11 }}>
            <span style={{ color: '#FCD34D', fontWeight: 900 }}>{log.platKendaraan}</span> • Departure: {log.tanggal} {log.timeOut} • Initial Odo: <b>{log.odometerOut}</b>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Return Date</label>
              <input className="fosis-field-input" value={tanggalKembali} onChange={(e) => setTanggalKembali(e.target.value)} required />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Return Time (Time In)</label>
              <input className="fosis-field-input" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Final Mileage / Return Odometer <span style={{ color: '#EF4444' }}>*</span></label>
              <input className="fosis-field-input" value={odometerIn} onChange={(e) => setOdometerIn(e.target.value)} required />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Fuel Level on Return</label>
              <input className="fosis-field-input" value={fuelLevelIn} onChange={(e) => setFuelLevelIn(e.target.value)} />
            </div>
          </div>

          <div className="fosis-field-box">
            <label className="fosis-field-label">Physical Condition & Key Inspection Notes</label>
            <textarea
              rows={3}
              className="fosis-field-input"
              value={catatanKembali}
              onChange={(e) => setCatatanKembali(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.3,
              padding: '9px',
              borderRadius: 8,
              border: 0,
              background: '#2563EB',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Submit Return
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: ACC Return Modal (DITERIMA - Verifikasi IC)
// -------------------------------------------------------------
function AccReturnModal({ log, activeUser, onClose, onSubmit }) {
  const [accBy, setAccBy] = useState(activeUser?.name || 'Alqori Dewantara')
  const [accRole, setAccRole] = useState(activeUser?.role || 'IC Service Operation')
  const [accNotes, setAccNotes] = useState('Vehicle condition, vehicle registration (STNK), and keys received in good order at basecamp.')

  const handleAcc = (e) => {
    e.preventDefault()
    const nowStr = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    onSubmit({
      ...log,
      statusArmada: 'SELESAI',
      accBy,
      accRole,
      accTime: nowStr,
      accNotes
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleAcc}
        style={{
          width: 'min(540px, 94vw)',
          borderRadius: 16,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#16A34A' }}>Verify Return (Accepted) - Armada Completed</h3>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{log.platKendaraan} - Driver: {log.pic}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: 10, fontSize: 11, color: '#92400E' }}>
            <b>Data Masuk:</b> Final Odo: {log.odometerIn || '-'} • Fuel Level: {log.fuelLevelIn || '-'} • Jam: {log.timeIn || '-'}
            <div style={{ marginTop: 4 }}>Driver Notes: "{log.catatanKembali}"</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Approving IC Officer Name</label>
              <input className="fosis-field-input" value={accBy} onChange={(e) => setAccBy(e.target.value)} required />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">IC Role</label>
              <input className="fosis-field-input" value={accRole} onChange={(e) => setAccRole(e.target.value)} required />
            </div>
          </div>

          <div className="fosis-field-box">
            <label className="fosis-field-label">IC Verification Notes</label>
            <textarea
              rows={3}
              className="fosis-field-input"
              value={accNotes}
              onChange={(e) => setAccNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.3,
              padding: '9px',
              borderRadius: 8,
              border: 0,
              background: '#16A34A',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Check size={15} />
            <span>Approve & Complete Log</span>
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Reject Return Modal (DITOLAK - Verifikasi IC)
// -------------------------------------------------------------
function RejectReturnModal({ log, activeUser, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [rejectedBy, setRejectedBy] = useState(activeUser?.name || 'IC Officer')
  const [rejectedRole, setRejectedRole] = useState(activeUser?.role || 'IC')
  const [errorMsg, setErrorMsg] = useState('')

  const handleReject = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setErrorMsg('Rejection reason / required correction is mandatory.')
      return
    }
    const nowStr = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    onSubmit({
      ...log,
      statusArmada: 'PERLU_PERBAIKAN_KEMBALI',
      rejectionReason: reason.trim(),
      rejectedBy,
      rejectedRole,
      rejectedTime: nowStr
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleReject}
        style={{
          width: 'min(520px, 94vw)',
          borderRadius: 16,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#DC2626' }}>
              Reject Fleet Return (Needs Rectification)
            </h3>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{log.platKendaraan} - {log.pic}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {errorMsg && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 8, fontSize: 11, color: '#B91C1C' }}>
              {errorMsg}
            </div>
          )}

          <p style={{ fontSize: 11.5, color: '#475569', margin: 0 }}>
            Return will be set to <b>Needs Rectification</b> so that field engineer ({log.pic}) can rectify data or vehicle physical condition.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">IC Officer</label>
              <input className="fosis-field-input" value={rejectedBy} onChange={(e) => setRejectedBy(e.target.value)} required />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Role</label>
              <input className="fosis-field-input" value={rejectedRole} onChange={(e) => setRejectedRole(e.target.value)} required />
            </div>
          </div>

          <div className="fosis-field-box">
            <label className="fosis-field-label">Rejection Reason / Required Rectification <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea
              rows={3}
              className="fosis-field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Fuel level below initial checkout level, or odometer mismatch..."
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.3,
              padding: '9px',
              borderRadius: 8,
              border: 0,
              background: '#DC2626',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Reject & Request Revision
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Ignore Return Modal (DIABAIKAN - Verifikasi IC)
// -------------------------------------------------------------
function IgnoreReturnModal({ log, activeUser, onClose, onSubmit }) {
  const [reason, setReason] = useState('Fleet physical inspection deferred pending further field verification.')
  const [ignoredBy, setIgnoredBy] = useState(activeUser?.name || 'IC Officer')
  const [ignoredRole, setIgnoredRole] = useState(activeUser?.role || 'IC')

  const handleIgnore = (e) => {
    e.preventDefault()
    const nowStr = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    onSubmit({
      ...log,
      statusArmada: 'DIABAIKAN',
      ignoredBy,
      ignoredRole,
      ignoredTime: nowStr,
      ignoredReason: reason
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleIgnore}
        style={{
          width: 'min(500px, 94vw)',
          borderRadius: 16,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#475569' }}>
              Defer Return Verification (Dismissed)
            </h3>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{log.platKendaraan} - {log.pic}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11.5, color: '#475569', margin: 0 }}>
            Vehicle status will be set to <b>Dismissed</b> and <b>NOT</b> marked as completed. Fleet remains unavailable for new dispatch until verified by IC.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">IC Officer</label>
              <input className="fosis-field-input" value={ignoredBy} onChange={(e) => setIgnoredBy(e.target.value)} required />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Role</label>
              <input className="fosis-field-input" value={ignoredRole} onChange={(e) => setIgnoredRole(e.target.value)} required />
            </div>
          </div>

          <div className="fosis-field-box">
            <label className="fosis-field-label">Deferral / Hold Notes</label>
            <textarea
              rows={3}
              className="fosis-field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.3,
              padding: '9px',
              borderRadius: 8,
              border: 0,
              background: '#475569',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Save Dismissed Status
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Edit Vehicle Modal
// -------------------------------------------------------------
function EditVehicleModal({ log, onClose, onSubmit }) {
  const [pic, setPic] = useState(log.pic)
  const [team, setTeam] = useState(log.team)
  const [ticket, setTicket] = useState(log.ticket)
  const [platKendaraan, setPlatKendaraan] = useState(log.platKendaraan)
  const [typeKendaraan, setTypeKendaraan] = useState(log.typeKendaraan)
  const [ketDestination, setKetDestination] = useState(log.ketDestination)
  const [odometerOut, setOdometerOut] = useState(log.odometerOut)
  const [fuelLevel, setFuelLevel] = useState(log.fuelLevel)

  const handleSave = (e) => {
    e.preventDefault()
    onSubmit({
      ...log,
      pic,
      team,
      ticket,
      platKendaraan,
      typeKendaraan,
      ketDestination,
      odometerOut,
      fuelLevel
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <form
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{
          width: 'min(580px, 94vw)',
          borderRadius: 16,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Edit Vehicle Log</h3>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">License Plate</label>
              <input className="fosis-field-input" value={platKendaraan} onChange={(e) => setPlatKendaraan(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Vehicle Type</label>
              <input className="fosis-field-input" value={typeKendaraan} onChange={(e) => setTypeKendaraan(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">PIC</label>
              <input className="fosis-field-input" value={pic} onChange={(e) => setPic(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Team</label>
              <input className="fosis-field-input" value={team} onChange={(e) => setTeam(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Ticket</label>
              <input className="fosis-field-input" value={ticket} onChange={(e) => setTicket(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Destination</label>
              <input className="fosis-field-input" value={ketDestination} onChange={(e) => setKetDestination(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Odometer</label>
              <input className="fosis-field-input" value={odometerOut} onChange={(e) => setOdometerOut(e.target.value)} />
            </div>
            <div className="fosis-field-box">
              <label className="fosis-field-label">Fuel Level</label>
              <input className="fosis-field-input" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1.3,
              padding: '9px',
              borderRadius: 8,
              border: 0,
              background: '#2563EB',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

// -------------------------------------------------------------
// SUB-COMPONENT: Live Radar Map Modal
// -------------------------------------------------------------
function LiveRadarMapModal({ log, onClose }) {
  const lat = log.latitude || KADIN_LAT
  const lng = log.longitude || KADIN_LNG
  const [radarMapStyle, setRadarMapStyle] = useState('real')
  const [isPaused, setIsPaused] = useState(false)

  // Generate intermediate route points between Kadin basecamp and vehicle location
  const routePoints = useMemo(() => {
    const steps = 8
    const points = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Add slight curve to the route for realistic appearance
      const curveFactor = Math.sin(t * Math.PI) * 0.008
      points.push([
        KADIN_LAT + (lat - KADIN_LAT) * t + curveFactor,
        KADIN_LNG + (lng - KADIN_LNG) * t + curveFactor * 0.6
      ])
    }
    return points
  }, [lat, lng])

  // Simulated telemetry data
  const speed = log.statusArmada === 'SELESAI' ? '0 km/h' : `${Math.floor(Math.random() * 40 + 30)} km/h`
  const kmBerangkat = log.odometerOut || '0 KM'

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(780px, 94vw)',
          height: '88vh',
          borderRadius: 18,
          background: '#0B1120',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1.5px solid #1E3A5F'
        }}
      >
        {/* Header - Dark Theme */}
        <div
          style={{
            padding: '12px 16px',
            background: '#0F1A2E',
            borderBottom: '1px solid #1E3A5F',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.2)',
                border: '2px solid #3B82F6',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Navigation size={16} color="#60A5FA" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.2px' }}>
                  LIVE GPS GOOGLE MAPS: {log.platKendaraan}
                </span>
                <span
                  style={{
                    background: log.statusArmada === 'SELESAI' ? '#16A34A' : '#DC2626',
                    color: '#ffffff',
                    fontSize: 9,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.5px'
                  }}
                >
                  {log.statusArmada === 'SELESAI' ? 'COMPLETED' : 'LIVE GPS LOCK'}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                {log.typeKendaraan} • PIC: {log.pic} (Team {log.team}) • Tiket: {log.ticket}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid #334155',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: '#94A3B8',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            {/* Tile Layer based on radarMapStyle */}
            {radarMapStyle === 'real' ? (
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
              />
            ) : (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
            )}

            {/* Zoom Controls at bottomright - clear of all overlays */}
            <ZoomControl position="bottomright" />

            {/* Route Polyline from Kadin to vehicle */}
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: '#38BDF8',
                weight: 3,
                opacity: 0.8,
                dashArray: '8, 8'
              }}
            />

            {/* Basecamp Kadin */}
            <Marker position={[KADIN_LAT, KADIN_LNG]} icon={kadinIcon}>
              <Popup>🏢 Basecamp: Menara Kadin Indonesia</Popup>
            </Marker>
            {/* Target Vehicle Marker */}
            <Marker position={[lat, lng]} icon={getVehicleIcon(log.isMotor)}>
              <Popup>
                <b>{log.platKendaraan}</b> ({log.typeKendaraan})<br />
                PIC: {log.pic}<br />
                Destination: {log.ketDestination}
              </Popup>
            </Marker>
          </MapContainer>

          {/* Floating Map Style Toggle */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 1000,
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.92)',
              borderRadius: 10,
              padding: 3,
              gap: 2,
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <button
              type="button"
              onClick={() => setRadarMapStyle('real')}
              style={{
                border: 0,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: radarMapStyle === 'real' ? '#2563EB' : 'transparent',
                color: radarMapStyle === 'real' ? '#ffffff' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              🌍 Google Maps Real
            </button>
            <button
              type="button"
              onClick={() => setRadarMapStyle('vektor')}
              style={{
                border: 0,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: radarMapStyle === 'vektor' ? '#2563EB' : 'transparent',
                color: radarMapStyle === 'vektor' ? '#ffffff' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              🗺️ Vektor
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              style={{
                border: 0,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: isPaused ? '#D97706' : 'transparent',
                color: isPaused ? '#ffffff' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              ⏸ Jeda
            </button>
          </div>

          {/* Floating Destination Info (top-right) */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1000,
              background: 'rgba(220, 38, 38, 0.9)',
              borderRadius: 10,
              padding: '8px 12px',
              backdropFilter: 'blur(6px)',
              maxWidth: 200
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 900, color: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 4 }}>
              🏁 DESTINATION: {log.ketDestination}
            </div>
            <div style={{ fontSize: 9, color: '#FCA5A5', marginTop: 2 }}>
              Lat: {lat.toFixed(3)} | Lng: {lng.toFixed(2)}
            </div>
          </div>

          {/* Floating Origin Info Card (bottom-left) */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 10,
              zIndex: 1000,
              background: 'rgba(22, 163, 74, 0.92)',
              borderRadius: 10,
              padding: '8px 12px',
              backdropFilter: 'blur(6px)',
              maxWidth: 220
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4 }}>
              🏢 ASAL: KANTOR MENARA KADIN
            </div>
            <div style={{ fontSize: 9, color: '#BBF7D0', marginTop: 2 }}>
              Waktu Out: {log.timeOut} • Odo: {log.odometerOut}
            </div>
          </div>
        </div>

        {/* Telemetry Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid #1E3A5F',
            background: '#0F1A2E'
          }}
        >
          <div style={{ padding: '10px 14px', borderRight: '1px solid #1E3A5F' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kecepatan
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8', marginTop: 2 }}>
              {speed}
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRight: '1px solid #1E3A5F' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fuel Level Awal
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#4ADE80', marginTop: 2 }}>
              {log.fuelLevel || 'Full'}
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRight: '1px solid #1E3A5F' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              KM Berangkat
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B', marginTop: 2 }}>
              {kmBerangkat}
            </div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fleet Status
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: log.statusArmada === 'SELESAI' ? '#4ADE80' : log.statusArmada === 'MENUNGGU_ACC_KEMBALI' ? '#F59E0B' : '#38BDF8',
                marginTop: 2
              }}
            >
              {log.statusArmada === 'SELESAI' ? 'COMPLETED' : log.statusArmada === 'MENUNGGU_ACC_KEMBALI' ? 'PENDING' : 'ACTIVE'}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #1E3A5F',
            display: 'flex',
            gap: 10,
            background: '#0B1120'
          }}
        >
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: 'transparent',
              color: '#38BDF8',
              border: '1.5px solid #1E3A5F',
              borderRadius: 10,
              padding: '10px',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <ExternalLink size={14} />
            <span>Buka Google Maps</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 0.7,
              background: '#1E293B',
              color: '#CBD5E1',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '10px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
