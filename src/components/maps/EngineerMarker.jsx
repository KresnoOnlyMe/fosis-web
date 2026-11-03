import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
const icon=L.divIcon({className:"",html:`<div style="font-size:26px">${"📍"}</div>`});
export default function EngineerMarker({data}){return <Marker position={[data.lat,data.lng]} icon={icon}><Popup><b>{data.name}</b><br/>{data.role}<br/>Status: <b style={{color:data.status==="ONLINE"?"green":"red"}}>{data.status}</b><br/>Ticket: {data.ticket}<br/>Site: {data.site}</Popup></Marker>}
