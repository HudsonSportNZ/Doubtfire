import { useState, useRef, useEffect } from "react";
import { B, BD, BL, BM, TX, TM, TT, WH, BR, GN, AM, RD, BU, GY, F, ICONS, JURISDICTIONS } from "../lib/constants";

/* ── ICON ─────────────────────────────────────────────────── */
export const Icon = ({ d, size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, ...style }}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

/* ── BADGE ────────────────────────────────────────────────── */
export const Badge = ({ s }) => {
  const m = {
    ready:GN, approved:GN, finalised:GN, active:GN, sent:GN,
    pending:AM, review:AM, "not sent":AM,
    draft:GY, calculating:BU, inactive:GY, locked:GY, error:RD,
  };
  const c = m[s] || GY;
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return <span style={{background:c.bg,color:c.fg,borderRadius:5,padding:"3px 10px",fontSize:11.5,fontWeight:600,fontFamily:F,letterSpacing:.2,whiteSpace:"nowrap"}}>{label}</span>;
};

/* ── JUR TAG ──────────────────────────────────────────────── */
export const JurTag = ({ j }) => {
  const c = j==="NZ" ? GN : j==="AU" ? BU : GY;
  return <span style={{background:c.bg,color:c.fg,borderRadius:5,padding:"2px 8px",fontSize:10.5,fontWeight:700,fontFamily:F}}>{j}</span>;
};

/* ── BUTTON ───────────────────────────────────────────────── */
export const Btn = ({ children, onClick, ghost, icon, small, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={ghost?"btn-g":"btn-p"} style={{
    display:"flex",alignItems:"center",gap:6,
    background:ghost?WH:B, color:ghost?B:WH,
    border:`1.5px solid ${ghost?BR:B}`,
    borderRadius:7, padding:small?"6px 14px":"8px 18px",
    fontSize:small?12:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
    fontFamily:F, transition:"background .15s", opacity:disabled?.6:1,
  }}>
    {icon && <Icon d={ICONS[icon]} size={14} color={ghost?B:WH}/>}
    {children}
  </button>
);

/* ── CARD ─────────────────────────────────────────────────── */
export const Card = ({ children, style={}, className="" }) => (
  <div className={className} style={{background:WH,borderRadius:11,border:`1px solid ${BR}`,boxShadow:"0 1px 4px rgba(57,23,93,0.05)",transition:"all .18s",...style}}>
    {children}
  </div>
);

/* ── SECTION HEADING ──────────────────────────────────────── */
export const SectionHead = ({ title, sub, actions }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:22}}>
    <div>
      <h2 style={{fontSize:20,fontWeight:700,color:TX,letterSpacing:-.4,fontFamily:F}}>{title}</h2>
      {sub && <p style={{fontSize:13.5,color:TM,marginTop:4,fontFamily:F}}>{sub}</p>}
    </div>
    {actions && <div style={{display:"flex",gap:8}}>{actions}</div>}
  </div>
);

/* ── TABLE CELLS ──────────────────────────────────────────── */
export const TH = ({ children }) => (
  <th style={{textAlign:"left",padding:"9px 14px",fontSize:11,fontWeight:700,color:TT,letterSpacing:.5,textTransform:"uppercase",borderBottom:`1px solid ${BR}`,fontFamily:F,background:"#faf9fc",whiteSpace:"nowrap"}}>{children}</th>
);
export const TD = ({ children, mono, bold, muted, accent, warn }) => (
  <td style={{padding:"12px 14px",fontSize:13.5,color:accent?B:warn?"#C05A00":muted?TT:TX,fontWeight:bold?700:400,fontFamily:mono?"monospace":F,borderBottom:"1px solid #f0eef7"}}>{children}</td>
);

