#!/usr/bin/env node
// Quick LINZ WFS sanity check. Reads LINZ_API_KEY from env, queries a small Auckland bbox.
// Usage: node scripts/verify-linz-key.js  (run from web/ with .env.local loaded)
import "dotenv/config";

const key = process.env.LINZ_API_KEY;
if (!key) {
  console.error("LINZ_API_KEY not set");
  process.exit(1);
}
const url =
  `https://data.linz.govt.nz/services;key=${key}/wfs` +
  `?service=WFS&version=2.0.0&request=GetFeature` +
  `&typeNames=layer-50772` +
  `&cql_filter=bbox(shape,-36.90,174.78,-36.88,174.80)` +
  `&count=5&outputformat=json`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`WFS request failed: ${res.status}`);
  process.exit(2);
}
const data = await res.json();
const features = data.features ?? [];
console.log(`HTTP ${res.status}`);
console.log(`Features returned: ${features.length}`);
if (features[0]) {
  const p = features[0].properties || {};
  console.log(`Sample parcel: id=${p.id} appellation=${p.appellation} intent=${p.parcel_intent} area=${p.calc_area}`);
}
