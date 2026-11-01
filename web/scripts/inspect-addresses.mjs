import "dotenv/config";
const key = process.env.LINZ_API_KEY;
const url =
  `https://data.linz.govt.nz/services;key=${key}/wfs` +
  `?service=WFS&version=2.0.0&request=GetFeature` +
  `&typeNames=layer-123113` +
  `&cql_filter=bbox(shape,-37.0,174.7,-36.8,174.9)` +
  `&count=3&outputformat=json&SRSName=EPSG:4326`;
const res = await fetch(url);
console.log("HTTP", res.status);
const text = await res.text();
if (text.startsWith("<")) {
  console.log("XML error:", text.slice(0, 600));
} else {
  const data = JSON.parse(text);
  console.log("features:", data.features?.length);
  if (data.features?.[0]) {
    console.log("properties keys:", Object.keys(data.features[0].properties || {}));
    console.log("sample:", JSON.stringify(data.features[0].properties, null, 2));
  }
}
