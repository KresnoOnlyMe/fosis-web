# FOSIS Frontend Design System

## 1. Purpose
This document is the visual and interaction source of truth for the FOSIS Web Ops frontend.

FOSIS is an internal enterprise operational system for field operations. The interface must feel professional, structured, efficient, data-dense, and suitable for daily operational work.

Functional and role requirements remain governed by the SRS.

## 2. Product Character
FOSIS UI must feel:
- Enterprise
- Operational
- Professional
- Trustworthy
- Data-dense
- Clean
- Desktop-first
- Role-aware
- Efficient for repetitive daily work

FOSIS is NOT:
- A marketing website
- An AI product interface
- A futuristic dashboard
- A social-media style application
- A decorative analytics showcase

Every visible element must have a clear operational purpose.

## 3. Core Design Principles
1. Function before decoration.
2. Important operational information must be scannable in seconds.
3. Role determines what information and actions are visible.
4. Use desktop space efficiently.
5. Avoid unnecessary cards and nested containers.
6. Use consistent spacing, typography, radius, and status colors.
7. Prefer tables, structured rows, segmented controls, and compact panels for operational data.
8. Reuse existing components before creating new ones.
9. Do not create fake statistics or decorative charts.
10. Preserve consistency across Dashboard, Troubleshoot, Maintenance, SIK, Administration, Workflow, Vehicle, Chat, and Team Access.

## 4. Supported Viewports
Primary desktop targets:
- 1920 × 1080
- 1600 × 900
- 1440 × 900
- 1366 × 768
- 1280 × 720

Minimum supported desktop width:
- 1024px

The application may stack selected sections on smaller desktop widths, but it must never look like a stretched mobile interface.

## 5. Color System
Use the Stitch visual direction as the base.

### Brand
```css
--color-primary: #4B45F5;
--color-secondary: #2E90FA;
--color-tertiary: #12B76A;
--color-neutral: #101828;
```

### Application Surfaces
```css
--bg-app: #F6F7F9;
--bg-surface: #FFFFFF;
--bg-subtle: #F9FAFB;
--bg-sidebar: #102D63;

--border-subtle: #E4E7EC;
--border-strong: #D0D5DD;

--text-primary: #101828;
--text-secondary: #344054;
--text-muted: #667085;
--text-on-dark: #FFFFFF;
```

### Status
```css
--status-success: #12B76A;
--status-warning: #F79009;
--status-danger: #F04438;
--status-info: #2E90FA;
```

Do not introduce additional accent colors unless there is a clear semantic need.

## 6. Typography
Use a modern neutral sans-serif typeface.

Recommended scale:
- Page title: 24–28px / 700
- Section title: 15–17px / 600–700
- Body: 13–14px / 400–500
- Table: 13px / 400–600
- Caption: 11–12px / 400–500
- Metric value: 24–30px / 700

Avoid oversized headings.

## 7. Spacing
Use this spacing scale:
- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px

Avoid arbitrary spacing values where an existing token can be used.

## 8. Radius and Elevation
Recommended radius:
- Input: 8px
- Button: 8–10px
- Small card/panel: 10–12px
- Large modal: 12–16px

Do not use 24–32px radius on normal enterprise components.

Use borders as the primary separation method.
Shadows must be minimal.

Avoid:
- Glow
- Heavy shadows
- Glassmorphism
- Floating decorative cards

## 9. Icons
Use Lucide-style line icons.

Icons must be functional, not decorative.

Recommended icon sizes:
- Sidebar: 18–20px
- Button: 16–18px
- Inline action: 14–16px
- Metric icon: max. 20px

Do not use emoji as interface icons.

## 10. Sidebar
Desktop sidebar:
- Expanded width: 248px
- Collapsed width: 76px
- Background: deep navy
- Text: white / muted blue-white
- Active item: lighter navy/blue surface with clear contrast

Navigation groups:

### OVERVIEW
- Dashboard

### OPERATION
- Troubleshoot
- Maintenance
- Perijinan SIK
- Administrasi

### CONTROL
- Alur Kerja
- Kendaraan
- Chat Lapangan

### MANAGEMENT
- Akses Tim

