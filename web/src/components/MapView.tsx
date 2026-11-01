"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  parcelGeoJSON: GeoJSON.Feature | null;
  evidenceGeoJSON?: GeoJSON.Feature | null;
  className?: string;
};

export default function MapView({ parcelGeoJSON, evidenceGeoJSON, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "linz-aerial": {
            type: "raster",
            tiles: [
              "https://basemaps.linz.govt.nz/v1/aerial/{z}/{x}/{y}.webp",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.linz.govt.nz/data/linz-data-service">LINZ</a>',
          },
        },
        layers: [
          {
            id: "aerial",
            type: "raster",
            source: "linz-aerial",
          },
        ],
      },
      center: [174.78, -36.86],
      zoom: 16,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || (!parcelGeoJSON && !evidenceGeoJSON)) return;
    const addLayers = () => {
      if (parcelGeoJSON && !map.getSource("parcel")) {
        map.addSource("parcel", { type: "geojson", data: parcelGeoJSON });
        map.addLayer({
          id: "parcel-outline",
          type: "line",
          source: "parcel",
          paint: { "line-color": "#1d4ed8", "line-width": 2 },
        });
        map.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: { "fill-color": "#1d4ed8", "fill-opacity": 0.1 },
        });
      } else if (parcelGeoJSON) {
        (map.getSource("parcel") as maplibregl.GeoJSONSource).setData(parcelGeoJSON);
      }
      if (evidenceGeoJSON) {
        if (!map.getSource("evidence")) {
          map.addSource("evidence", { type: "geojson", data: evidenceGeoJSON });
          map.addLayer({
            id: "evidence-fill",
            type: "fill",
            source: "evidence",
            paint: { "fill-color": "#dc2626", "fill-opacity": 0.45 },
          });
          map.addLayer({
            id: "evidence-line",
            type: "line",
            source: "evidence",
            paint: { "line-color": "#dc2626", "line-width": 2 },
          });
        } else if (evidenceGeoJSON) {
          (map.getSource("evidence") as maplibregl.GeoJSONSource).setData(evidenceGeoJSON);
        }
      }
      const bounds = new maplibregl.LngLatBounds();
      const extend = (g: GeoJSON.Feature) => {
        const geom = g.geometry;
        if (geom && geom.type === "Polygon") {
          geom.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat]));
        }
      };
      if (parcelGeoJSON) extend(parcelGeoJSON);
      if (evidenceGeoJSON) extend(evidenceGeoJSON);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60 });
    };
    if (map.loaded()) addLayers();
    else map.on("load", addLayers);
  }, [parcelGeoJSON, evidenceGeoJSON]);

  return <div ref={containerRef} className={className ?? "h-96 w-full"} />;
}
