export default function HeroProductFallback() {
  return <svg className="vx-hero__fallback-art" viewBox="0 0 760 620" aria-hidden="true">
    <defs>
      <linearGradient id="dragon-plastic" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#7fae8d"/><stop offset=".38" stopColor="#3f7c63"/><stop offset="1" stopColor="#143529"/>
      </linearGradient>
      <linearGradient id="dragon-light" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#dff0cb"/><stop offset="1" stopColor="#3f7c63"/>
      </linearGradient>
      <linearGradient id="car-plastic" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#4c8a68"/><stop offset=".45" stopColor="#2f6a4f"/><stop offset="1" stopColor="#143529"/>
      </linearGradient>
      <linearGradient id="vase-plastic" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#e3d6c2"/><stop offset=".42" stopColor="#c3ad8f"/><stop offset=".75" stopColor="#a08a6c"/><stop offset="1" stopColor="#d8c3a6"/>
      </linearGradient>
      <linearGradient id="robot-plastic" x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor="#cfd8d2"/><stop offset=".5" stopColor="#98a5a1"/><stop offset="1" stopColor="#5f6d68"/>
      </linearGradient>
      <linearGradient id="car-glass" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#dbe9dd"/><stop offset="1" stopColor="#8ba095"/>
      </linearGradient>
      <radialGradient id="showcase-glow">
        <stop stopColor="#b7d9a8" stopOpacity=".2"/><stop offset="1" stopColor="#b7d9a8" stopOpacity="0"/>
      </radialGradient>
      <filter id="product-shadow" x="-.4" y="-.4" width="1.8" height="2">
        <feGaussianBlur in="SourceAlpha" stdDeviation="11"/>
        <feOffset dy="16"/>
        <feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="soft-shadow" x="-.5" y="-.5" width="2" height="2">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
      <symbol id="vxl-dragon-model" viewBox="0 0 340 330">
        <ellipse cx="176" cy="292" rx="115" ry="16" fill="#030b0b" opacity=".34" filter="url(#soft-shadow)"/>
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="#0f2f26" strokeWidth="47" strokeLinecap="round"/>
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="url(#dragon-plastic)" strokeWidth="38" strokeLinecap="round"/>
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="#d8e9d0" strokeOpacity=".62" strokeWidth="2.4" strokeDasharray="1 9" strokeLinecap="round"/>
        <path d="M98 247c-20-5-26-26-21-40m52-21c18 8 24 28 24 42m51-13c22-10 33-27 35-48m-77-18c-2-20 8-39 24-49m-75 34c-20-10-25-31-16-48" fill="none" stroke="#123a2e" strokeWidth="4" strokeDasharray="2 7" opacity=".8"/>
        <g fill="url(#dragon-light)" stroke="#1b4a3a" strokeWidth="3" strokeLinejoin="round">
          <path d="m109 181 6-24 13 20 15-12 5 27Z"/>
          <path d="m143 148 2-23 17 17 13-14 3 26Z"/>
          <path d="m185 113 8-23 13 20 17-11 1 24Z"/>
          <path d="m228 110 10-19 10 22 17-7-3 23Z"/>
          <path d="m73 224 7-20 15 19-4 19Z"/>
        </g>
        <g fill="none" stroke="url(#dragon-light)" strokeWidth="13" strokeLinecap="round">
          <path d="M114 193c-3 21 4 31 16 42l-12 19"/>
          <path d="M217 207c-8 17-1 27 13 35l-5 16"/>
          <path d="M143 228l-19 17m7-2-12 8m115-18 17 14m-8-2 12 7"/>
        </g>
        <g fill="none" stroke="#dff0cb" strokeWidth="3" strokeLinecap="round">
          <path d="m107 253 7 3m95-30 7 3"/>
          <path d="m119 242 5 2m91-25 6 2"/>
        </g>
        <path d="M186 92c9-22 26-33 47-29l22 10 24 4 18 15-6 14-27 8-20 20-25-3-16-13Z" fill="url(#dragon-plastic)" stroke="#123a2e" strokeWidth="4"/>
        <path d="m273 96 29 5-12 17-29-1Z" fill="url(#dragon-light)" stroke="#123a2e" strokeWidth="3"/>
        <path d="m216 74-8-29c14 5 22 13 25 27m23 1 10-25c9 12 12 21 8 31" fill="url(#dragon-light)" stroke="#123a2e" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M188 94c17-17 42-23 64-14" fill="none" stroke="#dff0cb" strokeWidth="3" opacity=".7"/>
        <ellipse cx="256" cy="91" rx="6" ry="5" fill="#d9f79a"/>
        <circle cx="258" cy="91" r="2.5" fill="#0f241d"/>
        <circle cx="295" cy="105" r="2.3" fill="#143529"/>
        <circle cx="287" cy="111" r="1.8" fill="#143529"/>
        <path d="M192 116c16 10 31 14 48 10" fill="none" stroke="#143529" strokeWidth="3" opacity=".7"/>
        <path d="M204 130c14 8 24 10 35 8" fill="none" stroke="#d8e9d0" strokeWidth="2" strokeDasharray="1 7" opacity=".8"/>
      </symbol>
      <symbol id="vxl-car-model" viewBox="0 0 320 190">
        <ellipse cx="163" cy="158" rx="126" ry="16" fill="#030b0b" opacity=".36" filter="url(#soft-shadow)"/>
        <path d="M34 126 48 99l53-12 38-42 76 1 36 42 34 10 14 28-15 17H46Z" fill="url(#car-plastic)" stroke="#0f2a20" strokeWidth="5" strokeLinejoin="round"/>
        <path d="m117 86 31-31h59l27 34Z" fill="url(#car-glass)" stroke="#12332a" strokeWidth="4" strokeLinejoin="round"/>
        <path d="m154 57-3 29m51-29 5 30" fill="none" stroke="#7b8f84" strokeWidth="3"/>
        <path d="M44 121c58-13 142-17 248-3" fill="none" stroke="#dcefdc" strokeWidth="2.5" strokeDasharray="1 8" opacity=".85"/>
        <path d="M50 132c61 9 154 12 253 0" fill="none" stroke="#173d32" strokeWidth="3" strokeDasharray="1 7" opacity=".9"/>
        <path d="m38 119 23-5 1 13-24 2m270-15-23-4-1 12 23 3" fill="#cfe6d2" stroke="#7a5c4c" strokeWidth="3"/>
        <g fill="#c9d3c9" stroke="#b9d3c0" strokeWidth="5">
          <circle cx="91" cy="139" r="25"/><circle cx="245" cy="139" r="25"/>
        </g>
        <g fill="#6f8479" stroke="#d5e4d4" strokeWidth="3">
          <circle cx="91" cy="139" r="11"/><circle cx="245" cy="139" r="11"/>
        </g>
        <g fill="none" stroke="#eaf2ea" strokeWidth="2" strokeDasharray="1 5">
          <path d="M72 120c4-5 9-7 14-8m136 8c5-5 10-7 16-8"/>
          <path d="M66 103c43-9 95-13 151-11m-128 24h21m133-2h18"/>
        </g>
      </symbol>
      <symbol id="vxl-vase-model" viewBox="0 0 220 330">
        <ellipse cx="110" cy="304" rx="70" ry="13" fill="#030b0b" opacity=".34" filter="url(#soft-shadow)"/>
        <path d="M83 47c-1 24 1 40-5 62-8 28-32 58-27 102 5 43 23 77 59 80 37 2 56-31 60-74 4-43-19-78-28-108-7-22-5-39-5-62Z" fill="url(#vase-plastic)" stroke="#bfa98a" strokeWidth="5"/>
        <ellipse cx="110" cy="48" rx="28" ry="10" fill="#ab9578" stroke="#e4d7c3" strokeWidth="4"/>
        <ellipse cx="110" cy="48" rx="18" ry="5" fill="#d8cbb8"/>
        <path d="M84 55c0 21 1 37-6 58-9 30-29 58-25 97 4 38 21 67 57 73m28-228c0 21-1 37 6 58 9 30 29 58 25 97-4 38-21 67-57 73" fill="none" stroke="#ece1cf" strokeOpacity=".7" strokeWidth="2" strokeDasharray="2 8"/>
        <path d="M68 196c23 13 61 19 88 8m-91 14c24 13 66 17 92 6m-89 16c24 12 63 14 86 4m-77 21c21 8 46 9 64 4" fill="none" stroke="#b39d80" strokeWidth="2" strokeDasharray="1 7"/>
        <path d="M94 61c4 41-2 63-14 92m43-89c-1 43 2 67 15 95m-56-93c0 28-5 50-17 74m72-69c2 33 8 51 18 72" fill="none" stroke="#e8dcc9" strokeWidth="3" opacity=".55"/>
        <path d="M77 290c21 9 47 10 68 1" fill="none" stroke="#efe3d1" strokeWidth="3" strokeDasharray="2 7"/>
      </symbol>
      <symbol id="vxl-robot-model" viewBox="0 0 250 320">
        <ellipse cx="126" cy="298" rx="76" ry="13" fill="#030b0b" opacity=".34" filter="url(#soft-shadow)"/>
        <path d="M124 38V19m0 0-13-10m13 10 13-10" fill="none" stroke="#9fb5aa" strokeWidth="7" strokeLinecap="round"/>
        <circle cx="124" cy="13" r="7" fill="#d9f79a"/>
        <rect x="76" y="42" width="98" height="74" rx="22" fill="url(#robot-plastic)" stroke="#22332c" strokeWidth="5"/>
        <rect x="88" y="58" width="75" height="37" rx="12" fill="#12211b" stroke="#c8f36a" strokeWidth="3"/>
        <circle cx="109" cy="76" r="7" fill="#d9f79a"/><circle cx="143" cy="76" r="7" fill="#d9f79a"/>
        <path d="M108 101c10 8 26 8 37 0" fill="none" stroke="#eef4ea" strokeWidth="3" strokeLinecap="round"/>
        <path d="M94 52h57" fill="none" stroke="#e8efe6" strokeWidth="2" strokeDasharray="1 7" opacity=".8"/>
        <path d="M76 134c0-11 9-20 20-20h58c12 0 21 9 21 20v69H76Z" fill="url(#robot-plastic)" stroke="#22332c" strokeWidth="5"/>
        <rect x="95" y="133" width="39" height="35" rx="9" fill="#b9c4bb" stroke="#8d7c6a" strokeWidth="4"/>
        <path d="M84 177h73m-73 9h73m-73 9h73" fill="none" stroke="#d8e2da" strokeWidth="2" strokeDasharray="2 7" opacity=".8"/>
        <path d="m83 143-24 12-1 44m107-56 24 12 1 44" fill="none" stroke="#7d9188" strokeWidth="18" strokeLinecap="round"/>
        <circle cx="58" cy="201" r="12" fill="#b9c4bb" stroke="#22332c" strokeWidth="4"/>
        <circle cx="191" cy="201" r="12" fill="#b9c4bb" stroke="#22332c" strokeWidth="4"/>
        <path d="M96 204v39m57-39v39" fill="none" stroke="#7c8f83" strokeWidth="24" strokeLinecap="round"/>
        <path d="M85 220h23m34 0h24" stroke="#d8e2da" strokeWidth="2" strokeDasharray="2 6"/>
        <path d="M96 248c-8 12-11 24-10 39h30l-4-39m31 0c-8 12-11 24-10 39h30l-4-39" fill="#8fa39a" stroke="#22332c" strokeWidth="5" strokeLinejoin="round"/>
        <path d="M89 280h24m35 0h24" stroke="#e8efe6" strokeWidth="3" strokeDasharray="2 7"/>
        <circle cx="136" cy="150" r="4" fill="#d9f79a"/>
        <circle cx="148" cy="150" r="4" fill="#dccdb6"/>
      </symbol>
    </defs>
    <ellipse cx="384" cy="330" rx="340" ry="270" fill="url(#showcase-glow)"/>
    <ellipse cx="360" cy="428" rx="150" ry="22" fill="#040b0b" opacity=".55" filter="url(#soft-shadow)"/>
    <ellipse cx="141" cy="512" rx="96" ry="15" fill="#040b0b" opacity=".5" filter="url(#soft-shadow)"/>
    <ellipse cx="615" cy="455" rx="62" ry="11" fill="#040b0b" opacity=".5" filter="url(#soft-shadow)"/>
    <ellipse cx="117" cy="382" rx="58" ry="10" fill="#040b0b" opacity=".45" filter="url(#soft-shadow)"/>
    <g className="vxl-fallback-product vxl-fallback-product--dragon" filter="url(#product-shadow)">
      <use href="#vxl-dragon-model" x="208" y="104" width="335" height="325"/>
    </g>
    <g className="vxl-fallback-product vxl-fallback-product--car" filter="url(#product-shadow)">
      <use href="#vxl-car-model" x="30" y="380" width="222" height="132"/>
    </g>
    <g className="vxl-fallback-product vxl-fallback-product--vase" filter="url(#product-shadow)">
      <use href="#vxl-vase-model" x="545" y="245" width="140" height="210"/>
    </g>
    <g className="vxl-fallback-product vxl-fallback-product--robot" filter="url(#product-shadow)">
      <use href="#vxl-robot-model" x="45" y="196" width="145" height="186"/>
    </g>
    <path d="M73 545h82m480 0h62M111 563h41m479 0h28" stroke="#a9c4ae" strokeOpacity=".42" strokeWidth="1"/>
  </svg>;
}
