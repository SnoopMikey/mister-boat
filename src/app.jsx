// Mister Boat — Checklist App
// Nautical logbook aesthetic. Two primary flows: Cast Off & Dock Up.

const { useState, useEffect, useRef, useMemo } = React;

const MB = {
  ink: '#0B2545',
  inkSoft: '#13386B',
  paper: '#F5EDDD',
  paperDeep: '#EADFC7',
  paperEdge: '#D9C9A8',
  red: '#D1353B',
  redDeep: '#A6282D',
  sky: '#7FB3D5',
  skyDeep: '#4A7FA8',
  sun: '#F4C430',
  rope: '#C9A26C',
  ropeDark: '#8E6F42',
  sea: '#0F4C75'
};

// Resolve assets relative to the page so deploys under a subpath
// (e.g. GitHub Pages /mister-boat/) work without rewriting imports.
const ASSET_BASE = new URL('./assets/', document.baseURI).href;
const MISTER_BOAT_IMG = ASSET_BASE + 'mister-boat-clean.png';
const MISTER_BOAT_WATERLINE = ASSET_BASE + 'mister-boat-waterline.png';

const LS_KEYS = {
  depart: 'mb.depart.v1',
  dock: 'mb.dock.v1',
  captain: 'mb.captain.v1',
  lastVoyage: 'mb.lastVoyage.v1'
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const DEFAULT_DEPART = [
{ group: 'On the Dock', items: [
  { id: 'd1', t: 'Check weather & tides', hint: 'NOAA, wind under 15kn' },
  { id: 'd2', t: 'File float plan with a mate', hint: 'Who knows you’re out?' },
  { id: 'd3', t: 'Load cooler & fresh water', hint: 'Two bottles per soul' }]
},
{ group: 'Safety Sweep', items: [
  { id: 'd4', t: 'Life jackets for every soul', hint: 'Size-check the kiddos' },
  { id: 'd5', t: 'Throwable cushion on deck', hint: 'Type IV, within reach' },
  { id: 'd6', t: 'Flares & horn within reach', hint: 'Check expiry dates' },
  { id: 'd7', t: 'Fire extinguisher charged', hint: 'Gauge in the green' }]
},
{ group: 'Engine Room', items: [
  { id: 'd8', t: 'Open seacocks & raw-water', hint: 'Listen for the gurgle' },
  { id: 'd9', t: 'Check oil & coolant', hint: 'Warm dipstick, steady level' },
  { id: 'd10', t: 'Sniff the bilge', hint: 'No fumes before spark' },
  { id: 'd11', t: 'Start engine — watch telltale', hint: 'Cooling water flowing' }]
},
{ group: 'Cast Off', items: [
  { id: 'd12', t: 'Stow loose gear below', hint: 'Nothing rolling around' },
  { id: 'd13', t: 'Fenders rigged port & stbd', hint: 'Until you clear the slip' },
  { id: 'd14', t: 'Untie lines — stern first', hint: 'Then spring, then bow' }]
}];


const DEFAULT_DOCK = [
{ group: 'Approach', items: [
  { id: 'r1', t: 'Rig fenders & dock lines', hint: 'Bow, stern, two springs' },
  { id: 'r2', t: 'Idle speed in the harbor', hint: 'Slow is pro' },
  { id: 'r3', t: 'Tie up bow, stern, springs', hint: 'Cleat hitch, no slip' }]
},
{ group: 'Engine Down', items: [
  { id: 'r4', t: 'Kill engine & fuel valve', hint: 'Ignition off, key out' },
  { id: 'r5', t: 'Close seacocks', hint: 'All except cockpit drain' },
  { id: 'r6', t: 'Switch battery to OFF', hint: 'Main panel, master switch' }]
},
{ group: 'Tidy Ship', items: [
  { id: 'r7', t: 'Pump & flush the head', hint: 'Leave it sweet' },
  { id: 'r8', t: 'Empty cooler & trash', hint: 'Nothing for the gulls' },
  { id: 'r9', t: 'Rinse salt off deck', hint: 'Quick hose-down' },
  { id: 'r10', t: 'Fold & stow canvas', hint: 'Cover or bimini' }]
},
{ group: 'Lock Up', items: [
  { id: 'r11', t: 'Companionway locked', hint: 'Hatch boards in' },
  { id: 'r12', t: 'Shore power plugged in', hint: 'If staying overnight' },
  { id: 'r13', t: 'Log today’s voyage', hint: 'Hours, weather, highlights' }]
}];


function RopeLine({ color = MB.rope, height = 10, style = {} }) {
  return (
    <div style={{
      height,
      background: `repeating-linear-gradient(75deg,
        ${color} 0 6px,
        ${shade(color, -0.12)} 6px 9px,
        ${color} 9px 12px,
        ${shade(color, 0.10)} 12px 14px)`,
      borderRadius: height / 2,
      boxShadow: `inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.3)`,
      ...style
    }} />);

}

function shade(hex, amt) {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  let r = (n >> 16) + Math.round(255 * amt);
  let g = (n >> 8 & 0xff) + Math.round(255 * amt);
  let b = (n & 0xff) + Math.round(255 * amt);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function CompassStamp({ size = 72, color = MB.ink, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="1 3" />
      <polygon points="50,10 54,50 50,54 46,50" fill={color} />
      <polygon points="50,90 54,50 50,46 46,50" fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points="10,50 50,54 54,50 50,46" fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points="90,50 50,54 46,50 50,46" fill="none" stroke={color} strokeWidth="1.5" />
      <text x="50" y="24" textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill={color}>N</text>
      <text x="50" y="82" textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill={color}>S</text>
      <text x="18" y="54" textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill={color}>W</text>
      <text x="82" y="54" textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill={color}>E</text>
    </svg>);

}

function LifePreserver({ size = 28, checked = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <clipPath id={`lp-clip-${size}`}>
          <path d="M 20 2 A 18 18 0 1 0 20 38 A 18 18 0 1 0 20 2 Z M 20 12 A 8 8 0 1 1 20 28 A 8 8 0 1 1 20 12 Z" fillRule="evenodd" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="18" fill="#FDFBF5" stroke={MB.ink} strokeWidth="1.3" />
      <g clipPath={`url(#lp-clip-${size})`}>
        <rect x="0" y="0" width="20" height="20" fill={MB.red} />
        <rect x="20" y="20" width="20" height="20" fill={MB.red} />
      </g>
      <circle cx="20" cy="20" r="8" fill={checked ? MB.sky : 'transparent'} stroke={MB.ink} strokeWidth="1.3" />
      {checked &&
      <path d="M 15.5 20.2 L 19 23.5 L 25 16.5"
      fill="none" stroke="#FDFBF5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>);

}

function Pennant({ color, text, tilt = 0 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transform: `rotate(${tilt}deg)`,
      background: color, color: MB.paper,
      clipPath: 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%)',
      padding: '3px 18px 3px 10px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase'
    }}>{text}</div>);

}

function Anchor({ size = 24, color = MB.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="6" r="3" stroke={color} strokeWidth="2" />
      <path d="M 16 9 L 16 26" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M 11 14 L 21 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M 5 20 C 5 26, 11 28, 16 28 C 21 28, 27 26, 27 20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 5 20 L 2 17 M 5 20 L 8 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M 27 20 L 24 17 M 27 20 L 30 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>);

}

function Wheel({ size = 24, color = MB.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" />
      <circle cx="16" cy="16" r="2" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = a * Math.PI / 180;
        const x1 = 16 + Math.cos(rad) * 6,y1 = 16 + Math.sin(rad) * 6;
        const x2 = 16 + Math.cos(rad) * 14,y2 = 16 + Math.sin(rad) * 14;
        const cx = 16 + Math.cos(rad) * 15,cy = 16 + Math.sin(rad) * 15;
        return (
          <g key={a}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
            <circle cx={cx} cy={cy} r="1.6" fill={color} />
          </g>);

      })}
    </svg>);

}