Only render modules permitted for the active role.

The bottom account area may show:
- Initial/avatar
- Name
- Role
- Logout/expand action

## 11. Top Bar
Recommended height:
- 64–68px

Contains only relevant operational context:
- Sidebar collapse button
- Current page title
- Product subtitle / breadcrumb when useful
- Online status
- Sync state if relevant
- Running jobs when relevant
- Notification
- User profile

Keep it compact.
Do not overload the top bar with decorative badges.

## 12. Role Model
Primary FOSIS operational roles:
1. Field Engineer / Teknisi
2. Team Leader / IC
3. FE Admin
4. Department Head

For the current frontend, FE Admin functions as Super Admin.

Role visibility must be implemented through the existing permission/role helper wherever possible.

Do not create independent visual systems for each role. The same design system must adapt by showing or removing relevant modules and actions.

## 13. Role Visibility Summary

### Field Engineer / Teknisi
May use:
- Own operational tasks
- Troubleshoot/Maintenance input
- LHP/work documentation
- Work Photos
- Own workflow submission
- Personal KPI where applicable

Must not see:
- Global audit activity
- Super Admin export tools
- Global user-management controls

### Team Leader / IC
May use:
- Verification queue
- Relevant operational data
- Verify
- Return for Revision
- Team/module performance according to existing scope

Must not see:
- Global Recent Operational Activity
- Admin Lock controls
- Super Admin-only export

### FE Admin / Super Admin
May use:
- All operational modules
- Administration
- Lock/Unlock
- Export Data Operasional
- Recent Operational Activity
- User management
- Full Engineer KPI
- Audit-oriented frontend views

### Department Head
May use:
- Ringkasan Operasional
- KPI Kinerja Engineer
- Executive metrics
- Read operational data
- Managerial comment/approval according to current workflow

Must not see:
- Global Recent Operational Activity

## 14. Dashboard Architecture
Dashboard has exactly two main modes:
1. **Ringkasan Operasional**
2. **KPI Kinerja Engineer**

Use a compact segmented switch.

Example:
```text
[ Ringkasan Operasional ] [ KPI Kinerja Engineer ]
```

Do not create a third dashboard mode.

## 15. Dashboard — Important Change
The Dashboard MUST NOT display the geolocation/map panel.

Remove from Dashboard:
- Live Geolocation & Armada Radar
- Dashboard map
- Armada radar preview

Vehicle/location mapping may remain inside the dedicated Vehicle module if it is operationally useful there.

Do not show the map in either:
- Ringkasan Operasional
- KPI Kinerja Engineer

This gives more space to actionable operational information.

## 16. Ringkasan Operasional
Purpose:
> System-level operational overview.

### A. Page Header
Title:
**Dashboard Operasional**

Subtitle:
**Ringkasan operasional dan performa Field Engineer.**

Below header:
```text
[ Ringkasan Operasional ] [ KPI Kinerja Engineer ]
```

### B. Operational Summary Metrics
Use compact metric cards.

Recommended metrics:
- Total Tiket
- Active Work
- Waiting Verification
- SLA Compliance
- MTTR
- Maintenance Completion

Maximum 4–6 visible summary cards in one section.

Do not create fake values.
If data is unavailable, display `-`.

### C. Priority / Urgent Assignment
A compact operational alert panel is allowed when there is a real urgent assignment.

Display:
- Priority/status
- Ticket number
- Work title
- Location
- PIC
- CTA

Example CTA:
**Inspeksi Sekarang**

Do not show an urgent banner when no urgent item exists.

## 17. Admin Ringkasan Operasional Layout
For FE Admin / Super Admin, use a two-column operational section.

Recommended ratio:
- Left: 62–66%
- Right: 34–38%

### Left Column
Use for operational intelligence such as:
- Workflow Status
- Ticket Distribution
- SLA Overview
- Workload Overview
- Pending Verification / Lock Queue

Prefer one useful chart or structured table over multiple decorative charts.

### Right Column
Top:
**Export Data Operasional**

Bottom:
**Recent Operational Activity**

