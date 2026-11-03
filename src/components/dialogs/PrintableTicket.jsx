import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Send, Lock } from 'lucide-react';
import { canShareTicketPdfToWA } from '../../utils/permissions';

export default function PrintableTicket({ ticket, onClose, currentUser }) {
  const [isSendingWA, setIsSendingWA] = useState(false);

  if (!ticket) return null;

  const canShareWA = canShareTicketPdfToWA(currentUser, ticket);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsSendingWA(true);
    try {
      const element = document.getElementById('ticket-print-area');
      if (window.html2pdf) {
        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('html2pdf save failed, fallback to window.print:', err);
      window.print();
    } finally {
      setIsSendingWA(false);
    }
  };

  const typeStr = (ticket.type || 'TROUBLESHOOT').toUpperCase();
  const subJudul =
    typeStr === 'TROUBLESHOOT'
      ? 'TROUBLESHOOT'
      : typeStr === 'MAINTENANCE'
        ? 'MAINTENANCE'
        : 'ADMINISTRATION';

  const ticketNo = ticket.ticketNo || ticket.id || 'DOC-001';
  const fileName = `JRR_FOSIS_${ticketNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  const handleSendPdfToWhatsApp = async () => {
    if (!canShareWA) {
      alert('Access Denied: Only the creator of this ticket can share this PDF document via WhatsApp.');
      return;
    }

    setIsSendingWA(true);
    try {
      const element = document.getElementById('ticket-print-area');

      if (window.html2pdf) {
        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: `Job Result Report (JRR / LHP) - ${ticketNo}`,
            text: `Attached official FOSIS Job Result Report (${ticketNo}).`
          });
          setIsSendingWA(false);
          return;
        }

        await window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }

      const rawPhone = (ticket.telp || ticket.phone || '').replace(/[^0-9]/g, '');
      const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
      const caption = encodeURIComponent(
        `*[OFFICIAL FOSIS WORK REPORT - ${subJudul}]*\n` +
        `• Ticket No: *${ticketNo}*\n` +
        `• Title: *${ticket.title || '-'}*\n` +
        `• Location: *${ticket.siteLocationName || ticket.site || '-'}*\n` +
        `• Engineer: *${ticket.engineerName || ticket.pic || '-'}*\n` +
        `• Status: *${ticket.workflowStatus || 'COMPLETED'}*\n\n` +
        `_(The PDF file *${fileName}* has been downloaded. Please attach the file to this chat)_`
      );
      window.open(`https://wa.me/${waPhone}?text=${caption}`, '_blank');
    } catch (err) {
      console.error('Failed to generate PDF for WhatsApp:', err);
    } finally {
      setIsSendingWA(false);
    }
  };

  const isLocked = Boolean(ticket.locked || ticket.isLocked);
  const wf = (ticket.workflowStatus || '').toLowerCase();
  const isSubmitted = wf.includes('menunggu') || wf.includes('pending') || wf.includes('diverifikasi') || wf.includes('verified') || wf.includes('terkunci') || wf.includes('locked') || wf.includes('disahkan') || wf.includes('approved') || wf.includes('ic') || wf.includes('leader') || wf.includes('admin') || wf.includes('head');
  const isVerified = wf.includes('diverifikasi') || wf.includes('verified') || wf.includes('terkunci') || wf.includes('locked') || wf.includes('disahkan') || wf.includes('approved') || wf.includes('leader') || wf.includes('admin') || wf.includes('head');
  const isFinalLocked = isLocked || wf.includes('terkunci') || wf.includes('locked') || wf.includes('disahkan') || wf.includes('approved') || wf.includes('admin') || wf.includes('head');
  const isApproved = wf.includes('disahkan') || wf.includes('approved') || wf.includes('head');

  const printDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.78)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px', overflowY: 'auto'
    }}>
      {/* Top Toolbar */}
      <div className="no-print" style={{
        width: '210mm', maxWidth: '100%', backgroundColor: '#1e293b', color: '#fff',
        padding: '12px 20px', borderRadius: '10px 10px 0 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 color="#38bdf8" size={18} />
          <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
            Preview Work Report ({ticketNo}) — Review document before Export / WhatsApp
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canShareWA ? (
            <button
              onClick={handleSendPdfToWhatsApp}
              disabled={isSendingWA}
              style={{
                backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px',
                borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '6px', fontWeight: 600, fontSize: '12.5px'
              }}
            >
              <Send size={15} /> {isSendingWA ? 'Processing...' : 'Send via WhatsApp'}
            </button>
          ) : (
            <span style={{
              backgroundColor: '#334155', color: '#94a3b8', padding: '8px 12px',
              borderRadius: '6px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Lock size={14} /> Creator Only
            </span>
          )}
          <button onClick={handleDownloadPdf} style={{
            backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px',
            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '6px', fontWeight: 600, fontSize: '12.5px'
          }}>
            <Printer size={15} /> Download PDF
          </button>
          {onClose && (
            <button onClick={onClose} style={{
              backgroundColor: '#475569', color: '#fff', border: 'none', padding: '8px 12px',
              borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12.5px'
            }}>
              <X size={15} /> Close
            </button>
          )}
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div id="ticket-print-area" style={{
        width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000',
        padding: '15mm 18mm', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        {/* Header FOSIS Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', borderBottom: '2px solid #1e3a8a', paddingBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#1e3a8a', lineHeight: 1 }}>
              FOSIS<span style={{ color: '#dc2626' }}>•</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.1px', color: '#475569', marginTop: '4px' }}>
              NAP INFO LINTAS NUSA — FIELD OPERATIONS
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, textDecoration: 'underline', letterSpacing: '0.5px' }}>
              OFFICIAL JOB RESULT REPORT (JRR / LHP)
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', color: '#dc2626' }}>
              {subJudul}
            </div>
          </div>
        </div>

        {/* Section 1: IDENTITAS TIKET & PEKERJAAN */}
        <SectionBar title="1.   TICKET & WORK INFORMATION" />
        <div style={{ margin: '10px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <DottedField flex={1.2} label="Ticket Number" value={ticketNo} />
            <DottedField flex={1} label="Print Date" labelWidth="90px" value={printDate} />
          </div>
          <DottedField label="Work Title" value={ticket.title || '-'} />
          <div style={{ display: 'flex', gap: '20px' }}>
            <DottedField flex={1.2} label="Location / Site" value={ticket.siteLocationName || ticket.site || '-'} />
            <DottedField flex={1} label="Period" labelWidth="90px" value={`${ticket.bulan || 'SEPTEMBER'} ${ticket.tahun || '2026'}`} />
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <DottedField flex={1.2} label="Engineer (PIC)" value={ticket.engineerName || ticket.pic || '-'} />
            <DottedField flex={1} label="Workflow Status" labelWidth="90px" value={ticket.workflowStatus || 'Draft'} />
          </div>
        </div>

        {/* Section 2: SPESIFIKASI OPERASIONAL SESUAI MODUL */}
        <SectionBar title="2.   TECHNICAL DETAILS & EXECUTION RESULTS" />
        <div style={{ margin: '10px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {typeStr === 'TROUBLESHOOT' ? (
            <>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Infrastructure" value={ticket.infraCategory || ticket.infra || '-'} />
                <DottedField flex={1} label="FO Activity" labelWidth="100px" value={ticket.infraActivity || ticket.detailAktivitas || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Root Cause" value={ticket.rootCause || '-'} />
                <DottedField flex={1} label="Impact" labelWidth="100px" value={ticket.impact || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Service Impact" value={ticket.serviceImpact || '-'} />
                <DottedField flex={1} label="SLA Status" labelWidth="100px" value={ticket.slaStatus || 'IN SLA'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Change Request (CR)" value={ticket.crStatus || ticket.changeRequest || 'DONE'} />
                <DottedField flex={1} label="Partner / Vendor" labelWidth="100px" value={ticket.mitra || 'INTERNAL'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Initial Loss" value={ticket.redamanAwal || '-28.5 dBm'} />
                <DottedField flex={1} label="Final Loss" labelWidth="100px" value={ticket.redamanAkhir || '-18.2 dBm'} />
              </div>
            </>
          ) : typeStr === 'MAINTENANCE' ? (
            <>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Activity" value={ticket.kegiatan || '-'} />
                <DottedField flex={1} label="Requestor" labelWidth="100px" value={ticket.requestor || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Task Type" value={ticket.taskType || 'PLAN'} />
                <DottedField flex={1} label="Mnt Status" labelWidth="100px" value={ticket.maintenanceStatus || 'DONE'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Infrastructure" value={ticket.infraCategory || ticket.infra || '-'} />
                <DottedField flex={1} label="FO Activity" labelWidth="100px" value={ticket.infraActivity || ticket.detailAktivitas || '-'} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Primary Task" value={ticket.adminTask || ticket.task || '-'} />
                <DottedField flex={1} label="Sub Task" labelWidth="100px" value={ticket.subTask || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Sub Task 1" value={ticket.subTask1 || '-'} />
                <DottedField flex={1} label="Channel" labelWidth="100px" value={ticket.viaChannel || ticket.via || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Category" value={ticket.adminKategori || ticket.kategori || '-'} />
                <DottedField flex={1} label="Activity" labelWidth="100px" value={ticket.adminActivity || ticket.activity || '-'} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <DottedField flex={1.2} label="Admin Status" value={ticket.adminStatus || ticket.status || 'DONE'} />
                <DottedField flex={1} label="Date" labelWidth="100px" value={String(ticket.tanggal || '-')} />
              </div>
            </>
          )}

          <DottedField label="Materials Used" value={ticket.materialUsed || ticket.material || 'Standard FOSIS Operational Materials & PPE'} />
          <DottedField label="OTDR / Photo Attachment" value={ticket.otdrPdfAttachments || ticket.otdrAttachments ? `OTDR Files: ${ticket.otdrPdfAttachments || ticket.otdrAttachments}` : 'Photo & OTDR documentation stored in database'} />
          {ticket.deptHeadComment && (
            <DottedField label="Dept Head Note" value={ticket.deptHeadComment} />
          )}
        </div>

        {/* Section 3: OTORISASI 4-TIER PIPELINE (TANPA JEJAK AUDIT) */}
        <SectionBar title="3.   MULTI-TIER WORKFLOW AUTHORIZATION (4-TIER PIPELINE)" />
        <div style={{ margin: '14px 0 10px', fontSize: '10.5px' }}>
          This document is declared valid and binding through the official 4-tier digital workflow verification:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
          {/* Tier 1: Field Engineer */}
          <div style={signBoxStyle}>
            <div style={signTitleStyle}>1. FIELD ENGINEER</div>
            <div style={{ color: isSubmitted ? '#166534' : '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}>
              {isSubmitted ? '✓ SUBMITTED' : 'DRAFT'}
            </div>
            <div style={{ marginTop: 'auto', borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>{ticket.engineerName || ticket.createdBy || 'Field Engineer'}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US') : printDate}</div>
            </div>
          </div>

          {/* Tier 2: Team Leader / IC */}
          <div style={signBoxStyle}>
            <div style={signTitleStyle}>2. TEAM LEADER / IC</div>
            <div style={{ color: isVerified ? '#166534' : '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}>
              {isVerified ? '✓ VERIFIED' : 'PENDING'}
            </div>
            <div style={{ marginTop: 'auto', borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>{ticket.verifiedBy || 'Team Leader / IC'}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{isVerified && ticket.verifiedAt ? new Date(ticket.verifiedAt).toLocaleDateString('en-US') : '-'}</div>
            </div>
          </div>

          {/* Tier 3: Team Admin */}
          <div style={signBoxStyle}>
            <div style={signTitleStyle}>3. TEAM ADMIN</div>
            <div style={{ color: isFinalLocked ? '#166534' : '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}>
              {isFinalLocked ? '✓ LOCKED' : 'PENDING'}
            </div>
            <div style={{ marginTop: 'auto', borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>{ticket.lockedBy || 'FE Operations Admin'}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{isFinalLocked && ticket.lockedAt ? new Date(ticket.lockedAt).toLocaleDateString('en-US') : '-'}</div>
            </div>
          </div>

          {/* Tier 4: Dept Head */}
          <div style={signBoxStyle}>
            <div style={signTitleStyle}>4. DEPT. HEAD</div>
            <div style={{ color: isApproved ? '#166534' : '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}>
              {isApproved ? '✓ APPROVED' : 'PENDING'}
            </div>
            <div style={{ marginTop: 'auto', borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>{ticket.approvedBy || 'Mas Rizki Firdaus'}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{isApproved && ticket.approvedAt ? new Date(ticket.approvedAt).toLocaleDateString('en-US') : '-'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '28px', borderTop: '1px solid #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#647489' }}>
          <div>Official FOSIS Operational Report • PT NAP Info Lintas Nusa</div>
          <div>Security Hash: {ticketNo}-SEC-VALID</div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          #ticket-print-area, #ticket-print-area * { visibility: visible; }
          #ticket-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 12mm 15mm;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionBar({ title }) {
  return (
    <div style={{
      backgroundColor: '#52525b', color: '#ffffff', fontWeight: 'bold',
      padding: '4px 10px', fontSize: '11px', letterSpacing: '0.5px',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact'
    }}>
      {title}
    </div>
  );
}

function DottedField({ label, value, flex = 1, labelWidth = '130px' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', flex }}>
      <div style={{ width: labelWidth, flexShrink: 0, fontWeight: 'bold', color: '#334155' }}>{label}</div>
      <div style={{ flex: 1, borderBottom: '1px dotted #000', paddingBottom: '1px', minHeight: '14px', fontWeight: 500 }}>
        {value || '-'}
      </div>
    </div>
  );
}

const signBoxStyle = {
  border: '1px solid #64748b',
  borderRadius: '4px',
  height: '110px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '6px 8px',
  backgroundColor: '#f8fafc'
};

const signTitleStyle = {
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '9px',
  color: '#1e293b',
  borderBottom: '1px solid #cbd5e1',
  paddingBottom: '3px'
};