/* ── STAT CARD ────────────────────────────────────────────── */
export const Stat = ({ label, value, sub, dark, accentSub }) => (
  <Card style={{padding:"18px 20px",background:dark?B:WH,border:`1px solid ${dark?B:BR}`}}>
    <div style={{fontSize:11,fontWeight:700,letterSpacing:.6,textTransform:"uppercase",color:dark?"rgba(255,255,255,.55)":TT,marginBottom:8,fontFamily:F}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,letterSpacing:-.5,color:dark?"#fff":TX,fontFamily:F}}>{value}</div>
    {sub && <div style={{fontSize:12,marginTop:4,color:dark?"rgba(255,255,255,.55)":accentSub?B:TT,fontWeight:accentSub?600:400,fontFamily:F}}>{sub}</div>}
  </Card>
);

/* ── TAB BAR ──────────────────────────────────────────────── */
export const TabBar = ({ tabs, active, setActive }) => (
  <div style={{display:"flex",borderBottom:`2px solid ${BR}`,marginBottom:28}}>
    {tabs.map(t => (
      <button key={t} className="tab-btn" onClick={()=>setActive(t)} style={{
        background:"none",border:"none",padding:"10px 20px",fontSize:13.5,
        fontWeight:active===t?700:500,color:active===t?B:TM,cursor:"pointer",fontFamily:F,
        borderBottom:active===t?`3px solid ${B}`:"3px solid transparent",marginBottom:-2,
        transition:"color .15s",whiteSpace:"nowrap"
      }}>{t}</button>
    ))}
  </div>
);

/* ── PLACEHOLDER TAB ──────────────────────────────────────── */
export const PlaceholderTab = ({ title }) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:280,gap:10}}>
    <div style={{fontSize:36,opacity:.15}}>◎</div>
    <div style={{fontSize:16,fontWeight:700,color:TT,fontFamily:F}}>{title}</div>
    <div style={{fontSize:13.5,color:TT,fontFamily:F}}>This section is under construction.</div>
  </div>
);

/* ── MODAL ────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, maxWidth=460 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,22,37,.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:WH,borderRadius:14,boxShadow:"0 24px 80px rgba(57,23,93,.22)",width:"100%",maxWidth,fontFamily:F}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px 0"}}>
          <div style={{fontSize:16,fontWeight:700,color:TX}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:TT,fontSize:20,lineHeight:1,padding:4}}>×</button>
        </div>
        <div style={{padding:"20px 24px 24px"}}>{children}</div>
      </div>
    </div>
  );
}

/* ── FORM PRIMITIVES ──────────────────────────────────────── */
export const FormField = ({ label, hint, children }) => (
  <div style={{marginBottom:16}}>
    <div style={{fontSize:12,fontWeight:600,color:TM,marginBottom:5}}>{label}{hint && <span style={{fontWeight:400,color:TT,marginLeft:6}}>{hint}</span>}</div>
    {children}
  </div>
);

export const TextInput = ({ value, onChange, placeholder, autoFocus, type="text" }) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
    style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX}} />
);

export const ErrorMsg = ({ children }) => (
  <div style={{background:RD.bg,color:RD.fg,borderRadius:7,padding:"9px 13px",fontSize:13,fontWeight:500,marginBottom:14}}>{children}</div>
);

export const ModalActions = ({ children }) => (
  <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20}}>{children}</div>
);

export const SelectInput = ({ value, onChange, options, style={} }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 12px",fontSize:13,fontFamily:F,color:TX,background:WH,cursor:"pointer",appearance:"none",...style}}>
    {options.map(o=>(
      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
    ))}
  </select>
);

