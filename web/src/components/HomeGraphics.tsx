/* Field sheet for the home page.
   The parcel outline and the flow paths are the real geometries for
   17 Shanaway Rise (LINZ 5169096) and the Auckland Council overland-flow
   lines that pass it, projected north-up into the sheet. They are not a sketch. */

const SERIF = "Newsreader, Georgia, serif";
const MONO = "ui-monospace, monospace";

export function FieldSheet() {
  return (
    <svg
      viewBox="0 0 640 520"
      className="h-auto w-full"
      role="img"
      aria-label="Field sheet for 17 Shanaway Rise, Hillcrest. The parcel outline is LINZ parcel 5169096. Nearby overland flow paths do not cross it. Capital value 1,350,000 dollars."
    >
      <defs>
        <linearGradient id="sheet-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C9DEEC" />
          <stop offset="0.55" stopColor="#D5E8E2" />
          <stop offset="1" stopColor="#E7F2EC" />
        </linearGradient>
        <linearGradient id="sheet-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7FBFA" />
          <stop offset="1" stopColor="#E7F2F0" />
        </linearGradient>
      </defs>
      <rect width="640" height="520" fill="url(#sheet-board)" />
      <rect x="18" y="18" width="604" height="484" fill="url(#sheet-paper)" stroke="#163038" strokeWidth="1.25" />

      <text x="36" y="48" fill="#3F5A64" fontFamily={MONO} fontSize="11" letterSpacing="1.8">
        LINZ PARCEL 5169096
      </text>
      <text x="430" y="48" fill="#3F5A64" fontFamily={MONO} fontSize="11" letterSpacing="1.4">
        2 NOV 2026
      </text>
      <line x1="18" y1="64" x2="622" y2="64" stroke="#163038" strokeWidth="1.25" />
      <line x1="392" y1="64" x2="392" y2="502" stroke="#163038" strokeWidth="1" />

      {/* Auckland Council overland flow paths that pass this parcel. None cross it. */}
      <g fill="none" stroke="#2A6F8F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
        <path d="M207.9 149 L195.3 153.5 L182.8 157.9 L170.3 162.4 L157.6 162.6 L145 162.9 L132.5 167.3 L119.9 167.5 L107.3 167.8 L94.6 168 L82 168.2 L69.5 172.7 L57 177.1 L44.3 177.4 L31.6 173.4" />
        <path d="M370.8 86.9 L358.2 91.4 L345.7 95.8 L333.2 104.5 L320.7 109 L308.2 113.4 L295.6 117.9 L283.2 126.5 L270.6 131 L258.1 135.5 L245.6 139.9 L232.9 140.1 L220.3 140.4 L207.9 149" />
        <path d="M223.3 419.1 L208.5 419.4 L196 423.8 L183.5 428.3 L170.9 432.7 L166.5 420.1 L166.4 415.9" />
        <path d="M166.4 415.9 L170.4 403.2 L166 390.6 L161.5 378 L161.3 365.3 L152.7 357 L144.2 348.7 L143.9 336.1 L147.9 323.3 L139.3 310.8 L139.1 298.1 L138.8 285.5 L142.8 272.7 L142.6 260.1 L142.3 247.4 L137.9 234.8 L137.7 222.1 L129 209.6 L120.4 197.1 L120.2 184.4 L115.7 171.8 L107.3 167.8" />
      </g>
      <g fill="none" stroke="#2A6F8F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M207.9 149 L195.3 153.5 L182.8 157.9 L170.3 162.4 L157.6 162.6 L145 162.9 L132.5 167.3 L119.9 167.5 L107.3 167.8 L94.6 168 L82 168.2 L69.5 172.7 L57 177.1 L44.3 177.4 L31.6 173.4" />
        <path d="M370.8 86.9 L358.2 91.4 L345.7 95.8 L333.2 104.5 L320.7 109 L308.2 113.4 L295.6 117.9 L283.2 126.5 L270.6 131 L258.1 135.5 L245.6 139.9 L232.9 140.1 L220.3 140.4 L207.9 149" />
        <path d="M223.3 419.1 L208.5 419.4 L196 423.8 L183.5 428.3 L170.9 432.7 L166.5 420.1 L166.4 415.9" />
        <path d="M166.4 415.9 L170.4 403.2 L166 390.6 L161.5 378 L161.3 365.3 L152.7 357 L144.2 348.7 L143.9 336.1 L147.9 323.3 L139.3 310.8 L139.1 298.1 L138.8 285.5 L142.8 272.7 L142.6 260.1 L142.3 247.4 L137.9 234.8 L137.7 222.1 L129 209.6 L120.4 197.1 L120.2 184.4 L115.7 171.8 L107.3 167.8" />
      </g>

      {/* LINZ parcel 5169096, north up */}
      <path
        d="M177.8 365.3 L264.5 265.7 L192.6 170.7 L169.1 176.3 L145.5 181.2 Z"
        fill="#E7F3F1"
        fillOpacity="0.92"
        stroke="#163038"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <text x="40" y="96" fill="#163038" fontFamily={MONO} fontSize="12" letterSpacing="1.2">
        N
      </text>

      <text x="36" y="484" fill="#2A6F8F" fontFamily={MONO} fontSize="10" letterSpacing="1.1">
        OVERLAND FLOW · DOES NOT CROSS
      </text>

      {/* right-hand record */}
      <text x="412" y="100" fill="#163038" fontFamily={SERIF} fontSize="22">
        17 Shanaway
      </text>
      <text x="412" y="126" fill="#163038" fontFamily={SERIF} fontSize="22">
        Rise
      </text>
      <text x="412" y="150" fill="#3F5A64" fontFamily={MONO} fontSize="11" letterSpacing="1.4">
        HILLCREST · 687 m²
      </text>

      <line x1="412" y1="170" x2="600" y2="170" stroke="#C5D5D8" />

      <text x="412" y="196" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1.5">
        CAPITAL VALUE
      </text>
      <text x="412" y="230" fill="#163038" fontFamily={SERIF} fontSize="28">
        $1,350,000
      </text>
      <text x="412" y="258" fill="#163038" fontFamily={MONO} fontSize="11" letterSpacing="0.4">
        LAND $1,150,000
      </text>
      <text x="412" y="276" fill="#163038" fontFamily={MONO} fontSize="11" letterSpacing="0.4">
        RATES $4,516 / YR
      </text>

      <line x1="412" y1="296" x2="600" y2="296" stroke="#C5D5D8" />

      <text x="412" y="320" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1.5">
        ENROLMENT ZONES
      </text>
      <text x="412" y="344" fill="#163038" fontFamily={SERIF} fontSize="15">
        Northcote College
      </text>
      <text x="412" y="364" fill="#163038" fontFamily={SERIF} fontSize="15">
        Northcote Intermediate
      </text>
      <text x="412" y="384" fill="#163038" fontFamily={SERIF} fontSize="15">
        Willow Park
      </text>

      <line x1="412" y1="404" x2="600" y2="404" stroke="#C5D5D8" />

      <g transform="translate(412 422)">
        <rect width="168" height="22" fill="#E3F0E8" stroke="#2C6B52" />
        <text x="8" y="15" fill="#2C6B52" fontFamily={MONO} fontSize="9" letterSpacing="0.8">
          FLOOD · NOT ON THE MAP
        </text>
      </g>
      <g transform="translate(412 452)">
        <rect width="168" height="22" fill="#E4EEF4" stroke="#2A6F8F" />
        <text x="8" y="15" fill="#2A6F8F" fontFamily={MONO} fontSize="9" letterSpacing="0.8">
          ZONE · MIXED HOUSING
        </text>
      </g>
    </svg>
  );
}

