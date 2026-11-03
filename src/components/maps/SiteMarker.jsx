import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
const icon=L.divIcon({className:"",html:`<div style="font-size:24px">🏢</div>`});
export default function SiteMarker({data}){return <Marker position={[data.lat,data.lng]} icon={icon}><Popup><b>{data.name}</b><br/>Type: {data.type}</Popup></Marker>}
