import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl
} from "react-leaflet";

import EngineerMarker from "./EngineerMarker";
import VehicleMarker from "./VehicleMarker";
import SiteMarker from "./SiteMarker";
import MapFilters from "./MapFilters";

import "leaflet/dist/leaflet.css";


const mockEngineers = [
  {
    id: 1,
    name: "Budi Engineer",
    role: "Field Engineer",
    status: "ONLINE",
    lat: -7.2575,
    lng: 112.7521,
    ticket: "E/260901/0001",
    site: "Surabaya Gubeng"
  },
  {
    id: 2,
    name: "Andi Engineer",
    role: "Field Engineer",
    status: "OFFLINE",
    lat: -7.2601,
    lng: 112.7501,
    ticket: "E/260901/0002",
    site: "Surabaya Barat"
  }
];


const mockVehicles = [
  {
    id: 1,
    name: "FOSIS Vehicle 01",
    speed: "45 km/h",
    status: "MOVING",
    lat: -7.255,
    lng: 112.755,
    ticket: "Maintenance Route"
  }
];


const mockSites = [
  {
    id: 1,
    name: "POP Surabaya Gubeng",
    type: "SITE",
    lat: -7.258,
    lng: 112.753
  }
];


export default function FosisMap() {

  const [filter, setFilter] = useState({
    engineer: true,
    vehicle: true,
    site: true
  });


  return (
    <div className="fosis-map-wrapper">

      {/* MAP SAJA */}
      <div className="fosis-map-clip">

        <MapContainer
          center={[-7.2575, 112.7521]}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom={true}
          className="fosis-map-container"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          <ZoomControl position="bottomright" />


          {filter.engineer &&
            mockEngineers.map((engineer) => (
              <EngineerMarker
                key={engineer.id}
                data={engineer}
              />
            ))}


          {filter.vehicle &&
            mockVehicles.map((vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                data={vehicle}
              />
            ))}


          {filter.site &&
            mockSites.map((site) => (
              <SiteMarker
                key={site.id}
                data={site}
              />
            ))}

        </MapContainer>

      </div>


      {/* WAJIB DI LUAR fosis-map-clip */}
      <MapFilters
        filter={filter}
        setFilter={setFilter}
      />

    </div>
  );
}