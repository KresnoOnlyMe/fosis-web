import React from 'react'

export function Badge({ children, tone='gray' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function Card({ children, className='', pad=true }) {
  return <section className={`card ${pad ? 'pad' : ''} ${className}`.trim()}>{children}</section>
}

export function Button({ children, tone='primary', size='', className='', ...props }) {
  return <button className={`btn ${tone} ${size} ${className}`.trim()} {...props}>{children}</button>
}

export function Field({ label, children, full=false }) {
  return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div>
}

export function EmptyState({ children='Tidak ada data.' }) {
  return <div style={{padding:'34px 18px',textAlign:'center',color:'#64748B',fontSize:12}}>{children}</div>
}