Example:
```text
┌────────────────────────────────┬────────────────────────┐
│ Operational Analytics          │ Export Data            │
│ Workflow / SLA / Workload      │ Operasional            │
│                                ├────────────────────────┤
│                                │ Recent Operational     │
│                                │ Activity               │
└────────────────────────────────┴────────────────────────┘
```

Do not leave a blank area previously used by the map.

## 18. Export Data Operasional
Visible only on:
- FE Admin / Super Admin
- Ringkasan Operasional

Do not show it on KPI Kinerja Engineer.

Content:
Title:
**Export Data Operasional**

Subtitle:
**Pilih periode dan format laporan**

Period segmented control:
- Semua
- Mingguan
- Bulanan

Formats:
- Excel
- PDF
- PPT

Buttons must be compact.

Recommended semantic accents:
- Excel: subtle green
- PDF: subtle red
- PPT: subtle orange

Do not use oversized saturated buttons.
If a format is not implemented, render it disabled instead of faking success.

## 19. Recent Operational Activity
Visible only on:
- FE Admin / Super Admin
- Ringkasan Operasional

Never show it for:
- Teknisi
- Team Leader / IC
- Department Head
- KPI Kinerja Engineer

Use compact activity rows.

Each row may contain:
- Main activity description
- Actor
- Role/module if useful
- Timestamp
- Small action chip

Examples:
- LOGIN
- LOGOUT
- CREATE
- UPDATE
- SUBMIT
- VERIFY
- REVISION
- LOCK
- UNLOCK
- APPROVE
- REJECT
- EXPORT

Use internal vertical scroll when necessary.
Avoid card-inside-card styling.

## 20. Non-Admin Ringkasan Operasional
When Admin-only sections are removed:
- Do not render blank containers.
- Do not reserve empty columns.
- Rebalance the layout automatically.

Use available space for role-relevant information already supported by the application.

## 21. KPI Kinerja Engineer
Purpose:
> Personnel performance analytics.

This view MUST NOT contain:
- Map
- Armada Radar
- Export Data Operasional
- Recent Operational Activity
- Login/Logout audit feed

Recommended header:
**KPI Kinerja Engineer**

Subtitle:
**Matriks produktivitas dan kepatuhan SLA personel lapangan.**

## 22. KPI Summary
Recommended metrics:
- Total Personel
- Average SLA
- Top Resolver
- Total Ticket

Use real calculated data only.

## 23. KPI Filter Bar
Use one compact horizontal toolbar.

Recommended controls:
- Search Engineer
- Module
- Month
- Year
- Reset

Module options:
- Semua Modul
- Troubleshoot
- Maintenance
- Administrasi

Avoid placing each filter inside a separate card.

## 24. Engineer Performance Table
Primary desktop component.

Recommended columns:
- Engineer
- Role
- Tickets
- Troubleshoot
- Maintenance
- Administrasi
- SLA
- Resolution Rate
- Performance

Engineer identity cell:
- Initial avatar
- Name
- Small email

Use:
- Sticky header
- Compact rows
- Subtle hover
- Right-aligned numeric data when appropriate
- Small status/performance indicators

## 25. Engineer Detail
Clicking an engineer may open a desktop modal or side panel.

Recommended sections:
- Overview
- Ticket History
- SLA Trend
- Module Distribution
- Recent Work

Do not create a giant profile card.

## 26. Operational Module Cards
A compact shortcut area may be used below the main operational summary.

Recommended modules:
- Troubleshoot
- Maintenance
- Licensing / SIK
- Administration

Each module card should contain:
- Functional icon
- Module name
- Short operational description
- Chevron/action indication

Keep cards compact.
Do not use them as oversized promotional cards.

## 27. Troubleshoot and Maintenance
List page structure:
1. Page header
2. Primary action
3. Search/filter toolbar
4. Compact operational table/list
5. Pagination when needed

Primary actions:
- + Tambah Troubleshoot
- + Tambah Maintenance

## 28. Add/Edit Ticket Form
Use a large desktop modal.

Recommended width:
- 800–900px

Use a 2-column field layout where appropriate.

Recommended sections:
1. Basic Information
2. Operational Detail
3. Location
4. Material
5. OTDR
6. Foto Pekerjaan
7. Signature
8. Notes

