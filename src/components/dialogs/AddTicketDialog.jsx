import React, { useEffect, useState, useRef } from 'react'
import {
  X,
  Save,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Wrench,
  FileText,
  KeyRound,
  ChevronDown,
  AlertTriangle,
  HardHat,
  FileSpreadsheet,
  ChevronRight,
  Upload,
  Trash2,
  Paperclip,
  Image,
  Camera,
  AlertCircle,
  Send
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// Master Constants matching Jetpack Compose & FOSIS Android Specs
export const FOSIS_CONSTANTS = {
  MONTHS: [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ],
  YEARS: ['2023', '2024', '2025', '2026', '2027'],
  YEARS_TROUBLESHOOT: ['2023', '2024', '2025', '2026'],
  YEARS_MAINTENANCE: ['2024', '2025', '2026', '2027'],
  INFRA_CATEGORIES: ['Closure', 'Cable', 'Pole', 'Handhole', 'Manhole'],
  AKTIVITAS_CLOSURE: [
    'Splicing Tray Core',
    'Tray Cleaning & Sealing',
    'Closure Tray Repair',
    'Re-arranging Core Tray',
    'Closure Box Replacement'
  ],
  AKTIVITAS_KABEL: [
    'Drop Core Cable Pulling',
    'Aerial Cable Rectification',
    'FO Cable Route Relocation',
    'Spiral & Protection Sleeve Installation',
    'Cable Severance Splicing & Jointing'
  ],
  AKTIVITAS_TIANG: [
    'New Pole Installation',
    'Corroded Pole Replacement',
    'Pole Cable Dressing & Tying',
    'Pole Clamp & Bracket Mounting',
    'Pole Relocation for Road Widening'
  ],
  AKTIVITAS_HANDHOLE: [
    'Handhole Cleaning & Inspection',
    'Cable Slack Audit',
    'Subduct / Corrugated Pipe Dressing',
    'Handhole Cover Repair',
    'Water Drainage & Pumping'
  ],
  AKTIVITAS_MAINHOLE: [
    'Manhole Cleaning & Clearance',
    'HSE Hazardous Atmospheric Gas Check',
    'Trunk Cable Racking & Dressing',
    'Water & Sludge Extraction',
    'Cast Iron Cover Repair'
  ],
  ROOT_CAUSE_TROUBLESHOOT: [
    'VANDALISME',
    'GOVERNMENT PROJECT',
    'MAINTENANCE WINDOW',
    'CABLE',
    'DEVICE',
    'PORT',
    'ELECTRICITY',
    'FLAPPING',
    'SLOW CONNECTION',
    'PATH',
    'INTERMITTENT',
    'SUPPORT',
    'DIAL',
    'NATURAL DISASTERS',
    'HEAVY VEHICLES',
    'ANIMAL',
    'PACKET LOSS',
    'LOCAL ACTIVITY',
    'CUSTOMER SEGMENT',
    'NO ISSUE',
    'OTHER ISP PROJECT',
    'CONFIGURATION',
    '3RD PARTY ISSUE'
  ],
  IMPACT_TROUBLESHOOT: [
    'FO CUT',
    'PATCHCORE',
    'ONT',
    'UTP',
    'UPS',
    'CONVERTER',
    'ELECTRICITY',
    'BANDWIDTH',
    'BENDING',
    'ADAPTOR CONVERTER',
    'ROUTER',
    'ACCESS POINT',
    'NO IMPACT',
    'SFP',
    'SWITCH',
    'FLAPPING',
    'EXTENDER',
    'WALL JACK',
    'MIKROTIK',
    'CONNECTION',
    'ROSETTE',
    'BAD CORE',
    'RTO',
    'DPFO',
    'OTB',
    'PIGTAIL',
    'BARREL',
    'DEGRADE',
    'STB',
    'BAD SPLICE',
    'OLT'
  ],
  SERVICE_IMPACT_TROUBLESHOOT: [
    'BACKBONE',
    'LINE',
    'BROADBAND BUSINESS',
    'BROADBAND HOME',
    'DARK FIBER',
    'NET',
    'IPT',
    'CORE',
    'MANAGE SERVICE',
    'COLO',
    'NET FLEX',
    'IP PUBLIC',
    'IPLC',
    'MCIX',
    'IPT MAX',
    'DWDM',
    'TIE LINE',
    'EIPL',
    'DC TO DC',
    'IX'
  ],
  SLA_TROUBLESHOOT: [
    'IN SLA',
    'OVER SLA',
    'ON PROGRESS',
    'ON HOLD',
    'CANCEL',
    'NO SLA',
    'SUPPORT'
  ],
  CR_TROUBLESHOOT: ['DONE', 'ON PROGRESS', 'NO CR'],
  MITRA_TROUBLESHOOT: [
    'GENTRI',
    'FAMIKA',
    'SCKP',
    'INTERNAL',
    'BBS',
    'BWANA',
    'JATEK',
    'OLT',
    'BLAO',
    'TRP'
  ],
  CATEGORY_TROUBLESHOOT: [
    'DOWN',
    'SLOW CONNECTION',
    'UNSTABLE',
    'REQUEST INTERNAL',
    'REQUEST EXTERNAL'
  ],
  KEGIATAN_MAINTENANCE: [
    'MAINTENANCE OSP',
    'ACTIVATION BACKBONE OSP',
    'DATA CORE UPDATE',
    'VALIDATION',
    'STORING',
    'SUPPORT'
  ],
  REQUESTOR_MAINTENANCE: [
    'CLS',
    'PI',
    'NETPLAN',
    'SM',
    'SO',
    'SERDEL',
    'NAM',
    'POP',
    'DC',
    'NOC'
  ],
  STATUS_MAINTENANCE: [
    'DONE',
    'ON HOLD',
    'ON PROGRESS',
    'CONTINUE',
    'CANCEL'
  ],
  TASK_TYPE_MAINTENANCE: ['PLAN', 'UNPLAN'],
  TASK_ADMIN: ['REPORT', 'PERMIT', 'RECONCILIATION', 'TICKET', 'PURCHASING'],
  SUB_TASK_ADMIN: [
    'FINANCE', 'VENDOR', 'FAM', 'PROCUREMENT', 'EXTERNAL',
    'CUSTOMER CARE', 'CLS', 'NOC', 'SERDEL', 'NAM',
    'FIELD ENGINEER', 'PROJECT', 'MONTHLY', 'YEARLY', 'MIDDLE YEAR'
  ],
  SUB_TASK_1_ADMIN: [
    'TRAVEL REQUEST', 'CASH ADVANCE', 'PETTY CASH', 'VE MANAGED SERVICE',
    'VE MATERIAL', 'VE STOCK OPNAME', 'VE BAST', 'VE BAK', 'BAK',
    'MATERIAL', 'WORK PERMIT', 'OPEN TICKET', 'CLOSED TICKET',
    'RECTIFICATION', 'PROPOSAL', 'MEETING'
  ],
  VIA_ADMIN: ['WA', 'TEAMS', 'EMAIL', 'PORTAL', 'VISIT', 'HARDCOPY', 'SOFTCOPY'],
  STATUS_ADMIN: ['DONE', 'CONTINUE', 'ON HOLD', 'CANCEL'],
  KATEGORI_ADMIN: ['REQUEST INTERNAL', 'REQUEST EXTERNAL', 'REFUNDS'],
  ACTIVITY_ADMIN: [
    'SERVICE OPERATION', 'SERVICE MAINTENANCE', 'VENDOR',
    'REG. SURABAYA', 'REG. BANDUNG', 'ADMIN'
  ]
}

export default function AddTicketDialog({
  open,
  mode = 'create',
  ticketData = null,
  initialType = 'TROUBLESHOOT',
  startWithTypePicker = false,
  onClose,
  onSubmit
}) {
  const isEdit = mode === 'edit' && Boolean(ticketData)

  const [selectedType, setSelectedType] = useState(initialType)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('MARCH')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [isUrgent, setIsUrgent] = useState(false)

  // Objek Infrastruktur Lapangan FO
  const [infraCategory, setInfraCategory] = useState('Closure')
  const [infraActivity, setInfraActivity] = useState('Splicing Tray Core')

  // Material & OTDR
  const [materialUsed, setMaterialUsed] = useState('')
  const [otdrAttachments, setOtdrAttachments] = useState([])
  const [workPhotos, setWorkPhotos] = useState([])
  const fileInputRef = useRef(null)
  const { warning } = useToast()

  // Troubleshoot Parameters (Jetpack Compose / Image 3)
  const [rootCause, setRootCause] = useState(FOSIS_CONSTANTS.ROOT_CAUSE_TROUBLESHOOT[0])
  const [impact, setImpact] = useState(FOSIS_CONSTANTS.IMPACT_TROUBLESHOOT[0])
  const [serviceImpact, setServiceImpact] = useState(FOSIS_CONSTANTS.SERVICE_IMPACT_TROUBLESHOOT[0])
  const [slaStatus, setSlaStatus] = useState(FOSIS_CONSTANTS.SLA_TROUBLESHOOT[0])
  const [crStatus, setCrStatus] = useState(FOSIS_CONSTANTS.CR_TROUBLESHOOT[0])
  const [mitra, setMitra] = useState(FOSIS_CONSTANTS.MITRA_TROUBLESHOOT[0])
  const [category, setCategory] = useState(FOSIS_CONSTANTS.CATEGORY_TROUBLESHOOT[0])

  // Maintenance Parameters (Jetpack Compose / Image 1)
  const [kegiatan, setKegiatan] = useState(FOSIS_CONSTANTS.KEGIATAN_MAINTENANCE[0])
  const [requestor, setRequestor] = useState(FOSIS_CONSTANTS.REQUESTOR_MAINTENANCE[0])
  const [maintenanceStatus, setMaintenanceStatus] = useState(FOSIS_CONSTANTS.STATUS_MAINTENANCE[0])
  const [taskType, setTaskType] = useState(FOSIS_CONSTANTS.TASK_TYPE_MAINTENANCE[0])

  // Administrasi Parameters (Jetpack Compose / Image 2)
  const [tanggal, setTanggal] = useState(5)
  const [adminTask, setAdminTask] = useState(FOSIS_CONSTANTS.TASK_ADMIN[0])
  const [subTask, setSubTask] = useState(FOSIS_CONSTANTS.SUB_TASK_ADMIN[0])
  const [subTask1, setSubTask1] = useState(FOSIS_CONSTANTS.SUB_TASK_1_ADMIN[0])
  const [viaChannel, setViaChannel] = useState(FOSIS_CONSTANTS.VIA_ADMIN[0])
  const [adminStatus, setAdminStatus] = useState(FOSIS_CONSTANTS.STATUS_ADMIN[0])
  const [adminKategori, setAdminKategori] = useState(FOSIS_CONSTANTS.KATEGORI_ADMIN[0])
  const [adminActivity, setAdminActivity] = useState(FOSIS_CONSTANTS.ACTIVITY_ADMIN[0])

  // Common location & secret notes
  const [siteLocation, setSiteLocation] = useState('POP Surabaya Gubeng')
  const [secretNotes, setSecretNotes] = useState('')

  // Parameter Teknis Lapangan (Data Input & Data Output)
  const [redamanAwal, setRedamanAwal] = useState('-28.5 dBm')
  const [titikPutus, setTitikPutus] = useState('Core 4 (Tray 2)')
  const [redamanAkhir, setRedamanAkhir] = useState('-18.2 dBm')
  const [statusLink, setStatusLink] = useState('UP')

  useEffect(() => {
    if (open) {
      if (isEdit && ticketData) {
        setSelectedType(ticketData.type || initialType)
        setShowTypePicker(false)
        setTitle(ticketData.title || '')
        setSelectedMonth(ticketData.bulan || 'MARCH')
        setSelectedYear(String(ticketData.tahun || '2026'))
        setIsUrgent(Boolean(ticketData.urgent || ticketData.isUrgent))

        setInfraCategory(ticketData.infraCategory || ticketData.infra || 'Closure')
        setInfraActivity(ticketData.infraActivity || ticketData.detailAktivitas || 'Splicing Tray Core')

        setMaterialUsed(ticketData.materialUsed || ticketData.material || '')
        const rawOtdr = ticketData.otdrAttachments || ticketData.otdrPdfAttachments || ''
        if (Array.isArray(rawOtdr)) {
          setOtdrAttachments(rawOtdr)
        } else if (rawOtdr) {
          setOtdrAttachments(String(rawOtdr).split(';').map(x => x.trim()).filter(Boolean))
        } else {
          setOtdrAttachments([])
        }

        const rawPhotos = ticketData.workPhotos || []
        if (Array.isArray(rawPhotos)) {
          setWorkPhotos(rawPhotos)
        } else {
          setWorkPhotos([])
        }

        setRootCause(ticketData.rootCause || FOSIS_CONSTANTS.ROOT_CAUSE_TROUBLESHOOT[0])
        setImpact(ticketData.impact || FOSIS_CONSTANTS.IMPACT_TROUBLESHOOT[0])
        setServiceImpact(ticketData.serviceImpact || FOSIS_CONSTANTS.SERVICE_IMPACT_TROUBLESHOOT[0])
        setSlaStatus(ticketData.slaStatus || FOSIS_CONSTANTS.SLA_TROUBLESHOOT[0])
        setCrStatus(ticketData.crStatus || ticketData.changeRequest || FOSIS_CONSTANTS.CR_TROUBLESHOOT[0])
        setMitra(ticketData.mitra || FOSIS_CONSTANTS.MITRA_TROUBLESHOOT[0])
        setCategory(ticketData.category || FOSIS_CONSTANTS.CATEGORY_TROUBLESHOOT[0])

        let rawMnt = ticketData.maintenanceStatus || FOSIS_CONSTANTS.STATUS_MAINTENANCE[0]
        if (rawMnt === 'ON PROGRES') rawMnt = 'ON PROGRESS'
        setMaintenanceStatus(rawMnt)
        setTaskType(ticketData.taskType || FOSIS_CONSTANTS.TASK_TYPE_MAINTENANCE[0])

        setTanggal(ticketData.tanggal || 5)
        setAdminTask(ticketData.adminTask || ticketData.task || FOSIS_CONSTANTS.TASK_ADMIN[0])
        setSubTask(ticketData.subTask || FOSIS_CONSTANTS.SUB_TASK_ADMIN[0])
        setSubTask1(ticketData.subTask1 || FOSIS_CONSTANTS.SUB_TASK_1_ADMIN[0])
        setViaChannel(ticketData.viaChannel || ticketData.via || FOSIS_CONSTANTS.VIA_ADMIN[0])
        setAdminStatus(ticketData.adminStatus || ticketData.status || FOSIS_CONSTANTS.STATUS_ADMIN[0])
        setAdminKategori(ticketData.adminKategori || ticketData.kategori || FOSIS_CONSTANTS.KATEGORI_ADMIN[0])
        setAdminActivity(ticketData.adminActivity || ticketData.activity || FOSIS_CONSTANTS.ACTIVITY_ADMIN[0])

        setSiteLocation(ticketData.siteLocationName || ticketData.site || ticketData.siteLocation || '')
        setSecretNotes(ticketData.secretNotes || ticketData.notes || '')
        setRedamanAwal(ticketData.redamanAwal || '-28.5 dBm')
        setTitikPutus(ticketData.titikPutus || 'Core 4 (Tray 2)')
        setRedamanAkhir(ticketData.redamanAkhir || '-18.2 dBm')
        setStatusLink(ticketData.statusLink || 'UP')
      } else {
        setSelectedType(initialType)
        setShowTypePicker(false)
        setTitle('')
        setSelectedMonth('MARCH')
        setSelectedYear('2026')
        setIsUrgent(false)
        setInfraCategory('Closure')
        setInfraActivity('Splicing Tray Core')
        setMaterialUsed('')
        setOtdrAttachments([])
        setWorkPhotos([])
        setRedamanAwal('-28.5 dBm')
        setTitikPutus('Core 4 (Tray 2)')
        setRedamanAkhir('-18.2 dBm')
        setStatusLink('UP')
        setRootCause(FOSIS_CONSTANTS.ROOT_CAUSE_TROUBLESHOOT[0])
        setImpact(FOSIS_CONSTANTS.IMPACT_TROUBLESHOOT[0])
        setServiceImpact(FOSIS_CONSTANTS.SERVICE_IMPACT_TROUBLESHOOT[0])
        setSlaStatus(FOSIS_CONSTANTS.SLA_TROUBLESHOOT[0])
        setCrStatus(FOSIS_CONSTANTS.CR_TROUBLESHOOT[0])
        setMitra(FOSIS_CONSTANTS.MITRA_TROUBLESHOOT[0])
        setCategory(FOSIS_CONSTANTS.CATEGORY_TROUBLESHOOT[0])
        setKegiatan(FOSIS_CONSTANTS.KEGIATAN_MAINTENANCE[0])
        setRequestor(FOSIS_CONSTANTS.REQUESTOR_MAINTENANCE[0])
        setMaintenanceStatus(FOSIS_CONSTANTS.STATUS_MAINTENANCE[0])
        setTaskType(FOSIS_CONSTANTS.TASK_TYPE_MAINTENANCE[0])
        setTanggal(new Date().getDate())
        setAdminTask(FOSIS_CONSTANTS.TASK_ADMIN[0])
        setSubTask(FOSIS_CONSTANTS.SUB_TASK_ADMIN[0])
        setSubTask1(FOSIS_CONSTANTS.SUB_TASK_1_ADMIN[0])
        setViaChannel(FOSIS_CONSTANTS.VIA_ADMIN[0])
        setAdminStatus(FOSIS_CONSTANTS.STATUS_ADMIN[0])
        setAdminKategori(FOSIS_CONSTANTS.KATEGORI_ADMIN[0])
        setAdminActivity(FOSIS_CONSTANTS.ACTIVITY_ADMIN[0])
        setSiteLocation(initialType === 'ADMINISTRASI' ? '' : 'POP Surabaya Gubeng')
        setSecretNotes('')
      }
    }
  }, [open, isEdit, ticketData, initialType, startWithTypePicker])


  if (!open) return null

  const getActivitiesForCategory = (cat) => {
    switch (cat.toLowerCase()) {
      case 'closure':
        return FOSIS_CONSTANTS.AKTIVITAS_CLOSURE
      case 'kabel':
      case 'cable':
        return FOSIS_CONSTANTS.AKTIVITAS_KABEL
      case 'tiang':
      case 'pole':
        return FOSIS_CONSTANTS.AKTIVITAS_TIANG
      case 'handhole':
        return FOSIS_CONSTANTS.AKTIVITAS_HANDHOLE
      case 'mainhole':
      case 'manhole':
        return FOSIS_CONSTANTS.AKTIVITAS_MAINHOLE
      default:
        return []
    }
  }

  const handleInfraCategorySelect = (cat) => {
    setInfraCategory(cat)
    const acts = getActivitiesForCategory(cat)
    if (acts.length > 0) {
      setInfraActivity(acts[0])
      if (
        !title ||
        title.startsWith('Activity') ||
        title.startsWith('Rectification') ||
        title.startsWith('Splicing') ||
        title.startsWith('Cable Pulling') ||
        title.startsWith('Installation')
      ) {
        setTitle(`${acts[0]} ${cat}`)
      }
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = 5 - workPhotos.length
    if (remainingSlots <= 0) {
      warning('Maximum 5 job documentation photos allowed.')
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type.toLowerCase())) {
        warning(`Format ${file.name} is not supported. Use JPG, PNG, or WEBP.`)
        return
      }

      // Max 20 MB per file
      if (file.size > 20 * 1024 * 1024) {
        warning(`Size of ${file.name} exceeds 20 MB limit.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          // Resize with canvas to longest edge max 1920-2560px for smooth mobile/desktop storage
          const maxDimension = 1920
          let width = img.width
          let height = img.height

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)

          const newPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: file.size,
            sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            dataUrl: compressedDataUrl,
            timestamp: new Date().toISOString()
          }

          setWorkPhotos((prev) => {
            if (prev.length >= 5) return prev
            return [...prev, newPhoto]
          })
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (id) => {
    setWorkPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    // Date validation for Administrasi (including leap years)
    if (selectedType === 'ADMINISTRASI') {
      const monthIndexMap = {
        JANUARY: 0,
        FEBRUARY: 1,
        MARCH: 2,
        APRIL: 3,
        MAY: 4,
        JUNE: 5,
        JULY: 6,
        AUGUST: 7,
        SEPTEMBER: 8,
        OCTOBER: 9,
        NOVEMBER: 10,
        DECEMBER: 11
      }
      const mIdx = monthIndexMap[selectedMonth] ?? 0
      const yrNum = parseInt(selectedYear, 10) || new Date().getFullYear()
      const dayNum = parseInt(tanggal, 10)

      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        warning('Day date must be in range 1 to 31.')
        return
      }

      // Check days in that specific month and year
      const daysInMonth = new Date(yrNum, mIdx + 1, 0).getDate()
      if (dayNum > daysInMonth) {
        warning(`Date ${dayNum} is invalid for ${selectedMonth} ${yrNum} (maximum ${daysInMonth} days).`)
        return
      }
    }

    // Photo documentation validation
    if ((selectedType === 'TROUBLESHOOT' || selectedType === 'MAINTENANCE') && workPhotos.length === 0) {
      warning('At least 1 job photo documentation is required before submitting report.')
      return
    }

    let payload
    if (selectedType === 'ADMINISTRASI') {
      // Clean Administrasi Payload without technical default fictions
      const adminActCanonical = (adminActivity || '').toUpperCase() === 'LOGISTIK' ? 'LOGISTICS' : adminActivity

      payload = {
        type: 'ADMINISTRASI',
        title: title.trim(),
        tanggal: parseInt(tanggal, 10) || new Date().getDate(),
        bulan: selectedMonth,
        tahun: selectedYear,
        adminTask,
        subTask,
        subTask1,
        viaChannel,
        adminStatus,
        adminKategori,
        adminActivity: adminActCanonical,
        siteLocation: siteLocation ? siteLocation.trim() : '',
        siteLocationName: siteLocation ? siteLocation.trim() : '',
        site: siteLocation ? siteLocation.trim() : '',
        materialUsed: materialUsed || '',
        material: materialUsed || '',
        secretNotes: secretNotes || '',
        notes: secretNotes || '',
        urgent: isUrgent,
        isUrgent
      }
    } else {
      payload = {
        type: selectedType,
        title: title.trim(),
        bulan: selectedMonth,
        tahun: selectedYear,
        isUrgent,
        urgent: isUrgent,
        rootCause,
        impact,
        serviceImpact,
        slaStatus,
        crStatus,
        changeRequest: crStatus,
        mitra,
        category,
        kegiatan,
        requestor,
        maintenanceStatus,
        taskType,
        tanggal,
        adminTask,
        subTask,
        subTask1,
        viaChannel,
        adminStatus,
        adminKategori,
        adminActivity,
        siteLocation,
        siteLocationName: siteLocation,
        site: siteLocation,
        infra: infraCategory,
        detailAktivitas: infraActivity,
        infraCategory,
        infraActivity,
        material: materialUsed,
        materialUsed,
        redamanAwal,
        titikPutus,
        redamanAkhir,
        statusLink,
        otdrAttachments: otdrAttachments.join(';'),
        otdrPdfAttachments: otdrAttachments.join(';'),
        workPhotos,
        secretNotes,
        notes: secretNotes
      }
    }

    if (isEdit && ticketData) {
      payload.id = ticketData.id
      payload.ticketNo = ticketData.ticketNo
      // If previously rejected, editing moves ticket status back to Pending IC Verification
      const prevStatus = (ticketData.workflowStatus || '').toLowerCase()
      if (prevStatus.includes('ditolak') || prevStatus.includes('reject') || prevStatus.includes('revisi') || prevStatus.includes('revision')) {
        payload.workflowStatus = 'Pending IC Verification'
      }
    }

    const res = onSubmit?.(payload)
    if (res && res.success === false) {
      // Do not close dialog if submission failed
      return
    }
    // onClose is handled in onSubmit if successful
  }

  const openGoogleMaps = () => {
    window.open('https://maps.google.com/?q=-7.2575,112.7521', '_blank')
  }

  const handleAddOtdr = () => {
    if (otdrAttachments.length < 50) {
      const nextNum = otdrAttachments.length + 1
      const cleanSite = siteLocation.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `OTDR_Trace_${cleanSite || 'POP'}_Core${nextNum}.pdf`
      setOtdrAttachments((prev) => [...prev, fileName])
    }
  }

  const handleRemoveOtdr = (idx) => {
    setOtdrAttachments((prev) => prev.filter((_, i) => i !== idx))
  }


  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(860px, 94vw)',
          maxHeight: '90vh',
          borderRadius: 20,
          background: '#ffffff',
          boxShadow: '0 25px 60px rgba(15,23,42,0.22)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* SCREEN 1: MODUL TYPE PICKER */}
        {showTypePicker ? (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0F172A' }}>
                  FOSIS Operational Data Entry
                </h2>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>
                  Select operational module to input
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: '50%', color: '#64748B' }}
              >
                <X size={19} />
              </button>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 14 }}>
              Select Data Category
            </div>

            {/* Type Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Troubleshoot Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedType('TROUBLESHOOT')
                  setShowTypePicker(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  background: '#FEE2E2',
                  border: '1px solid rgba(153, 27, 27, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#991B1B',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    marginRight: 16,
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>Troubleshoot</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(153, 27, 27, 0.85)', marginTop: 2 }}>
                    Record network outages, root causes, SLA timers, service impacts, and resolutions.
                  </div>
                </div>
                <ChevronRight size={20} color="#991B1B" />
              </div>

              {/* Maintenance Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedType('MAINTENANCE')
                  setShowTypePicker(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  background: '#E0F2FE',
                  border: '1px solid rgba(7, 89, 133, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#075985',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    marginRight: 16,
                    flexShrink: 0
                  }}
                >
                  <HardHat size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#075985' }}>Maintenance</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(7, 89, 133, 0.85)', marginTop: 2 }}>
                    Log preventive maintenance tasks, requestors, completion status, and task types.
                  </div>
                </div>
                <ChevronRight size={20} color="#075985" />
              </div>

              {/* Administrasi Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedType('ADMINISTRASI')
                  setShowTypePicker(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  background: '#FEF3C7',
                  border: '1px solid rgba(146, 64, 14, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#92400E',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    marginRight: 16,
                    flexShrink: 0
                  }}
                >
                  <FileSpreadsheet size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>Administration</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(146, 64, 14, 0.85)', marginTop: 2 }}>
                    Log reports, permits, finance reconciliations, tasks, sub-tasks, and administrative ops.
                  </div>
                </div>
                <ChevronRight size={20} color="#92400E" />
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* SCREEN 2: FORM INPUT */
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
          >
            {/* Modal Header */}
            {(() => {
              const isRejectedEdit = isEdit && ((ticketData?.workflowStatus || '').toLowerCase().includes('ditolak') || (ticketData?.workflowStatus || '').toLowerCase().includes('reject') || (ticketData?.workflowStatus || '').toLowerCase().includes('revisi') || (ticketData?.workflowStatus || '').toLowerCase().includes('revision'))
              const isAdm = selectedType === 'ADMINISTRASI'

              let headerTitle = isEdit ? `Edit Ticket: ${ticketData?.ticketNo || ''}` : 'FOSIS Operational Data Entry'
              if (isAdm) {
                headerTitle = isEdit ? 'Edit FOSIS Administration' : 'FOSIS Administration Entry'
              }

              let headerSubtitle = isRejectedEdit
                ? 'Rectify technical data according to IC notes and resubmit for verification'
                : isAdm
                  ? 'Recording administrative activities, permits, coordination, and operational logistics.'
                  : 'Recording field operational work orders.'

              return (
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: isRejectedEdit ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isRejectedEdit ? '#FEF2F2' : '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: isRejectedEdit ? '#991B1B' : '#0F172A', letterSpacing: '-0.2px' }}>
                        {headerTitle}
                      </h2>
                      <span
                        style={{
                          background: isRejectedEdit
                            ? '#FEE2E2'
                            : selectedType === 'TROUBLESHOOT'
                              ? '#FEE2E2'
                              : selectedType === 'MAINTENANCE'
                                ? '#E0F2FE'
                                : '#FEF3C7',
                          color: isRejectedEdit
                            ? '#DC2626'
                            : selectedType === 'TROUBLESHOOT'
                              ? '#991B1B'
                              : selectedType === 'MAINTENANCE'
                                ? '#075985'
                                : '#92400E',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase'
                        }}
                      >
                        {isRejectedEdit ? 'REVISION REQUIRED (IC REJECTED)' : (selectedType === 'ADMINISTRASI' ? 'ADMINISTRATION' : selectedType)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isRejectedEdit ? '#B91C1C' : '#4F46E5', marginTop: 2 }}>
                      {headerSubtitle}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={onClose}
                      style={{ width: 32, height: 32, borderRadius: '50%', color: '#64748B' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Scrollable Form Body */}
            <div
              className="dialog-scroll-body"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                flex: 1
              }}
            >
              {/* Alert Penolakan IC */}
              {isEdit && ((ticketData?.workflowStatus || '').toLowerCase().includes('ditolak') || (ticketData?.workflowStatus || '').toLowerCase().includes('reject') || (ticketData?.workflowStatus || '').toLowerCase().includes('revisi') || (ticketData?.workflowStatus || '').toLowerCase().includes('revision')) && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #EF4444',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: '#991B1B' }}>
                    <AlertCircle size={16} color="#DC2626" />
                    <span>Rejection Notice from IC Team:</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.45, fontWeight: 500 }}>
                    {ticketData.revisionReason || ticketData.notes || 'Report rejected by IC Team. Please verify all technical parameters and job photo documentation.'}
                  </div>
                  {ticketData.revisionRequestedBy && (
                    <div style={{ fontSize: 10.5, color: '#991B1B', marginTop: 2 }}>
                      Rejected by: <strong>{ticketData.revisionRequestedBy}</strong>
                    </div>
                  )}
                </div>
              )}
              {/* Title / Description */}
              <div className="fosis-field-box">
                <label className="fosis-field-label">Work Title / Brief Job Description <span style={{ color: '#EF4444', fontWeight: 900 }}>*</span></label>
                <input
                  className="fosis-field-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Fiber Optic Cable Severance Splicing at Backbone Route"
                  style={{ fontSize: 13, fontWeight: 600 }}
                />
              </div>

              {/* Month & Year Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="fosis-field-box">
                  <label className="fosis-field-label">Month</label>
                  <div className="fosis-select-wrapper">
                    <select
                      className="fosis-field-input select-clean"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {FOSIS_CONSTANTS.MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="fosis-select-arrow" />
                  </div>
                </div>

                <div className="fosis-field-box">
                  <label className="fosis-field-label">Year</label>
                  <div className="fosis-select-wrapper">
                    <select
                      className="fosis-field-input select-clean"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {(selectedType === 'MAINTENANCE'
                        ? (FOSIS_CONSTANTS.YEARS_MAINTENANCE || ['2024', '2025', '2026', '2027'])
                        : selectedType === 'TROUBLESHOOT'
                          ? (FOSIS_CONSTANTS.YEARS_TROUBLESHOOT || ['2023', '2024', '2025', '2026'])
                          : FOSIS_CONSTANTS.YEARS
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="fosis-select-arrow" />
                  </div>
                </div>
              </div>

              {/* OBJEK INFRASTRUKTUR FO & AKTIVITAS LAPANGAN (Closure, Cable, Pole, Handhole, Manhole) */}
              {(selectedType === 'TROUBLESHOOT' || selectedType === 'MAINTENANCE') && (
                <div
                  style={{
                    border: '1.5px solid #CBD5E1',
                    background: '#F1F5F9',
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 800, color: '#334155' }}>
                      <Wrench size={16} color="#4F46E5" />
                      <span>FO Field Infrastructure Element <span style={{ color: '#EF4444', fontWeight: 900 }}>*</span></span>
                    </div>
                    <span
                      style={{
                        background: '#EEF2FF',
                        color: '#4338CA',
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 9px',
                        borderRadius: 6,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {infraCategory}
                    </span>
                  </div>

                  {/* 5 Segmented Filter Chips */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      paddingBottom: 4
                    }}
                  >
                    {FOSIS_CONSTANTS.INFRA_CATEGORIES.map((cat) => {
                      const isSelected = infraCategory.toLowerCase() === cat.toLowerCase()
                      const emoji =
                        cat.toLowerCase() === 'closure'
                          ? '🔌'
                          : cat.toLowerCase() === 'kabel' || cat.toLowerCase() === 'cable'
                            ? '🧵'
                            : cat.toLowerCase() === 'tiang' || cat.toLowerCase() === 'pole'
                              ? '🗼'
                              : cat.toLowerCase() === 'handhole'
                                ? '🕳️'
                                : '🏢'
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleInfraCategorySelect(cat)}
                          style={{
                            border: isSelected ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                            background: isSelected ? '#EFF6FF' : '#ffffff',
                            color: isSelected ? '#1D4ED8' : '#334155',
                            borderRadius: 10,
                            padding: '8px 12px',
                            fontSize: 11.5,
                            fontWeight: isSelected ? 800 : 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{emoji}</span>
                          <span>{cat}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Quick Activity Suggestion Chips */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Recommended Activity for {infraCategory}:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {getActivitiesForCategory(infraCategory).map((act) => {
                        const isActSelected = infraActivity === act
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => {
                              setInfraActivity(act)
                              setTitle(`${act} (${infraCategory})`)
                            }}
                            style={{
                              background: isActSelected ? '#E0E7FF' : '#ffffff',
                              border: isActSelected ? '1.5px solid #6366F1' : '1px solid #CBD5E1',
                              color: isActSelected ? '#3730A3' : '#334155',
                              fontSize: 10.5,
                              fontWeight: isActSelected ? 700 : 500,
                              padding: '5px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {act}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Detail Aktivitas Pada Objek */}
                  <div className="fosis-field-box" style={{ background: '#ffffff' }}>
                    <label className="fosis-field-label">Activity Details on {infraCategory}</label>
                    <input
                      className="fosis-field-input"
                      value={infraActivity}
                      onChange={(e) => setInfraActivity(e.target.value)}
                      placeholder="Example: Splicing 12-core tray, tray cleaning and sealing..."
                      style={{ fontSize: 12.5, fontWeight: 600 }}
                    />
                  </div>
                </div>
              )}

              {/* TYPE SPECIFIC SECTION: TROUBLESHOOT */}
              {selectedType === 'TROUBLESHOOT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#4338CA',
                      letterSpacing: '-0.1px'
                    }}
                  >
                    Troubleshoot Parameters:
                  </div>

                  {/* Root Cause Dropdown */}
                  <div className="fosis-field-box">
                    <label className="fosis-field-label">Root Cause</label>
                    <div className="fosis-select-wrapper">
                      <select
                        className="fosis-field-input select-clean"
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        style={{ fontWeight: 700 }}
                      >
                        {FOSIS_CONSTANTS.ROOT_CAUSE_TROUBLESHOOT.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="fosis-select-arrow" />
                    </div>
                  </div>

                  {/* Impact & Service Impact */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Impact</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={impact}
                          onChange={(e) => setImpact(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.IMPACT_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Service Impact</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={serviceImpact}
                          onChange={(e) => setServiceImpact(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.SERVICE_IMPACT_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  {/* Status SLA & Change Request (CR) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">SLA Status</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={slaStatus}
                          onChange={(e) => setSlaStatus(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.SLA_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Change Request (CR)</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={crStatus}
                          onChange={(e) => setCrStatus(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.CR_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  {/* Partner & Outage Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Partner / Vendor</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={mitra}
                          onChange={(e) => setMitra(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.MITRA_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Outage Category</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.CATEGORY_TROUBLESHOOT.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE SPECIFIC SECTION: MAINTENANCE */}
              {selectedType === 'MAINTENANCE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#075985',
                      letterSpacing: '-0.1px'
                    }}
                  >
                    Maintenance Parameters:
                  </div>

                  {/* Kegiatan Dropdown */}
                  <div className="fosis-field-box">
                    <label className="fosis-field-label">Activity</label>
                    <div className="fosis-select-wrapper">
                      <select
                        className="fosis-field-input select-clean"
                        value={kegiatan}
                        onChange={(e) => setKegiatan(e.target.value)}
                        style={{ fontWeight: 700 }}
                      >
                        {FOSIS_CONSTANTS.KEGIATAN_MAINTENANCE.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="fosis-select-arrow" />
                    </div>
                  </div>

                  {/* Requestor & Status Maintenance */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Requestor</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={requestor}
                          onChange={(e) => setRequestor(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.REQUESTOR_MAINTENANCE.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Maintenance Status</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={maintenanceStatus}
                          onChange={(e) => setMaintenanceStatus(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.STATUS_MAINTENANCE.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  {/* Task Type (PLAN / UNPLAN) */}
                  <div className="fosis-field-box">
                    <label className="fosis-field-label">Task Type (PLAN / UNPLAN)</label>
                    <div className="fosis-select-wrapper">
                      <select
                        className="fosis-field-input select-clean"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        style={{ fontWeight: 700 }}
                      >
                        {FOSIS_CONSTANTS.TASK_TYPE_MAINTENANCE.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="fosis-select-arrow" />
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE SPECIFIC SECTION: ADMINISTRASI */}
              {selectedType === 'ADMINISTRASI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#92400E',
                      letterSpacing: '-0.1px'
                    }}
                  >
                    Administration Parameters:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Day Date (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="fosis-field-input"
                        value={tanggal}
                        onChange={(e) => setTanggal(parseInt(e.target.value, 10) || 1)}
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Primary Task</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={adminTask}
                          onChange={(e) => setAdminTask(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.TASK_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Sub Task</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={subTask}
                          onChange={(e) => setSubTask(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.SUB_TASK_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Sub Task 1</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={subTask1}
                          onChange={(e) => setSubTask1(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.SUB_TASK_1_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Communication Channel</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={viaChannel}
                          onChange={(e) => setViaChannel(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.VIA_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Status</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.STATUS_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Category</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={adminKategori}
                          onChange={(e) => setAdminKategori(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.KATEGORI_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Activity</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={adminActivity}
                          onChange={(e) => setAdminActivity(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          {FOSIS_CONSTANTS.ACTIVITY_ADMIN.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* COMMON FIELDS: GPS LOCK & SITE LOCATION                     */}
              {/* ============================================================ */}
              {/* ============================================================ */}
              {/* COMMON FIELDS: GPS LOCK & SITE LOCATION                     */}
              {/* ============================================================ */}
              {selectedType !== 'ADMINISTRASI' && (
                <div
                  style={{
                    background: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: '#14532D' }}>
                      <ShieldCheck size={16} color="#15803D" />
                      <span>GPS LOCK : LOCATION AUTOMATICALLY PINNED</span>
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: '#166534', letterSpacing: '0.2px' }}>
                      GPS SENSOR ACTIVE
                    </span>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#166534', lineHeight: 1.4 }}>
                    Coordinates locked at input: -7.2575, 112.7521 (High Precision Device Accuracy)
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={openGoogleMaps}
                      style={{
                        background: '#1E88E5',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={12} />
                      <span>Open in Google Maps</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Location Site POP Field */}
              <div className="fosis-field-box">
                <label className="fosis-field-label">
                  {selectedType === 'ADMINISTRASI' ? (
                    'Associated Site / Location (Optional)'
                  ) : (
                    <>
                      Site / Field POP Location <span style={{ color: '#EF4444', fontWeight: 900 }}>*</span>
                    </>
                  )}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                  <MapPin size={18} color="#475569" style={{ flexShrink: 0 }} />
                  <input
                    className="fosis-field-input"
                    required={selectedType !== 'ADMINISTRASI'}
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder={selectedType === 'ADMINISTRASI' ? 'Leave blank if not site specific' : 'POP Surabaya Gubeng'}
                    style={{ fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Urgent Priority Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 2px',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  style={{ width: 17, height: 17, cursor: 'pointer', accentColor: '#DC2626' }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isUrgent ? 800 : 600,
                    color: isUrgent ? '#DC2626' : '#334155'
                  }}
                >
                  {selectedType === 'ADMINISTRASI'
                    ? 'Administrative Priority (Critical Document/Logistics)'
                    : 'Mark as Urgent Assignment (Real-Time Notification)'}
                </span>
              </label>

              {/* Technical Parameters */}
              {(selectedType === 'TROUBLESHOOT' || selectedType === 'MAINTENANCE') && (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B' }}>
                    Field Technical Parameters & Execution Results:
                  </div>

                  {/* Initial Loss & Break Point */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Initial Loss (dBm) - Input Data</label>
                      <input
                        className="fosis-field-input"
                        value={redamanAwal}
                        onChange={(e) => setRedamanAwal(e.target.value)}
                        placeholder="-28.5 dBm"
                        style={{ fontSize: 12.5, fontWeight: 600 }}
                      />
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Break Point / Core - Input Data</label>
                      <input
                        className="fosis-field-input"
                        value={titikPutus}
                        onChange={(e) => setTitikPutus(e.target.value)}
                        placeholder="Core 4 (Tray 2)"
                        style={{ fontSize: 12.5, fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  {/* Final Loss & Link Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Final Loss (dBm) - Output Data</label>
                      <input
                        className="fosis-field-input"
                        value={redamanAkhir}
                        onChange={(e) => setRedamanAkhir(e.target.value)}
                        placeholder="-18.2 dBm"
                        style={{ fontSize: 12.5, fontWeight: 600 }}
                      />
                    </div>

                    <div className="fosis-field-box">
                      <label className="fosis-field-label">Link Status - Output Data</label>
                      <div className="fosis-select-wrapper">
                        <select
                          className="fosis-field-input select-clean"
                          value={statusLink}
                          onChange={(e) => setStatusLink(e.target.value)}
                          style={{ fontWeight: 700 }}
                        >
                          <option value="UP">LINK UP (NORMAL)</option>
                          <option value="DOWN">LINK DOWN</option>
                          <option value="DEGRADED">DEGRADED</option>
                        </select>
                        <ChevronDown size={15} className="fosis-select-arrow" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Material Used */}
              {(selectedType !== 'ADMINISTRASI' ||
                adminActivity === 'LOGISTIK' ||
                adminActivity === 'LOGISTICS' ||
                subTask1 === 'MATERIAL' ||
                Boolean(materialUsed && materialUsed.trim())) && (
                  <div className="fosis-field-box">
                    <label className="fosis-field-label">
                      {selectedType === 'ADMINISTRASI'
                        ? 'Administrative Materials / Spare Parts Detail'
                        : 'Consumed Materials / Spare Parts (Output Data)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 4 }}>
                      <Wrench size={16} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
                      <textarea
                        rows={2}
                        className="fosis-field-input"
                        value={materialUsed}
                        onChange={(e) => setMaterialUsed(e.target.value)}
                        placeholder={
                          selectedType === 'ADMINISTRASI'
                            ? 'Specify logistics material details (e.g. Patchcord SC-LC 5m, SFP 10G ER, OTB 24 Core...)'
                            : 'Specify material details (e.g. Patchcord SC-LC 5m, SFP 10G ER, OTB 24 Core, Protection Sleeve...)'
                        }
                        style={{ resize: 'vertical', fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

              {/* OTDR Measurement Results */}
              {selectedType !== 'ADMINISTRASI' && (
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#15803D' }}>
                      <FileText size={18} color="#16A34A" />
                      <span>OTDR Measurement Results (PDF Format)</span>
                    </div>
                    <span
                      style={{
                        background: otdrAttachments.length >= 50 ? '#FEE2E2' : '#DCFCE7',
                        color: otdrAttachments.length >= 50 ? '#DC2626' : '#166534',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      {otdrAttachments.length} / 50 PDF
                    </span>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#166534' }}>
                    Maximum 50 PDF attachments of optical fiber OTDR trace reports.
                  </div>

                  {/* Attached Files List */}
                  {otdrAttachments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {otdrAttachments.slice(0, 5).map((fileName, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            background: '#ffffff',
                            borderRadius: 6,
                            border: '1px solid #86EFAC'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#14532D' }}>
                            <Paperclip size={14} color="#16A34A" />
                            <span>{fileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOtdr(idx)}
                            style={{
                              background: 'transparent',
                              border: 0,
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                              padding: 2
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {otdrAttachments.length > 5 && (
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D' }}>
                          ... and {otdrAttachments.length - 5} other OTDR PDF files
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload & Clear Buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleAddOtdr}
                      disabled={otdrAttachments.length >= 50}
                      style={{
                        background: '#16A34A',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: otdrAttachments.length >= 50 ? 'not-allowed' : 'pointer',
                        opacity: otdrAttachments.length >= 50 ? 0.6 : 1
                      }}
                    >
                      <Upload size={14} />
                      <span>+ Add OTDR File (PDF)</span>
                    </button>

                    {otdrAttachments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setOtdrAttachments([])}
                        style={{
                          background: '#ffffff',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Job Photos */}
              {(selectedType === 'TROUBLESHOOT' || selectedType === 'MAINTENANCE') && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 12,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1E293B' }}>
                      <Camera size={18} color="#4B45F5" />
                      <span>Job Photo Documentation <span style={{ color: '#EF4444', fontWeight: 900 }}>*</span></span>
                    </div>
                    <span
                      style={{
                        background: workPhotos.length >= 5 ? '#FEE2E2' : workPhotos.length > 0 ? '#DCFCE7' : '#F1F5F9',
                        color: workPhotos.length >= 5 ? '#DC2626' : workPhotos.length > 0 ? '#166534' : '#475569',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      {workPhotos.length} / 5 Photos
                    </span>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#64748B' }}>
                    Maximum 5 documentation photos (JPG/JPEG/PNG/WEBP, max 20 MB/photo). At least 1 photo is required.
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />

                  {/* Photo Thumbnails Grid */}
                  {workPhotos.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 10,
                        marginTop: 4
                      }}
                    >
                      {workPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <div style={{ width: '100%', height: 90, background: '#F1F5F9', position: 'relative' }}>
                            <img
                              src={photo.dataUrl}
                              alt={photo.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              title="Delete Photo"
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'rgba(220, 38, 38, 0.9)',
                                border: 'none',
                                color: '#FFFFFF',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div style={{ padding: '6px 8px' }}>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#1E293B',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={photo.name}
                            >
                              {photo.name}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>
                              {photo.sizeFormatted}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={workPhotos.length >= 5}
                      style={{
                        background: workPhotos.length >= 5 ? '#E2E8F0' : '#4B45F5',
                        color: workPhotos.length >= 5 ? '#94A3B8' : '#ffffff',
                        border: 0,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: workPhotos.length >= 5 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Image size={14} />
                      <span>+ Add Job Photo</span>
                    </button>

                    {workPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setWorkPhotos([])}
                        style={{
                          background: '#ffffff',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="fosis-field-box">
                <label className="fosis-field-label">
                  {selectedType === 'ADMINISTRASI' ? 'Administration Notes' : 'Field Operational Notes'}
                </label>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 4 }}>
                  <KeyRound size={16} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <textarea
                    rows={selectedType === 'ADMINISTRASI' ? 3 : 2}
                    className="fosis-field-input"
                    value={secretNotes}
                    onChange={(e) => setSecretNotes(e.target.value)}
                    placeholder={
                      selectedType === 'ADMINISTRASI'
                        ? 'Document progress, vendor coordination, BAST numbers or status, reconciliation, obstacles and follow-up actions...'
                        : 'Port configuration, optic measurement, switch technical notes...'
                    }
                    style={{ resize: 'vertical', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer Action Buttons */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: 12,
                background: '#ffffff',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              {(() => {
                const isRejectedTicket =
                  isEdit &&
                  ticketData &&
                  ((ticketData.workflowStatus || '').toLowerCase().includes('ditolak') ||
                    (ticketData.workflowStatus || '').toLowerCase().includes('reject') ||
                    (ticketData.workflowStatus || '').toLowerCase().includes('revisi') ||
                    (ticketData.workflowStatus || '').toLowerCase().includes('revision'))

                return (
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    style={{
                      flex: 1.4,
                      padding: '11px',
                      borderRadius: 12,
                      border: 'none',
                      background: !title.trim()
                        ? '#E2E8F0'
                        : isRejectedTicket
                          ? '#2563EB'
                          : '#4F46E5',
                      color: title.trim() ? '#ffffff' : '#94A3B8',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: title.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: title.trim()
                        ? isRejectedTicket
                          ? '0 4px 14px rgba(37, 99, 235, 0.3)'
                          : '0 4px 14px rgba(79, 70, 229, 0.3)'
                        : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isRejectedTicket ? <Send size={16} /> : <Save size={16} />}
                    <span>{isRejectedTicket ? 'Submit Revision' : 'Save Data'}</span>
                  </button>
                )
              })()}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