function PaperBackdrop({ tone = MB.paper, grain = 0.06 }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `
        radial-gradient(ellipse 140% 80% at 50% -10%, ${shade(tone, 0.04)} 0%, transparent 60%),
        radial-gradient(ellipse 100% 60% at 50% 110%, ${shade(tone, -0.06)} 0%, transparent 55%),
        ${tone}
      `
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'multiply' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.1, 0 0 0 0 0.15, 0 0 0 0 0.3, 0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>);

}

function Waves({ color = MB.sky, dark = MB.skyDeep, height = 40 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 400 40" preserveAspectRatio="none"
    style={{ display: 'block' }}>
      <path d="M0,20 C 50,5  100,35  150,20 S 250,5   300,20 S 400,35 400,20 L 400 40 L 0 40 Z"
      fill={color} />
      <path d="M0,28 C 50,15 100,40  150,28 S 250,15  300,28 S 400,40 400,28 L 400 40 L 0 40 Z"
      fill={dark} opacity="0.8" />
    </svg>);

}

function MisterBoat({ size = 140, float = true, waterline = false, style = {} }) {
  const src = waterline ? MISTER_BOAT_WATERLINE : MISTER_BOAT_IMG;
  const ratio = waterline ? 672 / 1024 : 1084 / 1024;
  return (
    <div style={{
      width: size, height: size * ratio,
      animation: float ? 'mb-float 4.2s ease-in-out infinite' : 'none',
      filter: 'drop-shadow(0 6px 0 rgba(11,37,69,0.12))',
      ...style
    }}>
      <img src={src} alt="Mister Boat"
      style={{
        width: '100%', height: '100%', objectFit: 'contain',
        userSelect: 'none', pointerEvents: 'none'
      }} />
    </div>);

}