export function ValuePlate() {
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
      <rect width="320" height="150" fill="#F7FBFA" />
      <text x="16" y="28" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1.6">
        RATING VALUATION
      </text>
      <text x="16" y="68" fill="#163038" fontFamily={SERIF} fontSize="32">
        $1,350,000
      </text>
      <line x1="16" y1="84" x2="304" y2="84" stroke="#C5D5D8" />
      <text x="16" y="108" fill="#163038" fontFamily={MONO} fontSize="11">
        LAND
      </text>
      <text x="150" y="108" fill="#163038" fontFamily={MONO} fontSize="11">
        $1,150,000
      </text>
      <text x="16" y="128" fill="#163038" fontFamily={MONO} fontSize="11">
        RATES
      </text>
      <text x="150" y="128" fill="#163038" fontFamily={MONO} fontSize="11">
        $4,516 / YR
      </text>
    </svg>
  );
}

export function SchoolPlate() {
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
      <rect width="320" height="150" fill="#F7FBFA" />
      <path
        d="M 28 28 L 292 22 L 300 128 L 36 138 Z"
        fill="none"
        stroke="#1A6572"
        strokeWidth="1.25"
      />
      <path
        d="M 58 46 L 250 42 L 258 112 L 66 118 Z"
        fill="#E3F0E8"
        stroke="#2F6B52"
        strokeWidth="1.25"
      />
      <path
        d="M 96 64 L 200 62 L 206 100 L 102 102 Z"
        fill="#E7F3F1"
        stroke="#163038"
        strokeWidth="1.5"
      />
      <text x="112" y="88" fill="#163038" fontFamily={MONO} fontSize="10" letterSpacing="1">
        PARCEL
      </text>
      <text x="214" y="78" fill="#2F6B52" fontFamily={MONO} fontSize="9" letterSpacing="0.8">
        PRIMARY
      </text>
      <text x="248" y="36" fill="#1A6572" fontFamily={MONO} fontSize="9" letterSpacing="0.8">
        COLLEGE
      </text>
    </svg>
  );
}

export function FloodPlate() {
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
      <rect width="320" height="150" fill="#F7FBFA" />
      <path
        d="M 8 96 C 70 70, 110 120, 170 108 C 220 98, 250 40, 318 28"
        fill="none"
        stroke="#2A6F8F"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M 8 96 C 70 70, 110 120, 170 108 C 220 98, 250 40, 318 28"
        fill="none"
        stroke="#2A6F8F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 78 36 L 196 28 L 230 92 L 168 124 L 70 108 Z"
        fill="#E7F3F1"
        fillOpacity="0.92"
        stroke="#163038"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <text x="96" y="84" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1">
        FLOW PATH
      </text>
    </svg>
  );
}

export function ZonePlate() {
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
      <rect width="320" height="150" fill="#F7FBFA" />
      <text x="16" y="36" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1.6">
        UNITARY PLAN · H4
      </text>
      <text x="16" y="72" fill="#163038" fontFamily={SERIF} fontSize="22">
        Mixed Housing
      </text>
      <text x="16" y="98" fill="#163038" fontFamily={SERIF} fontSize="22">
        Suburban
      </text>
      <line x1="200" y1="28" x2="200" y2="122" stroke="#C5D5D8" />
      <text x="214" y="52" fill="#3F5A64" fontFamily={MONO} fontSize="10" letterSpacing="1">
        CHAPTER
      </text>
      <text x="214" y="86" fill="#163038" fontFamily={SERIF} fontSize="28">
        H4
      </text>
    </svg>
  );
}
