import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/** Carte Leaflet : tuiles sombres CARTO (gratuites, sans clé), marqueur vectoriel (pas d'icône externe). */
export function CommuneMap({ lat, lon, nom }: { lat: number; lon: number; nom: string }) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl border border-border [&_.leaflet-container]:bg-background [&_.leaflet-popup-content-wrapper]:bg-popover [&_.leaflet-popup-content-wrapper]:text-popover-foreground [&_.leaflet-popup-tip]:bg-popover">
      <MapContainer center={[lat, lon]} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <CircleMarker center={[lat, lon]} radius={10} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#e8384f", fillOpacity: 0.9 }}>
          <Popup>{nom}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

export default CommuneMap;