function ChecklistRow({ item, checked, onToggle, accent }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 14px 14px 10px',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px dashed ${MB.paperEdge}`,
        textAlign: 'left',
        cursor: 'pointer',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent'
      }}>

      <div style={{
        transform: checked ? 'scale(1.08) rotate(-6deg)' : 'scale(1)',
        transition: 'transform 220ms cubic-bezier(.34,1.56,.64,1)'
      }}>
        <LifePreserver size={32} checked={checked} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Work Sans', system-ui, sans-serif",
          fontSize: 20, fontWeight: 600, lineHeight: 1.2,
          letterSpacing: '-0.005em',
          color: MB.ink,
          opacity: checked ? 0.45 : 1,
          textDecoration: checked ? 'line-through' : 'none',
          textDecorationColor: accent || MB.red,
          textDecorationThickness: '2px',
          transition: 'opacity 200ms'
        }}>{item.t}</div>
        {item.hint &&
        <div style={{
          marginTop: 3,
          fontFamily: "'Work Sans', sans-serif",
          fontSize: 13, lineHeight: 1.35, letterSpacing: '0.01em',
          color: MB.inkSoft, opacity: checked ? 0.35 : 0.75
        }}>{item.hint}</div>
        }
      </div>
      {checked &&
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        color: accent || MB.red,
        border: `1.5px solid ${accent || MB.red}`,
        padding: '3px 6px',
        transform: 'rotate(-8deg)',
        textTransform: 'uppercase',
        animation: 'mb-stamp 280ms cubic-bezier(.34,1.56,.64,1)',
        whiteSpace: 'nowrap'
      }}>AYE</div>
      }
    </button>);

}

