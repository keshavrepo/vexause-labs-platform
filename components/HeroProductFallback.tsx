export default function HeroProductFallback() {
  return <svg className="vxl-showcase-art" viewBox="0 0 760 620" aria-hidden="true">
    <defs>
      <linearGradient id="dragon-plastic" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#b9f08b"/><stop offset=".38" stopColor="#54a979"/><stop offset="1" stopColor="#174d46"/>
      </linearGradient>
      <linearGradient id="dragon-light" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#d8ffac"/><stop offset="1" stopColor="#4a966f"/>
      </linearGradient>
      <linearGradient id="car-plastic" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#ffd493"/><stop offset=".45" stopColor="#e7794e"/><stop offset="1" stopColor="#983d37"/>
      </linearGradient>
      <linearGradient id="vase-plastic" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#eaa58b"/><stop offset=".42" stopColor="#b75d64"/><stop offset=".75" stopColor="#7b3b58"/><stop offset="1" stopColor="#d18273"/>
      </linearGradient>
      <linearGradient id="robot-plastic" x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor="#9fe7d2"/><stop offset=".5" stopColor="#4a9eb0"/><stop offset="1" stopColor="#24536d"/>
      </linearGradient>
      <linearGradient id="car-glass" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#d7f0dc"/><stop offset="1" stopColor="#426c68"/>
      </linearGradient>
      <radialGradient id="showcase-glow">
        <stop stopColor="#a4e998" stopOpacity=".2"/><stop offset="1" stopColor="#a4e998" stopOpacity="0"/>
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
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="#123b36" strokeWidth="47" strokeLinecap="round"/>
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="url(#dragon-plastic)" strokeWidth="38" strokeLinecap="round"/>
        <path d="M99 270C49 253 54 192 103 181c47-11 68 42 110 33 51-11 59-69 27-98-28-25-70-17-91 12-19 26-43 42-65 26-29-21-19-63 13-79 22-11 41-11 56-3" fill="none" stroke="#d7ffc1" strokeOpacity=".62" strokeWidth="2.4" strokeDasharray="1 9" strokeLinecap="round"/>
        <path d="M98 247c-20-5-26-26-21-40m52-21c18 8 24 28 24 42m51-13c22-10 33-27 35-48m-77-18c-2-20 8-39 24-49m-75 34c-20-10-25-31-16-48" fill="none" stroke="#174c42" strokeWidth="4" strokeDasharray="2 7" opacity=".8"/>
        <g fill="url(#dragon-light)" stroke="#23634f" strokeWidth="3" strokeLinejoin="round">
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
        <g fill="none" stroke="#d8ffac" strokeWidth="3" strokeLinecap="round">
          <path d="m107 253 7 3m95-30 7 3"/>
          <path d="m119 242 5 2m91-25 6 2"/>
        </g>
        <path d="M186 92c9-22 26-33 47-29l22 10 24 4 18 15-6 14-27 8-20 20-25-3-16-13Z" fill="url(#dragon-plastic)" stroke="#16453e" strokeWidth="4"/>
        <path d="m273 96 29 5-12 17-29-1Z" fill="url(#dragon-light)" stroke="#16453e" strokeWidth="3"/>
        <path d="m216 74-8-29c14 5 22 13 25 27m23 1 10-25c9 12 12 21 8 31" fill="url(#dragon-light)" stroke="#16453e" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M188 94c17-17 42-23 64-14" fill="none" stroke="#e3ffc6" strokeWidth="3" opacity=".7"/>
        <ellipse cx="256" cy="91" rx="6" ry="5" fill="#eaff86"/>
        <circle cx="258" cy="91" r="2.5" fill="#132c29"/>
        <circle cx="295" cy="105" r="2.3" fill="#17453d"/>
        <circle cx="287" cy="111" r="1.8" fill="#17453d"/>
        <path d="M192 116c16 10 31 14 48 10" fill="none" stroke="#15463d" strokeWidth="3" opacity=".7"/>
        <path d="M204 130c14 8 24 10 35 8" fill="none" stroke="#d7ffc1" strokeWidth="2" strokeDasharray="1 7" opacity=".8"/>
      </symbol>
      <symbol id="vxl-car-model" viewBox="0 0 320 190">
        <ellipse cx="163" cy="158" rx="126" ry="16" fill="#030b0b" opacity=".36" filter="url(#soft-shadow)"/>
        <path d="M34 126 48 99l53-12 38-42 76 1 36 42 34 10 14 28-15 17H46Z" fill="url(#car-plastic)" stroke="#6b312f" strokeWidth="5" strokeLinejoin="round"/>
        <path d="m117 86 31-31h59l27 34Z" fill="url(#car-glass)" stroke="#793b38" strokeWidth="4" strokeLinejoin="round"/>
        <path d="m154 57-3 29m51-29 5 30" fill="none" stroke="#436864" strokeWidth="3"/>
        <path d="M44 121c58-13 142-17 248-3" fill="none" stroke="#ffe0a6" strokeWidth="2.5" strokeDasharray="1 8" opacity=".85"/>
        <path d="M50 132c61 9 154 12 253 0" fill="none" stroke="#9e4840" strokeWidth="3" strokeDasharray="1 7" opacity=".9"/>
        <path d="m38 119 23-5 1 13-24 2m270-15-23-4-1 12 23 3" fill="#fff1bc" stroke="#8b453c" strokeWidth="3"/>
        <g fill="#1b2221" stroke="#f4c588" strokeWidth="5">
          <circle cx="91" cy="139" r="25"/><circle cx="245" cy="139" r="25"/>
        </g>
        <g fill="#4d7b70" stroke="#d9e8ca" strokeWidth="3">
          <circle cx="91" cy="139" r="11"/><circle cx="245" cy="139" r="11"/>
        </g>
        <g fill="none" stroke="#e7fff0" strokeWidth="2" strokeDasharray="1 5">
          <path d="M72 120c4-5 9-7 14-8m136 8c5-5 10-7 16-8"/>
          <path d="M66 103c43-9 95-13 151-11m-128 24h21m133-2h18"/>
        </g>
      </symbol>
      <symbol id="vxl-vase-model" viewBox="0 0 220 330">
        <ellipse cx="110" cy="304" rx="70" ry="13" fill="#030b0b" opacity=".34" filter="url(#soft-shadow)"/>
        <path d="M83 47c-1 24 1 40-5 62-8 28-32 58-27 102 5 43 23 77 59 80 37 2 56-31 60-74 4-43-19-78-28-108-7-22-5-39-5-62Z" fill="url(#vase-plastic)" stroke="#512a48" strokeWidth="5"/>
        <ellipse cx="110" cy="48" rx="28" ry="10" fill="#5b304d" stroke="#f3b49b" strokeWidth="4"/>
        <ellipse cx="110" cy="48" rx="18" ry="5" fill="#231c25"/>
        <path d="M84 55c0 21 1 37-6 58-9 30-29 58-25 97 4 38 21 67 57 73m28-228c0 21-1 37 6 58 9 30 29 58 25 97-4 38-21 67-57 73" fill="none" stroke="#f6c0a3" strokeOpacity=".7" strokeWidth="2" strokeDasharray="2 8"/>
        <path d="M68 196c23 13 61 19 88 8m-91 14c24 13 66 17 92 6m-89 16c24 12 63 14 86 4m-77 21c21 8 46 9 64 4" fill="none" stroke="#67334e" strokeWidth="2" strokeDasharray="1 7"/>
        <path d="M94 61c4 41-2 63-14 92m43-89c-1 43 2 67 15 95m-56-93c0 28-5 50-17 74m72-69c2 33 8 51 18 72" fill="none" stroke="#f3bba3" strokeWidth="3" opacity=".55"/>
        <path d="M77 290c21 9 47 10 68 1" fill="none" stroke="#f6c3a9" strokeWidth="3" strokeDasharray="2 7"/>
      </symbol>
      <symbol id="vxl-robot-model" viewBox="0 0 250 320">
        <ellipse cx="126" cy="298" rx="76" ry="13" fill="#030b0b" opacity=".34" filter="url(#soft-shadow)"/>
        <path d="M124 38V19m0 0-13-10m13 10 13-10" fill="none" stroke="#4bb5b4" strokeWidth="7" strokeLinecap="round"/>
        <circle cx="124" cy="13" r="7" fill="#e5ff86"/>
        <rect x="76" y="42" width="98" height="74" rx="22" fill="url(#robot-plastic)" stroke="#153c50" strokeWidth="5"/>
        <rect x="88" y="58" width="75" height="37" rx="12" fill="#102c3b" stroke="#8ae3d5" strokeWidth="3"/>
        <circle cx="109" cy="76" r="7" fill="#e7ff87"/><circle cx="143" cy="76" r="7" fill="#e7ff87"/>
        <path d="M108 101c10 8 26 8 37 0" fill="none" stroke="#c3fff0" strokeWidth="3" strokeLinecap="round"/>
        <path d="M94 52h57" fill="none" stroke="#d4fff0" strokeWidth="2" strokeDasharray="1 7" opacity=".8"/>
        <path d="M76 134c0-11 9-20 20-20h58c12 0 21 9 21 20v69H76Z" fill="url(#robot-plastic)" stroke="#153c50" strokeWidth="5"/>
        <rect x="95" y="133" width="39" height="35" rx="9" fill="#d89358" stroke="#6d4542" strokeWidth="4"/>
        <path d="M84 177h73m-73 9h73m-73 9h73" fill="none" stroke="#baf4e4" strokeWidth="2" strokeDasharray="2 7" opacity=".8"/>
        <path d="m83 143-24 12-1 44m107-56 24 12 1 44" fill="none" stroke="#3b8497" strokeWidth="18" strokeLinecap="round"/>
        <circle cx="58" cy="201" r="12" fill="#e6a16c" stroke="#153c50" strokeWidth="4"/>
        <circle cx="191" cy="201" r="12" fill="#e6a16c" stroke="#153c50" strokeWidth="4"/>
        <path d="M96 204v39m57-39v39" fill="none" stroke="#286377" strokeWidth="24" strokeLinecap="round"/>
        <path d="M85 220h23m34 0h24" stroke="#baf4e4" strokeWidth="2" strokeDasharray="2 6"/>
        <path d="M96 248c-8 12-11 24-10 39h30l-4-39m31 0c-8 12-11 24-10 39h30l-4-39" fill="#357e8d" stroke="#153c50" strokeWidth="5" strokeLinejoin="round"/>
        <path d="M89 280h24m35 0h24" stroke="#d4fff0" strokeWidth="3" strokeDasharray="2 7"/>
        <circle cx="136" cy="150" r="4" fill="#e9ff83"/>
        <circle cx="148" cy="150" r="4" fill="#f3a47c"/>
      </symbol>
    </defs>
    <ellipse cx="384" cy="310" rx="335" ry="275" fill="url(#showcase-glow)"/>
    <ellipse cx="382" cy="530" rx="278" ry="35" fill="#040b0b" opacity=".6" filter="url(#soft-shadow)"/>
    <ellipse cx="382" cy="522" rx="288" ry="43" fill="#172722" stroke="#718f70" strokeOpacity=".6" strokeWidth="2"/>
    <ellipse cx="382" cy="511" rx="244" ry="31" fill="#23392f" stroke="#c8f36a" strokeOpacity=".38" strokeWidth="1.5"/>
    <ellipse cx="382" cy="510" rx="196" ry="20" fill="none" stroke="#91b883" strokeOpacity=".42" strokeDasharray="2 8"/>
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
    <path d="M73 545h82m480 0h62M111 563h41m479 0h28" stroke="#b9d1ac" strokeOpacity=".42" strokeWidth="1"/>
  </svg>;
}
