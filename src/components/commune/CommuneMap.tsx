import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Carte Leaflet : tuiles OpenStreetMap standard, inversées par filtre CSS en thème sombre
 * (les fonds CARTO exigent désormais une clé d'API), marqueur vectoriel (pas d'icône externe).
 */
export function CommuneMap({ lat, lon, nom }: { lat: number; lon: number; nom: string }) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl border border-border [&_.leaflet-container]:bg-background [&_.leaflet-popup-content-wrapper]:bg-popover [&_.leaflet-popup-content-wrapper]:text-popover-foreground [&_.leaflet-popup-tip]:bg-popover dark:[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.9)_contrast(0.9)]">
      <MapContainer center={[lat, lon]} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