function GroupCard({ title, children, accent, index }) {
  return (
    <div style={{
      background: '#FDFBF5',
      borderRadius: 18,
      border: `1px solid ${MB.paperEdge}`,
      boxShadow: '0 2px 0 rgba(11,37,69,0.06), 0 8px 18px -10px rgba(11,37,69,0.18)',
      overflow: 'hidden',
      marginBottom: 18,
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 38, height: 38,
        background: `linear-gradient(135deg, transparent 50%, ${MB.paperDeep} 50%)`
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${MB.paperEdge}`,
        background: `linear-gradient(180deg, ${MB.paperDeep}, transparent)`
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: accent, color: MB.paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800,
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)'
        }}>{String(index + 1).padStart(2, '0').slice(-2)[0]}</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: MB.ink
        }}>{title}</div>
      </div>
      <div>{children}</div>
    </div>);

}

function Home({ onGo, departProgress, dockProgress, captainName, lastVoyage }) {
  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 40 }}>
      <PaperBackdrop />
      <div style={{ position: 'relative', padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 22px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
              color: MB.inkSoft, textTransform: 'uppercase'
            }}>— Ahoy, {captainName} —</div>
            <h1 style={{
              margin: '4px 0 0',
              fontFamily: "'Abril Fatface', serif",
              fontSize: 44, lineHeight: 0.95,
              color: MB.ink, letterSpacing: '-0.01em'
            }}>Mister<br />Boat.</h1>
          </div>
          <div style={{ marginTop: 4, opacity: 0.85 }}>
            <CompassStamp size={66} color={MB.ink} opacity={0.7} />
          </div>
        </div>

        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Pennant color={MB.red} text={"Captain’s Log"} />
          <div style={{
            fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: MB.inkSoft
          }}>Last voyage: <b style={{ color: MB.ink }}>{lastVoyage}</b></div>
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 2, height: 250, overflow: 'hidden' }}>
        <svg
          viewBox="0 0 120 220"
          width="120" height="220"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            left: '50%', bottom: 18,
            transform: 'translateX(-18px)',
            zIndex: 2,
            pointerEvents: 'none',
            animation: 'mb-float 4.2s ease-in-out infinite'
          }}>

          <path d="M 44 118 Q 54 60 58 6"
          stroke={MB.redDeep} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 44 118 Q 54 60 58 6"
          stroke={MB.red} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="43" cy="119" r="2.4" fill={MB.ink} />
          <path d="M 58 6 Q 62 80 62 172"
          stroke={MB.ink} strokeWidth="0.7" fill="none" />
          <circle cx="62" cy="176" r="5.2" fill="#FDFBF5" stroke={MB.ink} strokeWidth="0.9" />
          <path d="M 56.9 176 A 5.2 5.2 0 0 1 67.1 176 Z" fill={MB.red} stroke={MB.ink} strokeWidth="0.9" />
          <circle cx="62" cy="176" r="0.9" fill={MB.ink} />
          <ellipse cx="62" cy="182" rx="8" ry="1.4" fill="none" stroke={MB.skyDeep} strokeWidth="0.7" opacity="0.6" />
          <ellipse cx="62" cy="184" rx="12" ry="1.8" fill="none" stroke={MB.skyDeep} strokeWidth="0.5" opacity="0.35" />
        </svg>
        <div style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', zIndex: 1 }}>
          <MisterBoat size={210} />
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, zIndex: 0,
          background: `linear-gradient(180deg, transparent 0%, ${MB.sky}00 20%, ${MB.sky}55 60%, ${MB.sky}88 100%)`,
          WebkitMaskImage: `linear-gradient(180deg, transparent 0%, #000 40%, #000 72%, transparent 100%)`,
          maskImage: `linear-gradient(180deg, transparent 0%, #000 40%, #000 72%, transparent 100%)`
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 4, height: 42, zIndex: 2,
          WebkitMaskImage: `linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)`,
          maskImage: `linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)`
        }}>
          <Waves color={MB.sky} dark={MB.skyDeep} height={42} />
        </div>
        <div style={{
          position: 'absolute', top: 10, right: 28,
          width: 38, height: 38, borderRadius: '50%',
          background: MB.sun,
          boxShadow: `0 0 0 6px ${shade(MB.sun, 0.2)}33, 0 0 0 14px ${shade(MB.sun, 0.2)}1a`
        }} />
        <svg style={{ position: 'absolute', left: 22, top: 50 }} width="40" height="40" viewBox="0 0 40 40">
          <path d="M 20 5 L 20 30 L 6 30 Z" fill={MB.paper} stroke={MB.ink} strokeWidth="1" />
          <path d="M 20 12 L 32 30 L 20 30 Z" fill="#EADFC7" stroke={MB.ink} strokeWidth="1" />
          <rect x="19" y="4" width="2" height="28" fill={MB.ink} />
        </svg>
      </div>

      <div style={{ padding: '0 18px', marginTop: 0 }}>
        <ActionTile
          kind="depart"
          title="Cast Off"
          subtitle="Ready the vessel to leave the slip"
          progress={departProgress}
          color={MB.red}
          onClick={() => onGo('depart')}
          icon={<Anchor size={30} color={MB.paper} />} />

        <ActionTile
          kind="dock"
          title="Dock Up"
          subtitle="Button her up at the end of the day"
          progress={dockProgress}
          color={MB.sea}
          onClick={() => onGo('dock')}
          icon={<Wheel size={30} color={MB.paper} />} />

      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '16px 20px 0' }}>
        {['#D1353B', '#F4C430', '#7FB3D5', '#F5EDDD', '#D1353B', '#0F4C75', '#F4C430'].map((c, i) =>
        <div key={i} style={{
          width: 16, height: 22,
          background: c, border: `1px solid ${MB.ink}33`,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          transform: `translateY(${i % 2 * 2}px)`
        }} />
        )}
      </div>
      <div style={{
        textAlign: 'center', marginTop: 10,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.24em', color: MB.inkSoft, textTransform: 'uppercase'
      }}>Smooth seas &middot; Following winds</div>
    </div>);

}