/* ── JURISDICTION DROPDOWN (dark / topbar) ────────────────── */
export function JurisdictionDropdown({ jur, setJur }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h = (e) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  },[]);
  const current = JURISDICTIONS.find(j=>j.code===jur) || JURISDICTIONS[0];
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{
        display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.12)",
        border:"1.5px solid rgba(255,255,255,.2)",borderRadius:7,padding:"6px 12px",
        cursor:"pointer",fontFamily:F,color:WH,fontSize:13,fontWeight:500,transition:"background .15s"
      }}>
        <Icon d={ICONS.globe} size={14} color="rgba(255,255,255,.7)"/>
        <span style={{color:"rgba(255,255,255,.9)"}}>{current.flag} {current.label}</span>
        <Icon d={ICONS.chevron} size={12} color="rgba(255,255,255,.6)" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}/>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:WH,borderRadius:10,border:`1px solid ${BR}`,boxShadow:"0 8px 32px rgba(57,23,93,0.15)",minWidth:220,zIndex:100,overflow:"hidden"}}>
          <div style={{padding:"8px 14px 6px",fontSize:10.5,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,borderBottom:`1px solid ${BR}`}}>
            Filter by Country
          </div>
          {JURISDICTIONS.map(j=>(
            <div key={j.code} onClick={()=>{ if(!j.coming){setJur(j.code);setOpen(false); }}}
              style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 16px",cursor:j.coming?"default":"pointer",
                background:jur===j.code?BL:"transparent",
                borderBottom:`1px solid ${BR}`,
                opacity:j.coming?.55:1,
                transition:"background .12s"
              }}
              className={j.coming?"":"nav-row"}
            >
              <span style={{fontSize:13.5,color:jur===j.code?B:TX,fontWeight:jur===j.code?600:400,fontFamily:F}}>
                {j.flag} {j.label}
              </span>
              {j.coming && <span style={{fontSize:10.5,background:AM.bg,color:AM.fg,borderRadius:4,padding:"1px 7px",fontWeight:600,fontFamily:F}}>Soon</span>}
              {jur===j.code && !j.coming && <span style={{color:B,fontSize:14}}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── PAGE JUR FILTER (light mode) ─────────────────────────── */
export function PageJurFilter({ jur, setJur }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = JURISDICTIONS.find(j => j.code === jur) || JURISDICTIONS[0];
  const isFiltered = jur !== "ALL";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: isFiltered ? BL : WH,
        border: `1.5px solid ${isFiltered ? B : BR}`,
        borderRadius: 7, padding: "7px 14px",
        cursor: "pointer", fontFamily: F,
        color: isFiltered ? B : TM,
        fontSize: 13, fontWeight: isFiltered ? 600 : 500,
        transition: "all .15s"
      }}>
        <Icon d={ICONS.globe} size={14} color={isFiltered ? B : TT} />
        <span>{current.flag} {current.label}</span>
        <Icon d={ICONS.chevron} size={12} color={isFiltered ? B : TT}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          background: WH, borderRadius: 10, border: `1px solid ${BR}`,
          boxShadow: "0 8px 32px rgba(57,23,93,0.13)", minWidth: 210, zIndex: 200, overflow: "hidden"
        }}>
          <div style={{ padding: "8px 14px 6px", fontSize: 10.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F, borderBottom: `1px solid ${BR}` }}>
            Filter by Country
          </div>
          {JURISDICTIONS.map(j => (
            <div key={j.code}
              onClick={() => { if (!j.coming) { setJur(j.code); setOpen(false); } }}
              className={j.coming ? "" : "nav-row"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", cursor: j.coming ? "default" : "pointer",
                background: jur === j.code ? BL : "transparent",
                borderBottom: `1px solid ${BR}`, opacity: j.coming ? .5 : 1,
                transition: "background .12s"
              }}>
              <span style={{ fontSize: 13.5, color: jur === j.code ? B : TX, fontWeight: jur === j.code ? 600 : 400, fontFamily: F }}>
                {j.flag} {j.label}
              </span>
              {j.coming && <span style={{ fontSize: 10.5, background: AM.bg, color: AM.fg, borderRadius: 4, padding: "1px 7px", fontWeight: 600, fontFamily: F }}>Soon</span>}
              {jur === j.code && !j.coming && <span style={{ color: B, fontSize: 14, fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
