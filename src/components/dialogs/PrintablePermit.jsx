import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Send, Lock } from 'lucide-react';

export default function PrintablePermit({ permit, onClose, currentUser }) {
  const [isSendingWA, setIsSendingWA] = useState(false);

  if (!permit) return null;

  const canShareWA =
    !currentUser ||
    currentUser.role === 'admin' ||
    currentUser.role === 'ic' ||
    permit.createdBy === currentUser.id ||
    permit.creatorName === currentUser.name ||
    permit.personnel === currentUser.name;

  const renderCheckbox = (isChecked, label) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '16px', fontSize: '11px' }}>
      <span style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        border: '1px solid #000',
        marginRight: '5px',
        textAlign: 'center',
        lineHeight: '10px',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {isChecked ? '✓' : ''}
      </span>
      {label}
    </span>
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsSendingWA(true);
    try {
      const element = document.getElementById('spk-print-area');
      const fileName = `SPK_FOSIS_${(permit.pfNo || permit.id || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

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
        // Fallback langsung menggunakan dialog print sistem ke "Save as PDF"
        window.print();
      }
    } catch (err) {
      console.warn('html2pdf save failed, fallback to window.print():', err);
      window.print();
    } finally {
      setIsSendingWA(false);
    }
  };

  const handleSendPdfToWhatsApp = async () => {
    if (!canShareWA) {
      alert('Access Denied: Only the creator of this Work Permit can share this PDF document via WhatsApp.');
      return;
    }

    setIsSendingWA(true);
    try {
      const element = document.getElementById('spk-print-area');
      const fileName = `PERMIT_FOSIS_${(permit.pfNo || permit.id || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

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
            title: `Official Work Permit Authorization - ${permit.pfNo || permit.id}`,
            text: `Attached official FOSIS Work Permit PDF (${permit.pfNo || permit.id}).`
          });
          setIsSendingWA(false);
          return;
        }

        await window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }

      const rawPhone = (permit.telp || '').replace(/[^0-9]/g, '');
      const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
      const caption = encodeURIComponent(
        `*[OFFICIAL FOSIS WORK PERMIT AUTHORIZATION]*\n` +
        `• Permit No: *${permit.pfNo || permit.id || '-'}*\n` +
        `• Company: *${permit.companyName || permit.vendor || '-'}*\n` +
        `• Site Location: *${permit.address || permit.site || '-'}*\n` +
        `• Field Engineer: *${permit.engineerSignName || permit.personnel || '-'}*\n\n` +
        `_(The PDF file *${fileName}* has been downloaded. Please attach the file to this chat)_`
      );
      window.open(`https://wa.me/${waPhone}?text=${caption}`, '_blank');
    } catch (err) {
      console.error('Failed to generate PDF for WhatsApp:', err);
    } finally {
      setIsSendingWA(false);
    }
  };

  const data = {
    pfNo: permit.pfNo || permit.id || '-',
    typeOfOrder: permit.typeOfOrder || 'New',
    otherOrderText: permit.otherOrderText || '',
    companyName: permit.companyName || permit.vendor || '-',
    customerCode: permit.customerCode || '-',
    customerType: permit.customerType || 'Enterprise',
    address: permit.address || permit.site || '-',
    customerName: permit.customerName || '-',
    telp: permit.telp || '-',
    picOnsite: permit.picOnsite || '-',
    email: permit.email || '-',
    am: permit.am || '-',
    rfsDate: permit.rfsDate || permit.startDate || '-',
    typeOfService: permit.typeOfService || permit.workType || permit.kegiatan || permit.category || '-',
    bandwidth: permit.bandwidth || permit.capacity || '-',
    circuitId: permit.circuitId || permit.cid || '-',
    interfaceType: permit.interfaceType || permit.interface || '-',
    equipment: permit.equipment || permit.safety || permit.apd || '-',
    terminationLocation1: permit.terminationLocation1 || permit.site || permit.siteLocation || '-',
    terminationLocation2: permit.terminationLocation2 || permit.destinationSite || '-',
    testResults: (permit.testResults && permit.testResults.length > 0) ? permit.testResults : [
      { pingTime: permit.pingTime || '2 ms', upload: permit.upload || '100 Mbps', download: permit.download || '100 Mbps', destination: permit.destination || permit.site || 'Gateway POP' },
      { pingTime: '', upload: '', download: '', destination: '' },
      { pingTime: '', upload: '', download: '', destination: '' }
    ],
    ipBlock: permit.ipBlock || permit.ipSubnet || '-',
    ipPtP1: permit.ipPtP1 || permit.ptp1 || '-',
    ipPtP2: permit.ipPtP2 || permit.ptp2 || '-',
    customerSignName: permit.customerSignName || permit.customerName || permit.applicantName || '',
    customerSignDate: permit.customerSignDate || permit.endDate || permit.rfsDate || '',
    engineerSignName: permit.engineerSignName || permit.personnel || permit.pic || '',
    engineerSignDate: permit.engineerSignDate || permit.startDate || ''
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.78)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <div className="no-print" style={{
        width: '210mm', maxWidth: '100%', backgroundColor: '#1e293b', color: '#fff',
        padding: '12px 16px', borderRadius: '10px 10px 0 0', display: 'flex',
        flexWrap: 'wrap', gap: '10px',
        justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <CheckCircle2 color="#38bdf8" size={18} />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>
            Preview Work Permit Template (SPK / SIK)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canShareWA ? (
            <button
              onClick={handleSendPdfToWhatsApp}
              disabled={isSendingWA}
              style={{
                backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '7px 12px',
                borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '6px', fontWeight: 600, fontSize: '12px'
              }}
            >
              <Send size={14} /> {isSendingWA ? 'Processing...' : 'Send via WhatsApp'}
            </button>
          ) : (
            <span style={{
              backgroundColor: '#334155', color: '#94a3b8', padding: '7px 10px',
              borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Lock size={13} /> Creator Only
            </span>
          )}
          <button onClick={handleDownloadPdf} style={{
            backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '7px 12px',
            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '6px', fontWeight: 600, fontSize: '12px'
          }}>
            <Printer size={14} /> Download PDF
          </button>
          <button onClick={onClose} style={{
            backgroundColor: '#475569', color: '#fff', border: 'none', padding: '7px 10px',
            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px'
          }}>
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* Wrapper scrollable for responsive preview */}
      <div className="spk-preview-scroll-wrapper" style={{ width: '100%', maxWidth: '210mm', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div id="spk-print-area" style={{
          width: '210mm', minWidth: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000',
          padding: '10mm 14mm', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', position: 'relative'
        }}>
        {/* Header Logo FOSIS */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', color: '#1e3a8a', lineHeight: 1 }}>
              FOSIS<span style={{ color: '#dc2626' }}>•</span>
            </div>
            <div style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#1e293b', marginTop: '3px' }}>
              NAP INFO LINTAS NUSA — FIELD OPERATIONS
            </div>
          </div>
        </div>

        {/* Outer Form Table with 1px solid black border */}
        <div style={{ border: '1px solid #000000', width: '100%', boxSizing: 'border-box' }}>
          {/* Title Header */}
          <div style={{
            backgroundColor: '#e2e8f0', borderBottom: '1px solid #000000',
            textAlign: 'center', padding: '5px', fontWeight: 900, fontSize: '13px', letterSpacing: '0.5px'
          }}>
            SITE WORKING PERMIT AUTHORIZATION
          </div>

          {/* Sub Header: Network Support & PF No. */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000000', fontSize: '10px' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000', display: 'flex', alignItems: 'center' }}>
              Network Support
            </div>
            <div style={{ flex: 1, padding: '4px 6px', borderRight: '1px solid #000000' }}></div>
            <div style={{ width: '80px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000', display: 'flex', alignItems: 'center' }}>
              PF No.
            </div>
            <div style={{ width: '190px', padding: '4px 6px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              {data.pfNo || '-'}
            </div>
          </div>

          {/* Type of Order */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000000', fontSize: '10px' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000', display: 'flex', alignItems: 'center' }}>
              Type of Order
            </div>
            <div style={{ flex: 1, padding: '4px 8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {renderCheckbox(data.typeOfOrder === 'Trial', 'Trial')}
              {renderCheckbox(data.typeOfOrder === 'New', 'New')}
              {renderCheckbox(data.typeOfOrder === 'Upgrade/Downgrade', 'Upgrade/Downgrade')}
              {renderCheckbox(data.typeOfOrder === 'Relocation', 'Relocation')}
              {renderCheckbox(data.typeOfOrder === 'Terminate', 'Terminate')}
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                {renderCheckbox(data.typeOfOrder === 'Others', 'Others')}
                {data.otherOrderText && <span style={{ marginLeft: '4px', textDecoration: 'underline' }}>{data.otherOrderText}</span>}
              </div>
            </div>
          </div>

          {/* Section 1: CUSTOMER INFORMATION */}
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
            1.   CUSTOMER INFORMATION
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Company Name</div>
            <div style={{ flex: 1.2, padding: '4px 6px', borderRight: '1px solid #000000' }}>{data.companyName || '-'}</div>
            <div style={{ width: '110px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Customer Code</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.customerCode || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Customer Type</div>
            <div style={{ flex: 1, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {renderCheckbox(data.customerType === 'Enterprise', 'Enterprise')}
              {renderCheckbox(data.customerType === 'Wholesale', 'Wholesale')}
              {renderCheckbox(data.customerType === 'Broadband', 'Broadband')}
              {renderCheckbox(data.customerType === 'Other', 'Other')}
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Address</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.address || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Customer Name</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.customerName || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>PIC Onsite</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.picOnsite || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Email</div>
            <div style={{ flex: 1.2, padding: '4px 6px', borderRight: '1px solid #000000' }}>{data.email || '-'}</div>
            <div style={{ width: '80px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Telp</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.telp || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>AM</div>
            <div style={{ flex: 1.2, padding: '4px 6px', borderRight: '1px solid #000000' }}>{data.am || '-'}</div>
            <div style={{ width: '80px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>RFS Date</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.rfsDate || '-'}</div>
          </div>

          {/* Section 2: SERVICE DETAIL */}
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
            2.   SERVICE DETAIL
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Type of Service</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.typeOfService || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Bandwidth</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.bandwidth || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Circuit ID</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.circuitId || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Interface</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.interfaceType || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Equipment</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.equipment || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>IP Block</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.ipBlock || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>IP Point to Point I</div>
            <div style={{ flex: 1, padding: '4px 6px', borderRight: '1px solid #000000' }}>{data.ipPtP1 || '-'}</div>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>IP Point to Point II</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.ipPtP2 || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Termination Location I</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.terminationLocation1 || '-'}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
            <div style={{ width: '130px', fontWeight: 'bold', padding: '4px 6px', borderRight: '1px solid #000000' }}>Termination Location II</div>
            <div style={{ flex: 1, padding: '4px 6px' }}>{data.terminationLocation2 || '-'}</div>
          </div>

          {/* Section 3: TEST RESULT */}
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
            3.   TEST RESULT
          </div>
          <table className="spk-test-table" style={{ width: '100%', minWidth: 0, maxWidth: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed', boxSizing: 'border-box' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
                <th style={{ width: '25%', minWidth: 0, padding: '4px', borderRight: '1px solid #000000', boxSizing: 'border-box', textAlign: 'center', position: 'static' }}>Ping Time</th>
                <th style={{ width: '25%', minWidth: 0, padding: '4px', borderRight: '1px solid #000000', boxSizing: 'border-box', textAlign: 'center', position: 'static' }}>Upload</th>
                <th style={{ width: '25%', minWidth: 0, padding: '4px', borderRight: '1px solid #000000', boxSizing: 'border-box', textAlign: 'center', position: 'static' }}>Download</th>
                <th style={{ width: '25%', minWidth: 0, padding: '4px', boxSizing: 'border-box', textAlign: 'center', position: 'static' }}>Destination</th>
              </tr>
            </thead>
            <tbody>
              {data.testResults.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #000000', textAlign: 'center', height: '19px' }}>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 4px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.pingTime || '\u00A0'}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 4px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.upload || '\u00A0'}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 4px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.download || '\u00A0'}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.destination || '\u00A0'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Section 4: NETWORK DATA */}
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
            4.   NETWORK DATA
          </div>
          <div style={{ minHeight: '38px', padding: '5px 8px', borderBottom: '1px solid #000000', fontSize: '9.5px', color: '#1e293b' }}>
            {data.networkNotes || (
              <div style={{ display: 'flex', gap: '24px' }}>
                <span><strong>IP Block:</strong> {data.ipBlock || '-'}</span>
                <span><strong>PtP I:</strong> {data.ipPtP1 || '-'}</span>
                <span><strong>PtP II:</strong> {data.ipPtP2 || '-'}</span>
              </div>
            )}
          </div>

          {/* Declaration */}
          <div style={{ padding: '4px 8px', fontSize: '9.5px', fontStyle: 'italic', borderBottom: '1px solid #000000', backgroundColor: '#f8fafc' }}>
            We declare that the work as described above has been implemented and accepted.
          </div>

          {/* Section 5: ACCEPTANCE */}
          <div style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '10px', borderBottom: '1px solid #000000' }}>
            5.   ACCEPTANCE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Customer Box */}
            <div style={{ borderRight: '1px solid #000000', display: 'flex', flexDirection: 'column', minHeight: '85px' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid #000000', backgroundColor: '#f1f5f9' }}>
                Customer
              </div>
              <div style={{ flex: 1, minHeight: '40px' }}></div>
              <div style={{ borderTop: '1px solid #000000', padding: '3px 6px', fontSize: '9.5px' }}>
                <div>Name: {data.customerSignName || '-'}</div>
                <div>Date: {data.customerSignDate || '-'}</div>
              </div>
            </div>

            {/* Field Engineer Box */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '85px' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid #000000', backgroundColor: '#f1f5f9' }}>
                Field Engineer
              </div>
              <div style={{ flex: 1, minHeight: '40px' }}></div>
              <div style={{ borderTop: '1px solid #000000', padding: '3px 6px', fontSize: '9.5px' }}>
                <div>Name: {data.engineerSignName || '-'}</div>
                <div>Date: {data.engineerSignDate || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '10px', fontSize: '8.5px', fontStyle: 'italic', color: '#475569' }}>
          Internal Use Only
        </div>
      </div>
    </div>

      <style>{`
        #spk-print-area table.spk-test-table {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          table-layout: fixed !important;
        }
        #spk-print-area table.spk-test-table th,
        #spk-print-area table.spk-test-table td {
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          #spk-print-area, #spk-print-area * { visibility: visible; }
          #spk-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 14mm !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
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
      <div style={{ width: labelWidth, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, borderBottom: '1px dotted #000', paddingBottom: '1px', minHeight: '14px', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

const tdStyle = {
  border: '1px solid #475569',
  padding: '5px 6px',
  textAlign: 'center'
};

export function isRecordCreator(user, item) {
  if (!user || !item) return false;
  return (
    item.createdBy === user.id ||
    item.creatorName === user.name ||
    item.pic === user.name ||
    item.engineer === user.name ||
    item.personnel === user.name
  );
}

export function canShareTicketPdfToWA(user, item) {
  if (!user || !item) return false;
  if (user.role === 'admin' || user.role === 'ic') return true;
  if (user.role === 'engineer') return isRecordCreator(user, item);
  return false;
}

export function canEditRecord(user, item) {
  if (!user || !item) return false;
  if (item.isLocked && user.role !== 'admin') return false;
  if (user.role === 'admin' || user.role === 'ic') return true;
  if (user.role === 'engineer') return isRecordCreator(user, item);
  return false;
}