function ActionTile({ title, subtitle, progress, color, onClick, icon, kind }) {
  const pct = progress.total === 0 ? 0 : Math.round(progress.done / progress.total * 100);
  const complete = pct === 100;
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: 0, marginBottom: 14,
      background: 'transparent', border: 'none', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <div style={{
        position: 'relative',
        background: '#FDFBF5',
        border: `1.5px solid ${MB.ink}`,
        borderRadius: 20,
        padding: 16,
        overflow: 'hidden',
        boxShadow: `4px 4px 0 ${color}`,
        transition: 'transform 120ms, box-shadow 120ms'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 14,
            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 8
            }}>
              <h2 style={{
                margin: 0,
                fontFamily: "'Abril Fatface', serif",
                fontSize: 26, color: MB.ink, lineHeight: 1
              }}>{title}</h2>
              {complete &&
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                color, border: `1.5px solid ${color}`,
                padding: '2px 5px', transform: 'rotate(-4deg)',
                textTransform: 'uppercase'
              }}>Ship-Shape</span>
              }
            </div>
            <div style={{
              fontFamily: "'Work Sans', sans-serif",
              fontSize: 12, color: MB.inkSoft, marginTop: 4
            }}>{subtitle}</div>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: MB.ink,
            textAlign: 'right',
            lineHeight: 1.1
          }}>
            <div style={{ fontSize: 22, fontFamily: "'Abril Fatface', serif", color }}>{pct}%</div>
            <div>{progress.done}/{progress.total}</div>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 4, marginTop: 14
        }}>
          {Array.from({ length: progress.total }).map((_, i) =>
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < progress.done ? color : `${MB.ink}1a`,
            transition: 'background 180ms'
          }} />
          )}
        </div>
      </div>
    </button>);

}

