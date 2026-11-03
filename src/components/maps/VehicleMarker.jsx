import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
const icon=L.divIcon({className:"",html:`<div style="font-size:26px">🚗</div>`});
export default function VehicleMarker({data}){return <Marker position={[data.lat,data.lng]} icon={icon}><Popup><b>{data.name}</b><br/>Speed: {data.speed}<br/>Status: {data.status}<br/>{data.ticket}</Popup></Marker>}
