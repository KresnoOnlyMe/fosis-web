import React from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Default Surabaya Gubeng operational coordinates matching mockup
const SURABAYA_LAT = -7.2575
const SURABAYA_LNG = 112.7521

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="background: linear-gradient(135deg, #16a34a, #15803d); border: 2.5px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.45); color: #fff;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
})

export default function LiveGeolocation({
  locationName = 'Surabaya Gubeng - Pos Operasional Device',
  latitude = SURABAYA_LAT,
  longitude = SURABAYA_LNG
}) {
  return (
    <div
      className="card pad"
      style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #E2E8F0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
            Live Device Geolocation
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {locationName}
          </div>
        </div>

        <span
          style={{
            background: '#DCFCE7',
            color: '#15803D',
            fontSize: 9.5,
            fontWeight: 900,
            padding: '3px 8px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#16A34A',
              boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)'
            }}
          />
          LIVE
        </span>
      </div>

      {/* Coordinate Highlight Pill (Matching exact design in image) */}
      <div
        className="geo-highlight"
        style={{
          borderRadius: 14,
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#DCFCE7',
            color: '#059669',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          <MapPin size={18} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065F46' }}>
            Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
          <div style={{ fontSize: 10.5, color: '#047857', marginTop: 1 }}>
            Location synchronized with device GPS
          </div>
        </div>
      </div>

      {/* Embedded Real Map Preview */}
      <div
        style={{
          position: 'relative',
          height: 180,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
          />
          <ZoomControl position="bottomright" />
          <Marker position={[latitude, longitude]} icon={pinIcon}>
            <Popup>
              <strong>{locationName}</strong>
              <br />
              {latitude}, {longitude}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  )
}