function ChecklistScreen({ title, subtitle, mood, accent, secondary, data, state, onToggle, onReset, onBack, onDone, done }) {
  const totalDone = Object.values(state).filter(Boolean).length;
  const total = data.reduce((s, g) => s + g.items.length, 0);
  const pct = total === 0 ? 0 : Math.round(totalDone / total * 100);
  const allDone = pct === 100;

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 130px)' }}>
      <PaperBackdrop />

      <div style={{ position: 'relative', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{
            background: 'transparent', border: `1.5px solid ${MB.ink}`,
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M 9 2 L 4 7 L 9 12" stroke={MB.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              color: accent, textTransform: 'uppercase'
            }}>{mood}</div>
            <h1 style={{
              margin: '2px 0 0',
              fontFamily: "'Abril Fatface', serif",
              fontSize: 32, color: MB.ink, lineHeight: 0.95
            }}>{title}.</h1>
          </div>
          <button onClick={onReset} title="Reset" style={{
            background: 'transparent', border: `1.5px dashed ${MB.ink}66`,
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', padding: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
            color: MB.inkSoft
          }}>RESET</button>
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: "'Work Sans', sans-serif",
          fontSize: 13, color: MB.inkSoft, maxWidth: 300
        }}>{subtitle}</div>
      </div>

      <div style={{ padding: '14px 18px 6px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            color: MB.inkSoft, textTransform: 'uppercase'
          }}>Voyage Readiness</div>
          <div style={{
            fontFamily: "'Abril Fatface', serif", fontSize: 20, color: accent
          }}>{pct}%</div>
        </div>
        <div style={{ position: 'relative' }}>
          <RopeLine color={MB.rope} height={10} />
          <div style={{
            position: 'absolute', inset: 0, height: 10,
            width: `${pct}%`, transition: 'width 320ms cubic-bezier(.34,1.56,.64,1)',
            overflow: 'hidden', borderRadius: 5
          }}>
            <div style={{
              height: '100%',
              background: `repeating-linear-gradient(75deg, ${accent} 0 6px, ${shade(accent, -0.15)} 6px 9px, ${accent} 9px 12px, ${shade(accent, 0.1)} 12px 14px)`,
              borderRadius: 5,
              boxShadow: `inset 0 -1px 0 rgba(0,0,0,0.2)`
            }} />
          </div>
          <div style={{
            position: 'absolute', top: -3, left: `calc(${pct}% - 8px)`,
            width: 16, height: 16, borderRadius: '50%',
            background: MB.ropeDark,
            border: `2px solid ${MB.rope}`,
            transition: 'left 320ms cubic-bezier(.34,1.56,.64,1)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }} />
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {data.map((g, gi) =>
        <GroupCard key={g.group} title={g.group} accent={accent} index={gi}>
            {g.items.map((it) =>
          <ChecklistRow key={it.id}
          item={it}
          checked={!!state[it.id]}
          onToggle={() => onToggle(it.id)}
          accent={accent} />

          )}
          </GroupCard>
        )}
      </div>

      {allDone &&
      <div style={{
        margin: '6px 18px 0',
        padding: '16px 18px',
        border: `2px dashed ${accent}`,
        borderRadius: 16,
        textAlign: 'center',
        animation: 'mb-pop 360ms cubic-bezier(.34,1.56,.64,1)',
        background: `${accent}0d`
      }}>
          <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
          color: accent, textTransform: 'uppercase', marginBottom: 4
        }}>— All checks cleared —</div>
          <div style={{
          fontFamily: "'Abril Fatface', serif", fontSize: 24, color: MB.ink
        }}>Ship-shape, Captain.</div>
          <div style={{
          fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: MB.inkSoft, marginTop: 4
        }}>{done}</div>
        </div>
      }

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 22px)',
        background: `linear-gradient(180deg, transparent, ${MB.paper} 40%)`
      }}>
        <button
          onClick={onDone}
          disabled={!allDone}
          style={{
            width: '100%', padding: '14px 16px',
            background: allDone ? accent : `${MB.ink}22`,
            color: allDone ? MB.paper : MB.inkSoft,
            border: 'none',
            borderRadius: 14,
            fontFamily: "'Abril Fatface', serif",
            fontSize: 22, letterSpacing: '0.02em',
            cursor: allDone ? 'pointer' : 'not-allowed',
            boxShadow: allDone ? `0 4px 0 ${shade(accent, -0.2)}` : 'none',
            transition: 'all 160ms'
          }}>

          {allDone ? mood === 'DEPARTURE' ? 'Cast off the lines →' : 'Log voyage & lock up →' : `${totalDone} of ${total} checks complete`}
        </button>
      </div>
    </div>);

}