Do not wrap every individual input in a card.

## 29. Foto Pekerjaan
Place directly below:
**Hasil Ukur OTDR (Format PDF)**

Title:
**Foto Pekerjaan**

Rules:
- Maximum 5 photos
- Maximum 20 MB per input photo
- JPG
- JPEG
- PNG
- WEBP

Recommended UI:
```text
Foto Pekerjaan                                   2 / 5

[ Thumbnail ] [ Thumbnail ] [ + Tambah Foto ]
```

Each thumbnail shows:
- Preview
- Short filename
- File size
- Remove action

When 5 photos are selected:
- Disable Add Foto

Minimum 1 photo is required before Technician submission.

Validation:
**Foto dokumentasi pekerjaan wajib dilampirkan sebelum laporan dikirim.**

Do not use a giant upload dropzone.

## 30. Work Photo Optimization
Frontend may resize/compress selected images.

Recommended target:
- 1–3 MB per photo
- Longest edge approximately 1920–2560px

Do not store image binary data in localStorage.

If frontend persistence is required, prefer IndexedDB.

## 31. Workflow
Visual workflow:
```text
Teknisi
   ↓
Team Leader / IC
   ↓
FE Admin
   ↓
Dept Head
```

Common statuses:
- Draft
- Waiting Verification
- Revision Required
- Verified
- Locked
- Approved
- Rejected

Use a compact progress indicator.

Only show actions relevant to the active role and status.

IC actions:
- Verify
- Return for Revision

FE Admin actions:
- Lock
- Unlock

Dept Head:
- Comment
- Approve according to current frontend workflow

## 32. Ticket Detail
Recommended desktop layout:
- Large modal or side drawer
- 800–960px

Header:
- Ticket type
- Ticket number
- Title
- Status

Directly below:
- Workflow progress

Main body:

### Left ~65%
- Basic Information
- Technical Detail
- Location
- Material
- OTDR
- Work Photos

### Right ~35%
- Workflow
- Actions
- Signature
- Approval
- History

Use thumbnails for work photos.

## 33. Administration
Recommended tabs:
- Tabel Matriks
- Daftar Tiket & Berkas
- Inventaris Material

Use compact enterprise tables.

Recommended filters:
- Search
- Month
- Year
- Task
- Status
- Category
- Activity

## 34. Surat Ijin Document Preview
When user clicks **SURAT IJIN**, display a printable A4 document preview.

Visual direction:
- Dark/medium blue official header
- Thin orange accent
- Structured information rows
- White A4 surface
- Four approval blocks
- Professional internal telecom document style

Dynamic fields:
- Nomor Tiket
- Tanggal Cetak
- Judul Pekerjaan
- Tipe Laporan
- Periode
- Status Workflow
- Tanggal Administrasi
- Task Utama
- Sub Task
- Sub Task 1
- Media Pengajuan
- Kategori Administrasi
- Activity / Regional
- Teknisi Lapangan
- Lokasi / GPS

Approval sequence:
1. Teknisi — Submitted
2. Team Leader / IC — Verified
3. FE Admin — Locked
4. Dept Head — Approved

Actions:
- Tutup
- Print / Save as PDF

Do not style this preview like a dashboard card. It should resemble an official printable document.

## 35. Vehicle
Vehicle management belongs in the dedicated Vehicle module, not the main dashboard.

Recommended content:
- Vehicle summary metrics
- Search/filter
- Vehicle table
- Vehicle/location map only when useful inside this module

Recommended columns:
- Vehicle
- Plate
- PIC
- Team
- Ticket
- Destination
- Time Out
- Return
- Fuel
- Odometer
- Status

## 36. Chat Lapangan
Use a professional internal communication layout.

Avoid social-media styling.

Display:
- Conversation context
- Sender
- Message
- Timestamp
- Ticket/location attachment when relevant

Keep density appropriate for desktop work.

## 37. Team Access
Use enterprise user-management table.

Recommended columns:
- Name
- Employee ID
- Email
- Role
- Status
- Permissions
- Actions

Use an action menu (`...`) instead of multiple large buttons.

