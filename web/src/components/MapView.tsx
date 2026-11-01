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
    const linzApiKey = process.env.NEXT_PUBLIC_LINZ_API_KEY;
    const linzTilesUrl = linzApiKey
      ? `https://basemaps.linz.govt.nz/v1/aerial/{z}/{x}/{y}.webp?api=${linzApiKey}`
      : "https://basemaps.linz.govt.nz/v1/aerial/{z}/{x}/{y}.webp";
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "linz-aerial": {
            type: "raster",
            tiles: [linzTilesUrl],
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
          paint: { "line-color": "#1C1A17", "line-width": 2 },
        });
        map.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: { "fill-color": "#1C1A17", "fill-opacity": 0.06 },
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
            paint: { "fill-color": "#7A5A3A", "fill-opacity": 0.35 },
          });
          map.addLayer({
            id: "evidence-line",
            type: "line",
            source: "evidence",
            paint: { "line-color": "#7A5A3A", "line-width": 2 },
          });
        } else if (evidenceGeoJSON) {
          (map.getSource("evidence") as maplibregl.GeoJSONSource).setData(evidenceGeoJSON);
        }
      }
      const bounds = new maplibregl.LngLatBounds();
      const extend = (g: GeoJSON.Feature) => {
        const geom = g.geometry;
        if (!geom) return;
        const collect = (coords: number[][]) =>
          coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        if (geom.type === "Polygon") {
          collect(geom.coordinates[0]);
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((poly) => collect(poly[0]));
        } else if (geom.type === "GeometryCollection") {
          geom.geometries.forEach((gg) => {
            if (gg.type === "Polygon") collect(gg.coordinates[0]);
            else if (gg.type === "MultiPolygon") gg.coordinates.forEach((p) => collect(p[0]));
          });
        }
      };
      if (parcelGeoJSON) extend(parcelGeoJSON);
      if (evidenceGeoJSON) extend(evidenceGeoJSON);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60 });
    };
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.on("load", addLayers);
    }
    return () => {
      map.off("load", addLayers);
    };
  }, [parcelGeoJSON, evidenceGeoJSON]);

  return <div ref={containerRef} className={className ?? "h-96 w-full"} />;
}