function DoneScreen({ mode, onHome, onRepeat }) {
  const isDepart = mode === 'depart';
  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <PaperBackdrop tone={isDepart ? MB.paper : MB.paperDeep} />
      <div style={{
        position: 'relative',
        padding: 'calc(env(safe-area-inset-top, 0px) + 56px) 24px 0',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <Pennant color={isDepart ? MB.red : MB.sea} text={isDepart ? 'CLEARED TO DEPART' : 'VESSEL SECURED'} />
        <h1 style={{
          margin: '18px 0 4px',
          fontFamily: "'Abril Fatface', serif",
          fontSize: 52, lineHeight: 0.9,
          color: MB.ink
        }}>{isDepart ? 'Fair winds,\ncaptain.' : 'Safe\nharbor.'}</h1>
        <div style={{
          fontFamily: "'Work Sans', sans-serif",
          fontSize: 14, color: MB.inkSoft, maxWidth: 280, marginTop: 10
        }}>
          {isDepart ?
          'All lines clear. Mister Boat will see you on the water.' :
          'Mister Boat is tucked in tight. Catch you on the next tide.'}
        </div>

        <div style={{ margin: '22px 0 26px', position: 'relative' }}>
          <MisterBoat size={200} />
          <div style={{
            position: 'absolute', top: 14, right: -12,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
            color: isDepart ? MB.red : MB.sea,
            border: `2px solid ${isDepart ? MB.red : MB.sea}`,
            padding: '6px 10px',
            transform: 'rotate(14deg)',
            textTransform: 'uppercase',
            background: MB.paper
          }}>
            {isDepart ? 'Aye Aye!' : 'All Snug'}
          </div>
        </div>

        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onRepeat} style={actionBtn('ghost')}>Review Checks</button>
          <button onClick={onHome} style={actionBtn('filled', isDepart ? MB.red : MB.sea)}>Back to Helm</button>
        </div>

        <div style={{ marginTop: 26, width: '100%' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
            color: MB.inkSoft, textTransform: 'uppercase',
            marginBottom: 8, textAlign: 'left'
          }}>Logbook Entry</div>
          <div style={{
            background: '#FDFBF5', border: `1px solid ${MB.paperEdge}`,
            borderRadius: 14, padding: 14, textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: MB.inkSoft }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: MB.inkSoft }}>
                {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: MB.ink }}>
              {isDepart ? 'Departed slip — all systems ship-shape.' : 'Returned to slip — vessel secured.'}
            </div>
          </div>
        </div>
      </div>
    </div>);

}

function actionBtn(kind, color = MB.ink) {
  if (kind === 'filled') {
    return {
      padding: '12px 14px',
      background: color, color: MB.paper,
      border: 'none', borderRadius: 12,
      fontFamily: "'Abril Fatface', serif", fontSize: 18,
      cursor: 'pointer',
      boxShadow: `0 3px 0 ${shade(color, -0.2)}`
    };
  }
  return {
    padding: '12px 14px',
    background: 'transparent', color: MB.ink,
    border: `1.5px solid ${MB.ink}`, borderRadius: 12,
    fontFamily: "'Abril Fatface', serif", fontSize: 18,
    cursor: 'pointer'
  };
}

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "captainName": "Captain",
  "dark": false,
  "accentDepart": "#D1353B",
  "accentDock": "#0F4C75",
  "showHints": true,
  "whimsyLevel": 2,
  "scenery": "waves"
} /*EDITMODE-END*/;