## 38. Tables
All operational tables should use:
- Sticky header
- Compact row height
- Subtle hover
- Clear alignment
- Small status chips
- Horizontal scroll when required
- Action menu (`...`)

Avoid excessive buttons in each row.

## 39. Forms
Form guidelines:
- Label above input
- Consistent field height
- Clear required marker
- Helpful inline validation
- 2-column layout on desktop when possible
- Full-width only for long text / notes / upload sections

Do not place every field in a separate card.

## 40. Buttons

### Primary
Use for the single main action in a section.

Examples:
- Tambah Ticket
- Submit
- Verify
- Lock

### Secondary
Use for alternative actions.

### Ghost
Use for view/minor actions.

### Danger
Use for destructive/rejection actions.

Do not make every button primary.

## 41. Status Visual Language

### Success
- Approved
- Verified
- Done
- Completed

### Warning
- Waiting
- Revision Required
- Locked
- Service Soon

### Danger
- Rejected
- Critical
- Over SLA
- Service Due

### Neutral
- Draft
- Inactive
- Logout

Status backgrounds must remain subtle.

## 42. Motion
Allowed transitions:
- Hover
- Dropdown
- Modal open/close
- Tabs
- Sidebar collapse

Recommended duration:
- 150–180ms

Avoid:
- Spring-heavy animations
- Parallax
- Decorative motion
- Animated gradients

## 43. Accessibility
Required:
- Visible keyboard focus
- Semantic labels
- Sufficient contrast
- Tooltips for icon-only buttons
- Disabled states
- Keyboard-friendly controls
- Do not rely on color alone to communicate status

## 44. No AI-Slop Rules
Do NOT use:
- Glassmorphism
- Neon
- Glow
- Giant gradients
- Giant icons
- Huge hero areas
- Emoji
- Decorative dashboards
- Fake analytics
- Random accent colors
- Excessive shadows
- Excessive rounded cards
- Card-inside-card without purpose
- Marketing copy
- Empty decorative whitespace

Before adding a visual element, ask:

> Does this help an operator understand status or complete a task?

If not, remove it.

## 45. Implementation Rules
Before creating a new component:
1. Check whether an existing component already solves the problem.
2. Reuse existing UI primitives.
3. Reuse role/permission helpers.
4. Reuse design tokens.
5. Avoid duplicate utility functions.
6. Avoid new hardcoded colors.
7. Avoid broad refactors for visual-only changes.
8. Preserve existing business logic unless the SRS requires a functional correction.

## 46. Dashboard Final Reference

### Ringkasan Operasional — FE Admin

```text
Dashboard Operasional
Ringkasan operasional dan performa Field Engineer.

[ Ringkasan Operasional ] [ KPI Kinerja Engineer ]

[ Total Tiket ] [ Active Work ] [ Waiting Verify ]
[ SLA ]         [ MTTR ]        [ Maintenance ]

[ Urgent Assignment — only when real ]

┌────────────────────────────────┬───────────────────────┐
│ Operational Analytics          │ Export Data           │
│ Workflow / SLA / Workload      │ Operasional           │
│                                ├───────────────────────┤
│                                │ Recent Operational    │
│                                │ Activity              │
└────────────────────────────────┴───────────────────────┘

Modul Operasional FOSIS
[ Troubleshoot ][ Maintenance ][ SIK ][ Administration ]
```

NO MAP.

### KPI Kinerja Engineer

```text
KPI Kinerja Engineer
Matriks produktivitas dan kepatuhan SLA personel lapangan.

[ Total Personel ][ Avg SLA ][ Top Resolver ][ Total Ticket ]

[ Search ][ Module ][ Month ][ Year ][ Reset ]

Engineer Performance Table

SLA / Workload / Performance analytics
```

NO MAP.
NO EXPORT.
NO RECENT OPERATIONAL ACTIVITY.

## 47. Source of Truth Hierarchy
Use this priority when making frontend decisions:

1. SRS — functional requirements and role rules
2. `design.md` — visual and interaction rules
3. Existing components — implementation baseline
4. Stitch screens — visual reference examples

When a Stitch screen conflicts with the SRS or this document, follow the SRS first and then this `design.md`.
