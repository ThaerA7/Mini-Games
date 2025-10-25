// components/guess-games/map-shape/CountryShape.tsx
import * as React from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import worldAtlasCountries from "world-atlas/countries-110m.json";
import worldMeta from "world-countries";

export type CountryShapeProps = {
  code: string; 
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
};

// --- Build ISO2 -> ISO_N3 numeric map from mledoze dataset ---
const ISO2_TO_N3: Record<string, number> = {};
(worldMeta as any[]).forEach((rec) => {
  if (rec?.cca2 && rec?.ccn3) {
    ISO2_TO_N3[String(rec.cca2).toUpperCase()] = Number(rec.ccn3);
  }
});

// --- Convert world-atlas TopoJSON to GeoJSON features ---
type TopologyAny = any;
const countriesFC = topoFeature(
  worldAtlasCountries as unknown as TopologyAny,
  (worldAtlasCountries as any).objects.countries
) as unknown as FeatureCollection<Geometry, any>;

const BY_N3: Record<number, Feature<Geometry, any>> = {};
countriesFC.features.forEach((f: any) => {
  const idNum = Number(f.id);
  if (!Number.isNaN(idNum)) BY_N3[idNum] = f as Feature<Geometry, any>;
});

// Some ISO2 codes (e.g., XK for Kosovo) are not present in Natural Earth.
// Expose a helper so the game can filter them out if desired.
export const HAS_SHAPE = new Set(
  Object.entries(ISO2_TO_N3)
    .filter(([_, n3]) => BY_N3[n3])
    .map(([iso2]) => iso2)
);

export default function CountryShape({
  code,
  width = 480,
  height = 360,
  fill = "#7dd3fc",
  stroke = "rgba(255,255,255,0.85)",
}: CountryShapeProps) {
  const feature = React.useMemo<Feature<Geometry, any> | null>(() => {
    const n3 = ISO2_TO_N3[String(code || "").toUpperCase()];
    return n3 ? BY_N3[n3] ?? null : null;
  }, [code]);

  const pathD = React.useMemo(() => {
    if (!feature) return "";
    const projection = geoNaturalEarth1().precision(0.1).fitSize([width - 8, height - 8], feature);
    const path = geoPath(projection as any);
    return path(feature) || "";
  }, [feature, width, height]);

  return (
    <svg
      role="img"
      aria-label="country outline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", borderRadius: 8, background: "rgba(255,255,255,0.06)" }}
    >
      <defs>
        <filter id="mapDrop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
        </filter>
      </defs>

      {pathD ? (
        <g transform="translate(4,4)">
          <path d={pathD} fill={fill} stroke={stroke} strokeWidth={1} filter="url(#mapDrop)" />
        </g>
      ) : (
        <rect x={0} y={0} width={width} height={height} fill="rgba(255,255,255,0.06)" />
      )}
    </svg>
  );
}