function formatLastVoyage(ts) {
  if (!ts) return 'No voyages yet';
  const d = new Date(ts);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${weekday} · ${time}`;
}

function App() {
  const [tweaks, setTweaks] = useTweaks({
    ...DEFAULTS,
    captainName: loadJSON(LS_KEYS.captain, DEFAULTS.captainName)
  });
  const [screen, setScreen] = useState('home');
  const [departState, setDepartState] = useState(() => loadJSON(LS_KEYS.depart, {}));
  const [dockState, setDockState] = useState(() => loadJSON(LS_KEYS.dock, {}));
  const [lastVoyage, setLastVoyage] = useState(() => loadJSON(LS_KEYS.lastVoyage, null));

  useEffect(() => saveJSON(LS_KEYS.depart, departState), [departState]);
  useEffect(() => saveJSON(LS_KEYS.dock, dockState), [dockState]);
  useEffect(() => saveJSON(LS_KEYS.captain, tweaks.captainName), [tweaks.captainName]);
  useEffect(() => saveJSON(LS_KEYS.lastVoyage, lastVoyage), [lastVoyage]);

  const departData = DEFAULT_DEPART;
  const dockData = DEFAULT_DOCK;

  const departTotals = useMemo(() => ({
    done: Object.values(departState).filter(Boolean).length,
    total: departData.reduce((s, g) => s + g.items.length, 0)
  }), [departState]);
  const dockTotals = useMemo(() => ({
    done: Object.values(dockState).filter(Boolean).length,
    total: dockData.reduce((s, g) => s + g.items.length, 0)
  }), [dockState]);

  const toggle = (mode) => (id) => {
    if (mode === 'depart') setDepartState((s) => ({ ...s, [id]: !s[id] }));else
    setDockState((s) => ({ ...s, [id]: !s[id] }));
  };

  const finish = (mode) => {
    setLastVoyage(Date.now());
    setScreen(mode === 'depart' ? 'done-depart' : 'done-dock');
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      background: MB.paper,
      color: MB.ink,
      fontFamily: "'Work Sans', sans-serif",
      overflowX: 'hidden'
    }}>
      {screen === 'home' &&
      <Home
        onGo={(m) => setScreen(m)}
        departProgress={departTotals}
        dockProgress={dockTotals}
        captainName={tweaks.captainName}
        lastVoyage={formatLastVoyage(lastVoyage)} />

      }
      {screen === 'depart' &&
      <ChecklistScreen
        title="Cast Off"
        subtitle="Work the list from dock-side to cast-off. Tap a life-ring to mark it aye."
        mood="DEPARTURE"
        accent={tweaks.accentDepart}
        secondary={MB.sun}
        data={departData}
        state={departState}
        onToggle={toggle('depart')}
        onReset={() => setDepartState({})}
        onBack={() => setScreen('home')}
        onDone={() => finish('depart')}
        done="Untie and push off — have a grand day on the water." />

      }
      {screen === 'dock' &&
      <ChecklistScreen
        title="Dock Up"
        subtitle="Tie her up, button her down. Mister Boat sleeps better with every check."
        mood="RETURN"
        accent={tweaks.accentDock}
        secondary={MB.rope}
        data={dockData}
        state={dockState}
        onToggle={toggle('dock')}
        onReset={() => setDockState({})}
        onBack={() => setScreen('home')}
        onDone={() => finish('dock')}
        done="She’s tucked in, battened, and ready for tomorrow." />

      }
      {screen === 'done-depart' &&
      <DoneScreen mode="depart" onHome={() => setScreen('home')} onRepeat={() => setScreen('depart')} />
      }
      {screen === 'done-dock' &&
      <DoneScreen mode="dock" onHome={() => setScreen('home')} onRepeat={() => setScreen('dock')} />
      }

      <TweaksUI tweaks={tweaks} setTweaks={setTweaks} />
    </div>);

}

function TweaksUI({ tweaks, setTweaks }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Captain">
        <TweakText label="Name" value={tweaks.captainName}
        onChange={(v) => setTweaks({ captainName: v })} />
      </TweakSection>
      <TweakSection title="Palette">
        <TweakColor label="Depart accent" value={tweaks.accentDepart}
        onChange={(v) => setTweaks({ accentDepart: v })} />
        <TweakColor label="Dock accent" value={tweaks.accentDock}
        onChange={(v) => setTweaks({ accentDock: v })} />
        <TweakButton onClick={() => setTweaks({
          accentDepart: '#D1353B', accentDock: '#0F4C75'
        })}>Reset nautical palette</TweakButton>
        <TweakButton onClick={() => setTweaks({
          accentDepart: '#2E6F40', accentDock: '#AA6A1C'
        })}>Harbor sunset palette</TweakButton>
        <TweakButton onClick={() => setTweaks({
          accentDepart: '#7B2CBF', accentDock: '#0B6E6E'
        })}>Phosphorescent palette</TweakButton>
      </TweakSection>
    </TweaksPanel>);

}

ReactDOM.createRoot(document.getElementById('app-root')).render(<App />);
