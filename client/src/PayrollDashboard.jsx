import { useState, useRef, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

/* ── TOKENS ───────────────────────────────────────────────── */
const B  = "#39175D";
const BD = "#2d1048";
const BL = "#f0ebf8";
const BM = "#6b3fa0";
const TX = "#1a1625";
const TM = "#5a5270";
const TT = "#9b96ad";
const SU = "#f7f6fa";
const BG = "#f2f1f6";
const WH = "#ffffff";
const BR = "#e8e5f0";
const GN = { bg:"#eaf5ee", fg:"#1a7a3c" };
const AM = { bg:"#fdf4e3", fg:"#8a5a00" };
const RD = { bg:"#fdeaea", fg:"#8a1f1f" };
const BU = { bg:"#e8f0fc", fg:"#2a4a9a" };
const GY = { bg:"#f0eef5", fg:"#5a5270" };
const F  = "'Barlow', sans-serif";

/* ── SVG ICONS (white, 16×16 viewBox) ────────────────────── */
const Icon = ({ d, size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, ...style }}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const ICONS = {
  dashboard:  "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9",
  payRuns:    ["M12 2a10 10 0 100 20A10 10 0 0012 2z","M12 6v6l4 2"],
  employees:  ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  inputs:     ["M12 22a10 10 0 110-20 10 10 0 010 20z","M12 6v6l4 2"],
  ruleSets:   ["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
  reports:    ["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"],
  settings:   ["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  chevron:    "M6 9l6 6 6-6",
  bell:       ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"],
  search:     ["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"],
  filter:     "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  download:   ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"],
  plus:       ["M12 5v14","M5 12h14"],
  upload:     ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  globe:      ["M12 2a10 10 0 100 20A10 10 0 0012 2z","M2 12h20","M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"],
  clients:    ["M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16","M3 21h18","M9 7h6","M9 11h6","M9 15h6"],
};

/* ── JURISDICTIONS ────────────────────────────────────────── */
const JURISDICTIONS = [
  { code:"ALL", label:"All Countries",   flag:"🌐" },
  { code:"NZ",  label:"New Zealand",     flag:"🇳🇿" },
  { code:"AU",  label:"Australia",       flag:"🇦🇺" },
  { code:"CA",  label:"Canada",          flag:"🇨🇦", coming:true },
  { code:"UK",  label:"United Kingdom",  flag:"🇬🇧", coming:true },
  { code:"US",  label:"United States",   flag:"🇺🇸", coming:true },
];

/* ── USER ROLES ───────────────────────────────────────────── */
const USER_ROLES = [
  { code:"admin",    label:"Admin",    desc:"Full platform access — manages all clients, rules, and settings" },
  { code:"client",   label:"Client",   desc:"Employer view — manages their own employees and pay runs" },
  { code:"employee", label:"Employee", desc:"Employee self-service — view payslips, submit leave, update details" },
];

/* ── MOCK DATA ────────────────────────────────────────────── */
const UPCOMING = [
  { id:1, name:"Weekly Payroll – NZ",  date:"Mon 10 Mar", emp:42,  status:"ready",   jur:"NZ" },
  { id:2, name:"Fortnightly – AU",     date:"Wed 12 Mar", emp:28,  status:"draft",   jur:"AU" },
  { id:3, name:"Monthly Household",   date:"Fri 28 Mar", emp:156, status:"pending", jur:"NZ" },
];
const ALERTS = [
  { id:1, sev:"warn",  msg:"3 employees missing timesheets",     sub:"Weekly Payroll · Due in 2 days" },
  { id:2, sev:"info",  msg:"New employee onboarding incomplete", sub:"Sarah Chen · Pay The Nanny" },
  { id:3, sev:"error", msg:"KiwiSaver rate mismatch detected",  sub:"Johnson Family · 2 employees" },
];
const ACTIVITY = [
  { id:1, ev:"Pay Run Completed",  client:"Smith Family",   emp:1, net:"$1,120.00",  time:"2h ago",    jur:"NZ" },
  { id:2, ev:"Payslips Generated", client:"Auckland Homes", emp:8, net:"$14,340.00", time:"5h ago",    jur:"NZ" },
  { id:3, ev:"Pay Run Completed",  client:"SydCare Pty",    emp:4, net:"$9,820.00",  time:"Yesterday", jur:"AU" },
  { id:4, ev:"New Employee Added", client:"Walker Family",  emp:1, net:"—",          time:"Yesterday", jur:"NZ" },
];
const PAY_RUNS = [
  { id:1, schedule:"Weekly",      period:"3–9 Mar 2026",   datePaid:"10 Mar 2026", status:"finalised", emp:42,  ird:"finalised", payslips:"sent",     jur:"NZ" },
  { id:2, schedule:"Fortnightly", period:"24 Feb–9 Mar",   datePaid:"12 Mar 2026", status:"pending",   emp:28,  ird:"pending",   payslips:"not sent", jur:"AU" },
  { id:3, schedule:"Monthly",     period:"1–31 Mar 2026",  datePaid:"28 Mar 2026", status:"draft",     emp:156, ird:"draft",     payslips:"not sent", jur:"NZ" },
  { id:4, schedule:"Weekly",      period:"24 Feb–2 Mar",   datePaid:"3 Mar 2026",  status:"finalised", emp:42,  ird:"finalised", payslips:"sent",     jur:"NZ" },
  { id:5, schedule:"Fortnightly", period:"10–23 Feb",      datePaid:"24 Feb 2026", status:"finalised", emp:27,  ird:"finalised", payslips:"sent",     jur:"AU" },
];
const EMPLOYEES = [
  { id:1, name:"Maria Santos",  freq:"Weekly",      ruleSet:"Standard NZ",  start:"1 Jan 2024",  lastPaid:"10 Mar 2026", jur:"NZ" },
  { id:2, name:"James Okafor",  freq:"Weekly",      ruleSet:"Standard NZ",  start:"15 Mar 2023", lastPaid:"10 Mar 2026", jur:"NZ" },
  { id:3, name:"Priya Nair",    freq:"Monthly",     ruleSet:"Management NZ",start:"1 Jul 2022",  lastPaid:"28 Feb 2026", jur:"NZ" },
  { id:4, name:"Lena Fischer",  freq:"Weekly",      ruleSet:"Standard NZ",  start:"12 Feb 2024", lastPaid:"10 Mar 2026", jur:"NZ" },
  { id:5, name:"Tom Reyes",     freq:"Fortnightly", ruleSet:"Casual NZ",    start:"5 Jun 2024",  lastPaid:"3 Mar 2026",  jur:"NZ" },
  { id:6, name:"Jake Whitmore", freq:"Fortnightly", ruleSet:"Standard AU",  start:"2 Apr 2023",  lastPaid:"24 Feb 2026", jur:"AU" },
  { id:7, name:"Amy Chen",      freq:"Weekly",      ruleSet:"Standard AU",  start:"10 Aug 2023", lastPaid:"9 Mar 2026",  jur:"AU" },
];
const TAX_RULES = [
  { id:1, name:"NZ PAYE",             type:"Tax Table",  applies:"Gross Income",       effective:"1 Apr 2024", status:"active", jur:"NZ", locked:true  },
  { id:2, name:"ACC Levy",            type:"Fixed Rate", applies:"Gross Earnings",     effective:"1 Apr 2024", status:"active", jur:"NZ", locked:true  },
  { id:3, name:"KiwiSaver Employee",  type:"Percentage", applies:"Gross Wages",        effective:"1 Apr 2024", status:"active", jur:"NZ", locked:false },
  { id:4, name:"KiwiSaver Employer",  type:"Percentage", applies:"Gross Wages",        effective:"1 Apr 2024", status:"active", jur:"NZ", locked:false },
  { id:5, name:"AU PAYG Withholding", type:"Tax Table",  applies:"Gross Income",       effective:"1 Jul 2024", status:"active", jur:"AU", locked:true  },
  { id:6, name:"AU Superannuation",   type:"Percentage", applies:"Ordinary Time Earn.",effective:"1 Jul 2024", status:"active", jur:"AU", locked:true  },
];
const LEAVE_PROFILES = [
  { id:1, name:"Standard Employees", annual:"4 weeks",  sick:"10 days", holidayPay:"Included", employees:380 },
  { id:2, name:"Management",         annual:"5 weeks",  sick:"10 days", holidayPay:"Included", employees:22  },
  { id:3, name:"Casual Employees",   annual:"N/A",      sick:"N/A",     holidayPay:"8% gross", employees:215 },
];
const GROSS_NET = {
  earnings: [
    { label:"Ordinary Hours",   hours:"40.00", rate:"$28.50",  amount:"$1,140.00" },
    { label:"Holiday Pay (8%)", hours:"—",     rate:"8%",      amount:"$91.20"    },
    { label:"Tool Allowance",   hours:"—",     rate:"$25/day", amount:"$125.00"   },
  ],
  deductions: [
    { label:"PAYE Tax",       amount:"$192.80", note:"IRD 2024 table" },
    { label:"KiwiSaver (EE)", amount:"$73.87",  note:"3% of gross"    },
    { label:"ACC Levy",       amount:"$11.20",  note:"$1.39/hr"       },
  ],
  gross:"$1,356.20", totalDed:"$277.87", net:"$1,078.33",
};

/* ── CSS ──────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;font-family:'Barlow',sans-serif;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#ccc8d8;border-radius:8px;}
  .nav-row:hover{background:rgba(255,255,255,0.09)!important;}
  .sub-row:hover{background:rgba(255,255,255,0.07)!important;}
  .trow:hover td{background:#faf9fc!important;}
  .card-h:hover{box-shadow:0 4px 20px rgba(57,23,93,0.10)!important;transform:translateY(-1px);}
  .eng-card:hover{border-color:${B}!important;box-shadow:0 0 0 3px ${BL}!important;}
  .tab-btn:hover{color:${B}!important;}
  .btn-p:hover{background:${BD}!important;}
  .btn-g:hover{background:#ede9f5!important;}
  input:focus{border-color:${B}!important;outline:none;}
  select:focus{outline:none;}
`;

/* ── SHARED UI PRIMITIVES ─────────────────────────────────── */
const Badge = ({ s }) => {
  const m = {
    ready:GN, approved:GN, finalised:GN, active:GN, sent:GN,
    pending:AM, review:AM, "not sent":AM,
    draft:GY, calculating:BU, inactive:GY, locked:GY, error:RD,
  };
  const c = m[s] || GY;
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return <span style={{background:c.bg,color:c.fg,borderRadius:5,padding:"3px 10px",fontSize:11.5,fontWeight:600,fontFamily:F,letterSpacing:.2,whiteSpace:"nowrap"}}>{label}</span>;
};

const JurTag = ({ j }) => {
  const c = j==="NZ" ? GN : j==="AU" ? BU : GY;
  return <span style={{background:c.bg,color:c.fg,borderRadius:5,padding:"2px 8px",fontSize:10.5,fontWeight:700,fontFamily:F}}>{j}</span>;
};

const Btn = ({ children, onClick, ghost, icon, small }) => (
  <button onClick={onClick} className={ghost?"btn-g":"btn-p"} style={{
    display:"flex",alignItems:"center",gap:6,
    background:ghost?WH:B, color:ghost?B:WH,
    border:`1.5px solid ${ghost?BR:B}`,
    borderRadius:7, padding:small?"6px 14px":"8px 18px",
    fontSize:small?12:13, fontWeight:600, cursor:"pointer", fontFamily:F, transition:"background .15s"
  }}>
    {icon && <Icon d={ICONS[icon]} size={14} color={ghost?B:WH}/>}
    {children}
  </button>
);

const Card = ({ children, style={}, className="" }) => (
  <div className={className} style={{background:WH,borderRadius:11,border:`1px solid ${BR}`,boxShadow:"0 1px 4px rgba(57,23,93,0.05)",transition:"all .18s",...style}}>
    {children}
  </div>
);

const SectionHead = ({ title, sub, actions }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:22}}>
    <div>
      <h2 style={{fontSize:20,fontWeight:700,color:TX,letterSpacing:-.4,fontFamily:F}}>{title}</h2>
      {sub && <p style={{fontSize:13.5,color:TM,marginTop:4,fontFamily:F}}>{sub}</p>}
    </div>
    {actions && <div style={{display:"flex",gap:8}}>{actions}</div>}
  </div>
);

const TH = ({ children }) => (
  <th style={{textAlign:"left",padding:"9px 14px",fontSize:11,fontWeight:700,color:TT,letterSpacing:.5,textTransform:"uppercase",borderBottom:`1px solid ${BR}`,fontFamily:F,background:"#faf9fc",whiteSpace:"nowrap"}}>{children}</th>
);
const TD = ({ children, mono, bold, muted, accent, warn }) => (
  <td style={{padding:"12px 14px",fontSize:13.5,color:accent?B:warn?"#C05A00":muted?TT:TX,fontWeight:bold?700:400,fontFamily:mono?"monospace":F,borderBottom:"1px solid #f0eef7"}}>{children}</td>
);

const Stat = ({ label, value, sub, dark, accentSub }) => (
  <Card style={{padding:"18px 20px",background:dark?B:WH,border:`1px solid ${dark?B:BR}`}}>
    <div style={{fontSize:11,fontWeight:700,letterSpacing:.6,textTransform:"uppercase",color:dark?"rgba(255,255,255,.55)":TT,marginBottom:8,fontFamily:F}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,letterSpacing:-.5,color:dark?"#fff":TX,fontFamily:F}}>{value}</div>
    {sub && <div style={{fontSize:12,marginTop:4,color:dark?"rgba(255,255,255,.55)":accentSub?B:TT,fontWeight:accentSub?600:400,fontFamily:F}}>{sub}</div>}
  </Card>
);

const TabBar = ({ tabs, active, setActive }) => (
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

const PlaceholderTab = ({ title }) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:280,gap:10}}>
    <div style={{fontSize:36,opacity:.15}}>◎</div>
    <div style={{fontSize:16,fontWeight:700,color:TT,fontFamily:F}}>{title}</div>
    <div style={{fontSize:13.5,color:TT,fontFamily:F}}>This section is under construction.</div>
  </div>
);

/* ── MODAL & FORM PRIMITIVES ──────────────────────────────── */
function Modal({ title, onClose, children, maxWidth=460 }) {
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

const FormField = ({ label, hint, children }) => (
  <div style={{marginBottom:16}}>
    <div style={{fontSize:12,fontWeight:600,color:TM,marginBottom:5}}>{label}{hint && <span style={{fontWeight:400,color:TT,marginLeft:6}}>{hint}</span>}</div>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, autoFocus, type="text" }) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
    style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX}} />
);

const ErrorMsg = ({ children }) => (
  <div style={{background:RD.bg,color:RD.fg,borderRadius:7,padding:"9px 13px",fontSize:13,fontWeight:500,marginBottom:14}}>{children}</div>
);

const ModalActions = ({ children }) => (
  <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20}}>{children}</div>
);

const SelectInput = ({ value, onChange, options, style={} }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 12px",fontSize:13,fontFamily:F,color:TX,background:WH,cursor:"pointer",appearance:"none",...style}}>
    {options.map(o=>(
      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
    ))}
  </select>
);

/* ── JURISDICTION DROPDOWN ────────────────────────────────── */
function JurisdictionDropdown({ jur, setJur }) {
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

/* ── PAGE-LEVEL JURISDICTION FILTER (light mode) ─────────── */
function PageJurFilter({ jur, setJur }) {
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

/* ── API HELPERS ──────────────────────────────────────────── */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
function apiHeaders() {
  const token = localStorage.getItem("auth_token");
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

/* ── DATE HELPERS ─────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("T")[0].split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/* ── EMPLOYEE PROFILE COMPLETION ─────────────────────────── */
// All fields required for an employee to become Active (except date_of_birth + job_title)
const REQUIRED_FIELDS = [
  { key: 'title',                      label: 'Title',           tab: 'General'     },
  { key: 'email',                      label: 'Email',           tab: 'General'     },
  { key: 'mobile_phone',               label: 'Mobile phone',    tab: 'General'     },
  { key: 'residential_street_address', label: 'Street address',  tab: 'General'     },
  { key: 'residential_city',           label: 'City',            tab: 'General'     },
  { key: 'residential_region',         label: 'Region',          tab: 'General'     },
  { key: 'residential_post_code',      label: 'Post code',       tab: 'General'     },
  { key: 'residential_country',        label: 'Country',         tab: 'General'     },
  { key: 'employment_type',            label: 'Employment type', tab: 'Employment'  },
  { key: 'leave_profile_id',           label: 'Leave template',  tab: 'Employment'  },
  { key: 'bank_name',                  label: 'Bank name',       tab: 'Payments'    },
  { key: 'bank_account_number',        label: 'Account number',  tab: 'Payments'    },
  { key: 'bank_account_name',          label: 'Account name',    tab: 'Payments'    },
  { key: 'tax_identifier',             label: 'IRD number',      tab: 'Tax'         },
  { key: 'tax_code',                   label: 'Tax code',        tab: 'Tax'         },
];
function getMissingFields(emp, hasPaySettings) {
  const missing = REQUIRED_FIELDS.filter(f => !emp[f.key]);
  if (!hasPaySettings) missing.push({ key: 'pay_rate', label: 'Pay rate', tab: 'Pay Settings' });
  return missing;
}

/* ── NAV STRUCTURE ────────────────────────────────────────── */
const NAV = [
  { id:"dashboard", label:"Dashboard",     iconKey:"dashboard" },
  { id:"clients",   label:"Clients",       iconKey:"clients"   },
  { id:"pay-runs",  label:"Pay Runs",      iconKey:"payRuns"   },
  { id:"employees", label:"Employees",     iconKey:"employees" },
  { id:"payroll-inputs", label:"Payroll Inputs", iconKey:"inputs", children:[
    { id:"timesheets", label:"Timesheets" },
    { id:"expenses",   label:"Expenses"   },
    { id:"leave",      label:"Leave"      },
  ]},
  { id:"rule-sets", label:"Rule Sets",     iconKey:"ruleSets"  },
  { id:"reports",   label:"Reports",       iconKey:"reports"   },
  { id:"settings",  label:"Settings",      iconKey:"settings", children:[
    { id:"settings-business",  label:"Business Settings"  },
    { id:"settings-payroll",   label:"Payroll Settings"   },
    { id:"settings-engine",    label:"Pay Engine Settings"},
    { id:"settings-integration",label:"Integration"       },
    { id:"settings-other",     label:"Other Settings"     },
  ]},
];

const PAGE_LABELS = {
  dashboard:"Dashboard", clients:"Clients", "pay-runs":"Pay Runs", employees:"Employees",
  timesheets:"Timesheets", expenses:"Expenses", leave:"Leave",
  "rule-sets":"Rule Sets", reports:"Reports",
  "settings-business":"Business Settings", "settings-payroll":"Payroll Settings",
  "settings-engine":"Pay Engine Settings", "settings-integration":"Integration",
  "settings-other":"Other Settings", settings:"Settings",
};

/* ── SIDEBAR ──────────────────────────────────────────────── */
function Sidebar({ page, setPage, openMenu, setOpenMenu, user, onLogout }) {
  const navIconColor = (isActive) => isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)";
  return (
    <aside style={{width:228,background:B,display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 16px rgba(57,23,93,0.2)"}}>
      {/* Logo */}
      <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:34,height:34,background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.25)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,fontFamily:F}}>P</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:14,letterSpacing:-.2,fontFamily:F,lineHeight:1.2}}>Payroll Engine</div>
            <div style={{color:"rgba(255,255,255,.45)",fontSize:11,fontFamily:F,marginTop:1}}>Pay The Nanny</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"12px 10px",overflowY:"auto"}}>
        {NAV.map(n => {
          const isActive = page===n.id || (n.children && n.children.some(c=>c.id===page));
          const isOpen   = openMenu===n.id;
          const iconPaths = ICONS[n.iconKey];
          return (
            <div key={n.id}>
              <div className="nav-row" onClick={()=>{
                  if(n.children){ setOpenMenu(isOpen?null:n.id); if(!n.children) setPage(n.id); }
                  else { setPage(n.id); setOpenMenu(null); }
                }}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,marginBottom:1,cursor:"pointer",
                  background:isActive&&!n.children?"rgba(255,255,255,.18)":"transparent",transition:"background .15s"}}>
                <Icon d={iconPaths} size={16} color={navIconColor(isActive)} style={{flexShrink:0}}/>
                <span style={{fontSize:13.5,fontWeight:isActive?600:400,color:isActive?"#fff":"rgba(255,255,255,.72)",fontFamily:F,flex:1,lineHeight:1.3}}>{n.label}</span>
                {n.children && (
                  <Icon d={ICONS.chevron} size={12} color="rgba(255,255,255,.35)"
                    style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
                )}
              </div>
              {n.children && isOpen && (
                <div style={{marginLeft:28,marginBottom:4}}>
                  {n.children.map(c=>(
                    <div key={c.id} className="sub-row" onClick={()=>setPage(c.id)}
                      style={{padding:"7px 12px",borderRadius:6,cursor:"pointer",
                        fontSize:13,fontWeight:page===c.id?600:400,
                        color:page===c.id?"#fff":"rgba(255,255,255,.58)",fontFamily:F,
                        background:page===c.id?"rgba(255,255,255,.13)":"transparent",
                        marginBottom:1,transition:"background .15s",
                        borderLeft:`2px solid ${page===c.id?"rgba(255,255,255,.4)":"rgba(255,255,255,.1)"}`,
                        paddingLeft:14}}>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
          <div style={{width:30,height:30,background:"rgba(255,255,255,.18)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,fontFamily:F,flexShrink:0}}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"rgba(255,255,255,.9)",fontSize:12.5,fontWeight:600,fontFamily:F,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name ?? "—"}</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:11,fontFamily:F}}>{user?.role ?? ""}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:6,color:"rgba(255,255,255,.6)",fontSize:12,fontWeight:600,cursor:"pointer",padding:"6px 0",fontFamily:F,transition:"background .15s"}}
          onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
          onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"}>
          Log out
        </button>
      </div>
    </aside>
  );
}

/* ── TOPBAR ───────────────────────────────────────────────── */
function Topbar({ page, jur, setJur, actionEl, userRole, setUserRole }) {
  return (
    <>
      <div style={{background:B,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:"rgba(255,255,255,.5)",fontSize:13,fontFamily:F}}>Payroll Engine</span>
          <span style={{color:"rgba(255,255,255,.25)"}}>›</span>
          <span style={{color:"#fff",fontSize:13,fontWeight:600,fontFamily:F}}>{PAGE_LABELS[page]||page}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* User Role Switcher */}
          <div style={{display:"flex",background:"rgba(255,255,255,.1)",borderRadius:7,padding:2,border:"1px solid rgba(255,255,255,.15)"}}>
            {USER_ROLES.map(r=>(
              <button key={r.code} onClick={()=>setUserRole(r.code)} title={r.desc}
                style={{background:userRole===r.code?"rgba(255,255,255,.9)":"transparent",
                  color:userRole===r.code?B:"rgba(255,255,255,.65)",
                  border:"none",borderRadius:5,padding:"4px 12px",fontSize:12,fontWeight:600,
                  cursor:"pointer",fontFamily:F,transition:"all .15s"}}>
                {r.label}
              </button>
            ))}
          </div>
          <div style={{width:1,height:18,background:"rgba(255,255,255,.2)"}}/>
          {/* Jurisdiction dropdown */}
          <JurisdictionDropdown jur={jur} setJur={setJur}/>
          <div style={{width:1,height:18,background:"rgba(255,255,255,.2)"}}/>
          {/* Bell */}
          <div style={{position:"relative",cursor:"pointer",display:"flex",alignItems:"center"}}>
            <Icon d={ICONS.bell} size={18} color="rgba(255,255,255,.7)"/>
            <span style={{position:"absolute",top:-5,right:-5,width:14,height:14,background:"#D94040",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,fontFamily:F}}>3</span>
          </div>
          <div style={{width:30,height:30,background:"rgba(255,255,255,.18)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11.5,fontWeight:700,fontFamily:F}}>OT</div>
        </div>
      </div>
      {/* Sub-header */}
      <div style={{background:WH,borderBottom:`1px solid ${BR}`,padding:"0 28px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <h1 style={{fontSize:16,fontWeight:700,color:TX,letterSpacing:-.3,fontFamily:F}}>{PAGE_LABELS[page]||page}</h1>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>{actionEl}</div>
      </div>
    </>
  );
}

/* ── PAGES ────────────────────────────────────────────────── */

function Dashboard({ setPage, jur, setJur }) {
  const filteredUpcoming = jur === "ALL" ? UPCOMING : UPCOMING.filter(r => r.jur === jur);
  const filteredActivity = jur === "ALL" ? ACTIVITY : ACTIVITY.filter(a => a.jur === jur);

  const stats = jur === "ALL"
    ? [
        { label: "NZ Employees",       value: "402",  sub: "↑ +8 this month", accentSub: true },
        { label: "AU Employees",        value: "215",  sub: "↑ +4 this month", accentSub: true },
        { label: "Draft Pay Runs",      value: "3",    sub: "Awaiting action" },
        { label: "Payroll This Month",  value: "$284K",sub: "Net disbursed", dark: true },
      ]
    : jur === "NZ"
    ? [
        { label: "NZ Employees",       value: "402",  sub: "↑ +8 this month", accentSub: true },
        { label: "NZ Pay Runs",        value: "2",    sub: "Active this period" },
        { label: "NZ Draft Runs",      value: "1",    sub: "Awaiting action" },
        { label: "NZ Payroll Month",   value: "$168K",sub: "Net disbursed", dark: true },
      ]
    : [
        { label: "AU Employees",       value: "215",  sub: "↑ +4 this month", accentSub: true },
        { label: "AU Pay Runs",        value: "1",    sub: "Active this period" },
        { label: "AU Draft Runs",      value: "2",    sub: "Awaiting action" },
        { label: "AU Payroll Month",   value: "$116K",sub: "Net disbursed", dark: true },
      ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TX, letterSpacing: -.4, fontFamily: F }}>Good morning 👋</h2>
          <p style={{ fontSize: 13.5, color: TM, marginTop: 4, fontFamily: F }}>Friday, 6 March 2026 · Pay The Nanny</p>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 22 }}>
        {stats.map(s => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} accentSub={s.accentSub} dark={s.dark} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F }}>Upcoming Pay Runs</span>
            <button onClick={() => setPage("pay-runs")} style={{ background: "none", border: "none", color: B, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: F }}>View all →</button>
          </div>
          {filteredUpcoming.length === 0
            ? <p style={{ fontSize: 13.5, color: TT, fontFamily: F, padding: "12px 0" }}>No upcoming pay runs for this country.</p>
            : filteredUpcoming.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #f0eef7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, background: BL, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: B, fontFamily: F }}>{r.jur}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TX, fontFamily: F }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: TT, marginTop: 2, fontFamily: F }}>{r.date} · {r.emp} employees</div>
                  </div>
                </div>
                <Badge s={r.status} />
              </div>
            ))}
        </Card>
        <Card style={{ padding: "20px 22px" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 16 }}>Alerts</span>
          {ALERTS.map(a => {
            const col = a.sev === "error" ? "#D94040" : a.sev === "warn" ? "#C07800" : "#4A6EB0";
            return (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid #f0eef7" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: TX, fontFamily: F }}>{a.msg}</div>
                  <div style={{ fontSize: 12, color: TT, marginTop: 2, fontFamily: F }}>{a.sub}</div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
      <Card style={{ padding: "20px 22px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 14 }}>Recent Activity</span>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><TH>Event</TH><TH>Client</TH><TH>Employees</TH><TH>Net Pay</TH><TH>Jurisdiction</TH><TH>Time</TH></tr></thead>
          <tbody>
            {filteredActivity.length === 0
              ? <tr><td colSpan={6} style={{ padding: "24px 14px", textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>No activity for this country.</td></tr>
              : filteredActivity.map(a => (
                <tr key={a.id} className="trow">
                  <TD bold>{a.ev}</TD><TD>{a.client}</TD><TD mono>{a.emp}</TD>
                  <TD mono accent={a.net !== "—"} bold={a.net !== "—"}>{a.net}</TD>
                  <TD><JurTag j={a.jur} /></TD><TD muted>{a.time}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── PAY RUNS ─────────────────────────────────────────────── */
function PayRuns({ jur, setJur }) {
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const schedules = ["all", "Weekly", "Fortnightly", "Monthly"];
  const filtered = PAY_RUNS.filter(r => {
    if (jur !== "ALL" && r.jur !== jur) return false;
    if (scheduleFilter !== "all" && r.schedule !== scheduleFilter) return false;
    if (dateFilter && !r.datePaid.toLowerCase().includes(dateFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <SectionHead
        title="Pay Runs"
        sub={jur === "ALL" ? "All payroll runs across jurisdictions" : `Payroll runs · ${jur}`}
        actions={<Btn icon="plus">New Pay Run</Btn>}
      />
      {/* Filters */}
      <Card style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={ICONS.filter} size={14} color={TT} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: TT, fontFamily: F }}>Filter:</span>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
        <div style={{ width: 1, height: 20, background: BR }} />
        <div style={{ display: "flex", gap: 6 }}>
          {schedules.map(s => (
            <button key={s} onClick={() => setScheduleFilter(s)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: `1.5px solid ${scheduleFilter === s ? B : BR}`,
                background: scheduleFilter === s ? B : WH, color: scheduleFilter === s ? WH : TM,
                fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all .15s"
              }}>
              {s === "all" ? "All Schedules" : s}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: BR }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: TT, fontFamily: F }}>Pay Date:</span>
          <input value={dateFilter} onChange={e => setDateFilter(e.target.value)} placeholder="e.g. Mar 2026"
            style={{ border: `1.5px solid ${BR}`, borderRadius: 7, padding: "5px 12px", fontSize: 13, fontFamily: F, color: TX, width: 140 }} />
        </div>
        {(jur !== "ALL" || scheduleFilter !== "all" || dateFilter) && (
          <button onClick={() => { setJur("ALL"); setScheduleFilter("all"); setDateFilter(""); }}
            style={{ background: "none", border: "none", color: TT, fontSize: 12.5, cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
            Clear all
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: TT, fontFamily: F }}>{filtered.length} runs</span>
      </Card>

      <Card style={{ padding: "20px 22px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><TH>Pay Schedule</TH><TH>Pay Period</TH><TH>Date Paid</TH><TH>Status</TH><TH>Employees</TH><TH>IRD Filing</TH><TH>Payslips</TH><TH></TH></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} style={{ padding: "28px 14px", textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>No pay runs match your filters.</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="trow">
                  <TD bold>{r.schedule}</TD>
                  <TD muted>{r.period}</TD>
                  <TD>{r.datePaid}</TD>
                  <TD><Badge s={r.status} /></TD>
                  <TD mono>{r.emp}</TD>
                  <TD><Badge s={r.ird} /></TD>
                  <TD><Badge s={r.payslips} /></TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <button style={{ background: "none", border: "none", color: B, fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: F }}>Open →</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── EMPLOYEE DETAIL MODAL ────────────────────────────────── */
const NZ_TAX_CODES = ["M","M SL","ME","ME SL","S","SH","ST","SA","CAE","EDW","NSW","WT","SB","SB SL"];

function EmployeeDetailModal({ employee, onClose, onUpdated, paySchedules = [] }) {
  const [tab, setTab] = useState("General");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [currentEmp, setCurrentEmp] = useState(employee); // tracks saved state for completion

  const [gen, setGen] = useState({
    title:                      employee.title ?? "",
    first_name:                 employee.first_name ?? "",
    middle_name:                employee.middle_name ?? "",
    last_name:                  employee.last_name ?? "",
    date_of_birth:              employee.date_of_birth ? String(employee.date_of_birth).split("T")[0] : "",
    external_id:                employee.external_id ?? "",
    email:                      employee.email ?? "",
    mobile_phone:               employee.mobile_phone ?? "",
    residential_street_address: employee.residential_street_address ?? "",
    residential_address_line2:  employee.residential_address_line2 ?? "",
    residential_city:           employee.residential_city ?? "",
    residential_region:         employee.residential_region ?? "",
    residential_post_code:      employee.residential_post_code ?? "",
    residential_country:        employee.residential_country ?? "",
  });

  const [emp, setEmp] = useState({
    start_date:        employee.start_date ? String(employee.start_date).split("T")[0] : "",
    employment_type:   employee.employment_type ?? "",
    job_title:         employee.job_title ?? "",
    status:            employee.status ?? "draft",
    end_date:          employee.end_date ? String(employee.end_date).split("T")[0] : "",
    pay_schedule_id:   employee.pay_schedule_id ?? "",
    leave_profile_id:  employee.leave_profile_id ?? "",
    automatically_pay: employee.automatically_pay ?? false,
  });

  const [pay, setPay] = useState({
    bank_name:           employee.bank_name ?? "",
    bank_account_number: employee.bank_account_number ?? "",
    bank_account_name:   employee.bank_account_name ?? "",
  });

  const [taxVals, setTaxVals] = useState({
    tax_identifier:          employee.tax_identifier ?? "",
    tax_code:                employee.tax_code ?? "",
    kiwisaver_member:        employee.kiwisaver_member ?? false,
    kiwisaver_employee_rate: employee.kiwisaver_employee_rate
      ? Number(employee.kiwisaver_employee_rate).toFixed(4) : "0.0300",
    kiwisaver_employer_rate: employee.kiwisaver_employer_rate
      ? Number(employee.kiwisaver_employer_rate).toFixed(4) : "0.0300",
  });

  const [paySettings,   setPaySettings]   = useState([]);
  const [showPayForm,   setShowPayForm]   = useState(false);
  const [payValues,     setPayValues]     = useState({
    pay_type:"hourly", pay_rate:"", pay_frequency:"weekly",
    tax_code:"M", hours_per_week:"", effective_from:"",
    kiwisaver_rate:"0.0300", kiwisaver_opted_out:false,
  });
  const [leaveProfiles, setLeaveProfiles] = useState([]);

  useEffect(() => { loadPaySettings(); loadLeaveProfiles(); }, []);

  async function loadPaySettings() {
    const res = await fetch(`${API_URL}/api/v1/employees/${employee.id}/pay-settings`, { headers: apiHeaders() });
    if (res.ok) setPaySettings(await res.json());
  }

  async function loadLeaveProfiles() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${employee.tenant_id}/leave-profiles`, { headers: apiHeaders() });
    if (res.ok) setLeaveProfiles(await res.json());
  }

  async function doPatch(body) {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/employees/${employee.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to save"); return; }
      setCurrentEmp(data);
      onUpdated(data);
    } finally { setSaving(false); }
  }

  async function activateEmployee() {
    const missing = getMissingFields(currentEmp, paySettings.length > 0);
    if (missing.length > 0) {
      setTab(missing[0].tab);
      setError(`Complete this section: ${missing.filter(f=>f.tab===missing[0].tab).map(f=>f.label).join(", ")}`);
      return;
    }
    await doPatch({ status: "active" });
  }

  async function addPaySettings() {
    setSaving(true); setError(null);
    try {
      const body = {
        pay_type: payValues.pay_type, pay_rate: payValues.pay_rate,
        pay_frequency: payValues.pay_frequency, tax_code: payValues.tax_code,
        effective_from: payValues.effective_from,
      };
      if (payValues.hours_per_week) body.hours_per_week = payValues.hours_per_week;
      if (isNZ) { body.kiwisaver_rate = payValues.kiwisaver_rate; body.kiwisaver_opted_out = payValues.kiwisaver_opted_out; }
      const res = await fetch(`${API_URL}/api/v1/employees/${employee.id}/pay-settings`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to add pay settings"); return; }
      setPaySettings(prev => [data, ...prev]);
      setShowPayForm(false);
      setPayValues({ pay_type:"hourly", pay_rate:"", pay_frequency:"weekly", tax_code:"M", hours_per_week:"", effective_from:"", kiwisaver_rate:"0.0300", kiwisaver_opted_out:false });
    } finally { setSaving(false); }
  }

  const isNZ = employee.jurisdiction === "NZ";
  const initials = `${(employee.first_name||"?")[0]}${(employee.last_name||"?")[0]}`.toUpperCase();
  const selSt = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};
  const TABS = ["General","Employment","Payments","Tax","Pay Settings"];

  // Completion tracking (based on last-saved state)
  const missing = getMissingFields(currentEmp, paySettings.length > 0);
  const isDraft = currentEmp.status === "draft";
  const completionTotal = REQUIRED_FIELDS.length + 1;
  const completionPct = Math.round(((completionTotal - missing.length) / completionTotal) * 100);

  return (
    <Modal title={
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,background:BL,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:B,flexShrink:0}}>{initials}</div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:TX,fontFamily:F}}>{employee.first_name} {employee.last_name}</div>
          <div style={{display:"flex",gap:8,marginTop:2}}><JurTag j={employee.jurisdiction}/><Badge s={employee.status}/></div>
        </div>
      </div>
    } onClose={onClose} maxWidth={700}>
      <TabBar tabs={TABS} active={tab} setActive={t=>{ setTab(t); setError(null); }}/>

      {/* ── COMPLETION BANNER ── */}
      {isDraft ? (
        <div style={{background:AM.bg,border:`1.5px solid #f0c060`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <span style={{fontSize:13.5,fontWeight:700,color:AM.fg,fontFamily:F}}>Profile incomplete — {completionPct}% done</span>
              <span style={{fontSize:12.5,color:AM.fg,fontFamily:F,opacity:.75,marginLeft:8}}>{missing.length} field{missing.length!==1?"s":""} remaining</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{background:"#f0d890",borderRadius:99,height:6,marginBottom:12,overflow:"hidden"}}>
            <div style={{width:`${completionPct}%`,height:"100%",background:AM.fg,borderRadius:99,transition:"width .4s"}}/>
          </div>
          {/* Missing field chips — grouped by tab */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["General","Employment","Payments","Tax","Pay Settings"].map(t=>{
              const inTab = missing.filter(f=>f.tab===t);
              if (!inTab.length) return null;
              return (
                <button key={t} onClick={()=>{ setTab(t); setError(null); }}
                  style={{background:"#fdf4e3",border:`1.5px solid #f0c060`,borderRadius:6,padding:"3px 10px",
                    fontSize:11.5,fontWeight:700,color:AM.fg,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",gap:5}}>
                  {t}
                  <span style={{background:AM.fg,color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 6px",lineHeight:1.4}}>
                    {inTab.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{background:GN.bg,border:`1.5px solid #7bcf9a`,borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13.5,fontWeight:700,color:GN.fg,fontFamily:F}}>Profile complete</span>
          {currentEmp.status === "active"
            ? <span style={{fontSize:13,color:GN.fg,fontFamily:F,opacity:.75}}>Employee is active</span>
            : <Btn onClick={activateEmployee}>{saving?"Activating…":"Activate Employee"}</Btn>
          }
        </div>
      )}

      <div style={{maxHeight:"56vh",overflowY:"auto",paddingRight:2}}>

      {/* ── GENERAL ── */}
      {tab === "General" && (
        <>
          <div style={{background:SU,borderRadius:7,padding:"7px 12px",marginBottom:14,fontSize:11.5,color:TM,fontFamily:F}}>
            Employee ID: <span style={{fontFamily:"monospace",color:TX}}>{employee.id}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"90px 1fr 1fr 1fr",gap:12}}>
            <FormField label="Title">
              <select value={gen.title} onChange={e=>setGen(p=>({...p,title:e.target.value}))} style={selSt}>
                <option value="">—</option>
                {["Mr","Mrs","Ms","Miss","Dr","Prof"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="First Name">
              <TextInput value={gen.first_name} onChange={v=>setGen(p=>({...p,first_name:v}))} />
            </FormField>
            <FormField label="Middle Name" hint="optional">
              <TextInput value={gen.middle_name} onChange={v=>setGen(p=>({...p,middle_name:v}))} />
            </FormField>
            <FormField label="Surname">
              <TextInput value={gen.last_name} onChange={v=>setGen(p=>({...p,last_name:v}))} />
            </FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormField label="Date of Birth" hint="optional">
              <TextInput type="date" value={gen.date_of_birth} onChange={v=>setGen(p=>({...p,date_of_birth:v}))} />
            </FormField>
            <FormField label="External ID" hint="optional">
              <TextInput value={gen.external_id} onChange={v=>setGen(p=>({...p,external_id:v}))} placeholder="Payroll reference" />
            </FormField>
            <FormField label="Email">
              <TextInput type="email" value={gen.email} onChange={v=>setGen(p=>({...p,email:v}))} />
            </FormField>
            <FormField label="Mobile Phone">
              <TextInput value={gen.mobile_phone} onChange={v=>setGen(p=>({...p,mobile_phone:v}))} />
            </FormField>
          </div>
          <FormField label="Street Address">
            <TextInput value={gen.residential_street_address} onChange={v=>setGen(p=>({...p,residential_street_address:v}))} />
          </FormField>
          <FormField label="Address Line 2" hint="optional">
            <TextInput value={gen.residential_address_line2} onChange={v=>setGen(p=>({...p,residential_address_line2:v}))} />
          </FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 1fr",gap:12}}>
            <FormField label="City">
              <TextInput value={gen.residential_city} onChange={v=>setGen(p=>({...p,residential_city:v}))} />
            </FormField>
            <FormField label="Region">
              <TextInput value={gen.residential_region} onChange={v=>setGen(p=>({...p,residential_region:v}))} />
            </FormField>
            <FormField label="Post Code">
              <TextInput value={gen.residential_post_code} onChange={v=>setGen(p=>({...p,residential_post_code:v}))} />
            </FormField>
            <FormField label="Country">
              <TextInput value={gen.residential_country} onChange={v=>setGen(p=>({...p,residential_country:v}))} placeholder={isNZ?"New Zealand (required)":"Australia (required)"} />
            </FormField>
          </div>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={()=>doPatch(gen)}>{saving?"Saving…":"Save"}</Btn>
          </ModalActions>
        </>
      )}

      {/* ── EMPLOYMENT ── */}
      {tab === "Employment" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormField label="Start Date">
              <TextInput type="date" value={emp.start_date} onChange={v=>setEmp(p=>({...p,start_date:v}))} />
            </FormField>
            <FormField label="Employment Type">
              <select value={emp.employment_type} onChange={e=>setEmp(p=>({...p,employment_type:e.target.value}))} style={selSt}>
                <option value="">— Select —</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="casual">Casual</option>
              </select>
            </FormField>
            <FormField label="Job Title" hint="optional">
              <TextInput value={emp.job_title} onChange={v=>setEmp(p=>({...p,job_title:v}))} />
            </FormField>
            <FormField label="Pay Schedule">
              <select value={emp.pay_schedule_id} onChange={e=>setEmp(p=>({...p,pay_schedule_id:e.target.value}))} style={selSt}>
                <option value="">— Select —</option>
                {paySchedules.map(s=><option key={s.id} value={s.id}>{s.name} ({FREQ_LABELS[s.frequency]})</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={emp.status} onChange={e=>setEmp(p=>({...p,status:e.target.value}))} style={selSt}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
              </select>
            </FormField>
            <FormField label="End Date" hint="if terminated">
              <TextInput type="date" value={emp.end_date} onChange={v=>setEmp(p=>({...p,end_date:v}))} />
            </FormField>
            <FormField label="Leave Template">
              <select value={emp.leave_profile_id} onChange={e=>setEmp(p=>({...p,leave_profile_id:e.target.value}))} style={selSt}>
                <option value="">— Select —</option>
                {leaveProfiles.map(lp=><option key={lp.id} value={lp.id}>{lp.name}</option>)}
              </select>
            </FormField>
          </div>
          {paySettings.length > 0 && (
            <div style={{background:SU,borderRadius:7,padding:"9px 13px",marginBottom:14,fontSize:13,color:TM,fontFamily:F}}>
              Current rate: <strong style={{color:TX}}>
                {paySettings[0].pay_type==="salary"
                  ? `$${Number(paySettings[0].pay_rate).toFixed(2)}/yr (salary)`
                  : `$${Number(paySettings[0].pay_rate).toFixed(2)}/hr`}
              </strong>
              <span style={{marginLeft:8,fontSize:12,color:TT}}>effective {fmtDate(paySettings[0].effective_from)}</span>
            </div>
          )}
          <FormField label="Automatically Pay Employee">
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"4px 0"}}>
              <input type="checkbox" checked={emp.automatically_pay}
                onChange={e=>setEmp(p=>({...p,automatically_pay:e.target.checked}))}
                style={{width:16,height:16,accentColor:B,cursor:"pointer"}} />
              <span style={{fontSize:13.5,color:TX,fontFamily:F}}>Include in pay run automatically</span>
            </label>
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={()=>doPatch(emp)}>{saving?"Saving…":"Save"}</Btn>
          </ModalActions>
        </>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "Payments" && (
        <>
          <FormField label="Bank Name">
            <TextInput value={pay.bank_name} onChange={v=>setPay(p=>({...p,bank_name:v}))} placeholder="e.g. ANZ" />
          </FormField>
          <FormField label={isNZ?"Account Number":"BSB-Account"}>
            <TextInput value={pay.bank_account_number} onChange={v=>setPay(p=>({...p,bank_account_number:v}))}
              placeholder={isNZ?"00-0000-0000000-00":"123456-12345678"} />
          </FormField>
          <FormField label="Account Name">
            <TextInput value={pay.bank_account_name} onChange={v=>setPay(p=>({...p,bank_account_name:v}))} />
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={()=>doPatch(pay)}>{saving?"Saving…":"Save"}</Btn>
          </ModalActions>
        </>
      )}

      {/* ── TAX ── */}
      {tab === "Tax" && (
        <>
          {isNZ ? (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FormField label="IRD Number">
                  <TextInput value={taxVals.tax_identifier} onChange={v=>setTaxVals(p=>({...p,tax_identifier:v}))} placeholder="123-456-789" />
                </FormField>
                <FormField label="Tax Code">
                  <select value={taxVals.tax_code} onChange={e=>setTaxVals(p=>({...p,tax_code:e.target.value}))} style={selSt}>
                    <option value="">— Select —</option>
                    {NZ_TAX_CODES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="KiwiSaver Member">
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"4px 0"}}>
                  <input type="checkbox" checked={taxVals.kiwisaver_member}
                    onChange={e=>setTaxVals(p=>({...p,kiwisaver_member:e.target.checked}))}
                    style={{width:16,height:16,accentColor:B,cursor:"pointer"}} />
                  <span style={{fontSize:13.5,color:TX,fontFamily:F}}>Enrolled in KiwiSaver</span>
                </label>
              </FormField>
              {taxVals.kiwisaver_member && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <FormField label="Employee Contribution">
                    <select value={taxVals.kiwisaver_employee_rate} onChange={e=>setTaxVals(p=>({...p,kiwisaver_employee_rate:e.target.value}))} style={selSt}>
                      <option value="0.0300">3%</option>
                      <option value="0.0400">4%</option>
                      <option value="0.0600">6%</option>
                      <option value="0.0800">8%</option>
                      <option value="0.1000">10%</option>
                    </select>
                  </FormField>
                  <FormField label="Employer Contribution">
                    <select value={taxVals.kiwisaver_employer_rate} onChange={e=>setTaxVals(p=>({...p,kiwisaver_employer_rate:e.target.value}))} style={selSt}>
                      <option value="0.0300">3%</option>
                    </select>
                  </FormField>
                </div>
              )}
            </>
          ) : (
            <PlaceholderTab title="Tax — Australia (coming soon)" />
          )}
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            {isNZ && <Btn onClick={()=>doPatch(taxVals)}>{saving?"Saving…":"Save"}</Btn>}
          </ModalActions>
        </>
      )}

      {/* ── PAY SETTINGS ── */}
      {tab === "Pay Settings" && (
        <>
          {paySettings.length > 0 && (
            <div style={{marginBottom:20}}>
              {paySettings.map((ps,i) => (
                <div key={ps.id} style={{padding:"12px 0",borderBottom:`1px solid ${BR}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:13.5,fontWeight:600,color:TX,fontFamily:F,textTransform:"capitalize"}}>{ps.pay_type}</span>
                      <span style={{fontSize:13.5,color:TX,fontFamily:F}}> · ${Number(ps.pay_rate).toFixed(2)} · {ps.pay_frequency}</span>
                    </div>
                    {i===0 && <span style={{background:GN.bg,color:GN.fg,fontSize:11,fontWeight:700,borderRadius:4,padding:"2px 8px",fontFamily:F}}>CURRENT</span>}
                  </div>
                  <div style={{fontSize:12,color:TT,fontFamily:F,marginTop:3}}>
                    Tax: {ps.tax_code} · From: {fmtDate(ps.effective_from)}{ps.effective_to ? ` → ${fmtDate(ps.effective_to)}` : ""}
                    {ps.kiwisaver_rate && ` · KiwiSaver: ${(Number(ps.kiwisaver_rate)*100).toFixed(0)}%`}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!showPayForm ? (
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <Btn onClick={()=>setShowPayForm(true)} icon="plus">Add Pay Settings</Btn>
            </div>
          ) : (
            <>
              <div style={{fontSize:12,fontWeight:700,color:TM,textTransform:"uppercase",letterSpacing:.5,fontFamily:F,marginBottom:12}}>New Pay Settings</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FormField label="Pay Type">
                  <select value={payValues.pay_type} onChange={e=>setPayValues(p=>({...p,pay_type:e.target.value}))} style={selSt}>
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                    <option value="casual">Casual</option>
                  </select>
                </FormField>
                <FormField label={payValues.pay_type==="salary"?"Annual Salary ($)":"Hourly Rate ($)"}>
                  <TextInput value={payValues.pay_rate} onChange={v=>setPayValues(p=>({...p,pay_rate:v}))} placeholder="e.g. 28.50" />
                </FormField>
                <FormField label="Pay Frequency">
                  <select value={payValues.pay_frequency} onChange={e=>setPayValues(p=>({...p,pay_frequency:e.target.value}))} style={selSt}>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </FormField>
                <FormField label="Tax Code">
                  <select value={payValues.tax_code} onChange={e=>setPayValues(p=>({...p,tax_code:e.target.value}))} style={selSt}>
                    {NZ_TAX_CODES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                {payValues.pay_type !== "salary" && (
                  <FormField label="Hours Per Week">
                    <TextInput value={payValues.hours_per_week} onChange={v=>setPayValues(p=>({...p,hours_per_week:v}))} placeholder="e.g. 40" />
                  </FormField>
                )}
                <FormField label="Effective From">
                  <TextInput type="date" value={payValues.effective_from} onChange={v=>setPayValues(p=>({...p,effective_from:v}))} />
                </FormField>
                {isNZ && (
                  <FormField label="KiwiSaver Rate">
                    <select value={payValues.kiwisaver_rate} onChange={e=>setPayValues(p=>({...p,kiwisaver_rate:e.target.value}))} style={selSt}>
                      <option value="0.0300">3%</option>
                      <option value="0.0400">4%</option>
                      <option value="0.0600">6%</option>
                      <option value="0.0800">8%</option>
                      <option value="0.1000">10%</option>
                    </select>
                  </FormField>
                )}
              </div>
              {error && <ErrorMsg>{error}</ErrorMsg>}
              <ModalActions>
                <Btn ghost onClick={()=>{ setShowPayForm(false); setError(null); }}>Cancel</Btn>
                <Btn onClick={addPaySettings}>{saving?"Saving…":"Save Pay Settings"}</Btn>
              </ModalActions>
            </>
          )}
          {!showPayForm && paySettings.length > 0 && (
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn></ModalActions>
          )}
        </>
      )}

      </div>{/* end scroll container */}
    </Modal>
  );
}

/* ── EMPLOYEES ────────────────────────────────────────────── */
function Employees() {
  const [bureaus,          setBureaus]          = useState([]);
  const [selectedBureauId, setSelectedBureauId] = useState("all");
  const [allEmployers,     setAllEmployers]     = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [paySchedules,     setPaySchedules]     = useState([]);
  const [employees,        setEmployees]        = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [statusFilter,     setStatusFilter]     = useState("active");
  const [search,           setSearch]           = useState("");
  const [showNewModal,     setShowNewModal]      = useState(false);
  const [editingEmployee,  setEditingEmployee]  = useState(null);
  const [newValues,        setNewValues]        = useState({
    first_name:"", last_name:"", email:"", tax_identifier:"", pay_schedule_id:"",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (selectedEmployer) {
      loadEmployees(selectedEmployer.id);
      loadPaySchedules(selectedEmployer.id);
    }
  }, [selectedEmployer, statusFilter]);

  async function loadAll() {
    const res = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
    if (!res.ok) return;
    const bureaList = await res.json();
    setBureaus(bureaList);
    const all = [];
    for (const b of bureaList) {
      const r = await fetch(`${API_URL}/api/v1/bureaus/${b.id}/tenants`, { headers: apiHeaders() });
      if (r.ok) {
        const tenants = await r.json();
        tenants.forEach(t => { t._bureauId = b.id; t._bureauName = b.name; });
        all.push(...tenants);
      }
    }
    setAllEmployers(all);
    if (all.length > 0) setSelectedEmployer(all[0]);
  }

  async function loadEmployees(tenantId) {
    setLoading(true);
    try {
      const url = `${API_URL}/api/v1/tenants/${tenantId}/employees${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
      const res = await fetch(url, { headers: apiHeaders() });
      if (res.ok) setEmployees(await res.json());
    } finally { setLoading(false); }
  }

  async function loadPaySchedules(tenantId) {
    const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/pay-schedules`, { headers: apiHeaders() });
    if (res.ok) setPaySchedules(await res.json());
    else setPaySchedules([]);
  }

  const EMPTY_NEW = { first_name:"", last_name:"", email:"", tax_identifier:"", pay_schedule_id:"" };
  function closeNew() { setShowNewModal(false); setNewValues(EMPTY_NEW); setError(null); }

  async function createEmployee() {
    if (!selectedEmployer) return;
    if (!newValues.first_name || !newValues.last_name) { setError("First and last name are required."); return; }
    if (!newValues.email) { setError("Email is required."); return; }
    if (!newValues.tax_identifier) { setError(`${selectedEmployer?.jurisdiction==="AU"?"TFN":"IRD Number"} is required.`); return; }
    if (!newValues.pay_schedule_id) { setError("Please select a pay schedule."); return; }
    setSaving(true); setError(null);
    try {
      const body = {
        first_name: newValues.first_name,
        last_name: newValues.last_name,
        email: newValues.email,
        tax_identifier: newValues.tax_identifier,
        pay_schedule_id: newValues.pay_schedule_id,
      };
      const res = await fetch(`${API_URL}/api/v1/tenants/${selectedEmployer.id}/employees`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create employee"); return; }
      setEmployees(prev => [data, ...prev]);
      closeNew();
    } finally { setSaving(false); }
  }

  const visibleEmployers = selectedBureauId === "all"
    ? allEmployers
    : allEmployers.filter(t => t._bureauId === selectedBureauId);

  const filtered = employees.filter(e =>
    search === "" || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  function handleBureauChange(bureauId) {
    setSelectedBureauId(bureauId);
    const next = bureauId === "all" ? allEmployers : allEmployers.filter(t => t._bureauId === bureauId);
    if (next.length > 0) setSelectedEmployer(next[0]);
  }

  const selStyle = {border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 13px",fontSize:13,fontFamily:F,color:TX,background:WH};

  return (
    <div>
      {/* Filter bar row 1: Client / Employer / Pay Run / Status */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:600,color:TT,fontFamily:F,whiteSpace:"nowrap"}}>Filter by:</span>

        {/* Client */}
        <select value={selectedBureauId} onChange={e=>handleBureauChange(e.target.value)} style={selStyle}>
          <option value="all">All Clients</option>
          {bureaus.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Employer */}
        <select value={selectedEmployer?.id ?? ""} onChange={e=>setSelectedEmployer(visibleEmployers.find(t=>t.id===e.target.value))} style={selStyle}>
          {visibleEmployers.length === 0
            ? <option value="">No employers</option>
            : visibleEmployers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {/* Pay Run (placeholder) */}
        <select style={{...selStyle,color:TT}} disabled>
          <option>All Pay Runs</option>
        </select>

        {/* Status */}
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={selStyle}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
          <option value="all">All Statuses</option>
        </select>

        <div style={{flex:1}}/>

        {/* Search + action buttons */}
        <div style={{position:"relative"}}>
          <Icon d={ICONS.search} size={14} color={TT} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…"
            style={{border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 13px 7px 32px",fontSize:13,fontFamily:F,color:TX,width:200}}/>
        </div>
        <Btn ghost icon="upload">Import Employees</Btn>
        <Btn icon="plus" onClick={()=>{ setShowNewModal(true); setError(null); }}>Add Employee</Btn>
      </div>

      <Card>
        {loading ? (
          <div style={{padding:32,textAlign:"center",color:TT,fontFamily:F,fontSize:13.5}}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:40,textAlign:"center"}}>
            <div style={{fontSize:32,opacity:.12,marginBottom:12}}>◎</div>
            <div style={{fontSize:14,fontWeight:700,color:TT,fontFamily:F}}>No employees found</div>
            <div style={{fontSize:13,color:TT,fontFamily:F,marginTop:6}}>
              {employees.length===0 ? "Add the first employee to this employer." : "No employees match the current filter."}
            </div>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Employee</TH><TH>Employer</TH><TH>Jurisdiction</TH><TH>Status</TH><TH>Start Date</TH><TH></TH></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="trow">
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,background:BL,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:B,fontFamily:F,flexShrink:0}}>
                        {e.first_name[0]}{e.last_name[0]}
                      </div>
                      <span style={{fontSize:13.5,fontWeight:600,color:TX,fontFamily:F}}>{e.first_name} {e.last_name}</span>
                    </div>
                  </td>
                  <TD muted>{selectedEmployer?.name ?? "—"}</TD>
                  <TD><JurTag j={e.jurisdiction}/></TD>
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    {e.status === "draft" ? (() => {
                      const m = getMissingFields(e, (e.pay_settings_count ?? 0) > 0);
                      const total = REQUIRED_FIELDS.length + 1;
                      const pct = Math.round(((total - m.length) / total) * 100);
                      return (
                        <div style={{minWidth:120}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:11.5,fontWeight:700,color:AM.fg,fontFamily:F,textTransform:"uppercase",letterSpacing:.4}}>Draft</span>
                            <span style={{fontSize:11,color:AM.fg,fontFamily:F,opacity:.8}}>{pct}%</span>
                          </div>
                          <div style={{background:"#f0d890",borderRadius:99,height:4,overflow:"hidden"}}>
                            <div style={{width:`${pct}%`,height:"100%",background:AM.fg,borderRadius:99}}/>
                          </div>
                        </div>
                      );
                    })() : <Badge s={e.status}/>}
                  </td>
                  <TD muted>{fmtDate(e.start_date)}</TD>
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    <button onClick={()=>setEditingEmployee(e)}
                      style={{background:"none",border:`1.5px solid ${BR}`,borderRadius:6,color:B,fontWeight:600,fontSize:12.5,cursor:"pointer",fontFamily:F,padding:"4px 12px"}}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNewModal && (
        <Modal title={`New Employee`} onClose={closeNew} maxWidth={520}>
          {/* Employer context banner */}
          <div style={{background:BL,borderRadius:8,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
            <Icon d={ICONS.clients} size={14} color={B}/>
            <span style={{fontSize:13,color:BM,fontFamily:F}}>
              Adding to: <strong>{selectedEmployer?.name ?? "—"}</strong>
              {selectedEmployer?.jurisdiction && <><span style={{margin:"0 6px",opacity:.4}}>·</span><JurTag j={selectedEmployer.jurisdiction}/></>}
            </span>
          </div>

          <div style={{background:BL,borderLeft:`3px solid ${B}`,borderRadius:7,padding:"10px 14px",marginBottom:16,fontSize:12.5,color:BM,fontFamily:F}}>
            Enter the basics now — you can complete the full profile after adding the employee.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormField label="First Name">
              <TextInput value={newValues.first_name} onChange={v=>setNewValues(p=>({...p,first_name:v}))} autoFocus />
            </FormField>
            <FormField label="Last Name">
              <TextInput value={newValues.last_name} onChange={v=>setNewValues(p=>({...p,last_name:v}))} />
            </FormField>
            <FormField label="Email">
              <TextInput type="email" value={newValues.email} onChange={v=>setNewValues(p=>({...p,email:v}))} />
            </FormField>
            <FormField label={selectedEmployer?.jurisdiction==="AU"?"TFN":"IRD Number"}>
              <TextInput value={newValues.tax_identifier} onChange={v=>setNewValues(p=>({...p,tax_identifier:v}))} placeholder={selectedEmployer?.jurisdiction==="AU"?"123 456 782":"123-456-789"} />
            </FormField>
          </div>

          {/* Pay Schedule — full width, required */}
          <FormField label="Pay Schedule">
            {paySchedules.length === 0 ? (
              <div style={{background:AM.bg,color:AM.fg,borderRadius:7,padding:"9px 13px",fontSize:13,fontFamily:F}}>
                No pay schedules set up for this employer yet. Go to Clients → Edit Employer → Pay Schedules to add one first.
              </div>
            ) : (
              <select value={newValues.pay_schedule_id} onChange={e=>setNewValues(p=>({...p,pay_schedule_id:e.target.value}))}
                style={{width:"100%",border:`1.5px solid ${newValues.pay_schedule_id?BR:"#f0c060"}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:newValues.pay_schedule_id?TX:TT,background:WH}}>
                <option value="">— Select pay schedule —</option>
                {paySchedules.map(s=>(
                  <option key={s.id} value={s.id}>{s.name} ({FREQ_LABELS[s.frequency]})</option>
                ))}
              </select>
            )}
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeNew}>Cancel</Btn>
            <Btn onClick={createEmployee} disabled={paySchedules.length===0}>{saving ? "Creating…" : "Create Employee"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {editingEmployee && (
        <EmployeeDetailModal
          employee={editingEmployee}
          onClose={()=>setEditingEmployee(null)}
          onUpdated={updated=>{ setEmployees(prev=>prev.map(e=>e.id===updated.id?updated:e)); setEditingEmployee(updated); }}
          paySchedules={paySchedules}
        />
      )}
    </div>
  );
}

/* ── RULE SETS ────────────────────────────────────────────── */
const ENGINE_TABS = ["Overview","Gross to Net","Tax Rules","Leave Rules","Compliance","Benefits & Deductions"];
function RuleSets({ jur, setJur }) {
  const [tab, setTab] = useState("Overview");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TX, letterSpacing: -.4, fontFamily: F }}>Rule Sets</h2>
          <p style={{ fontSize: 13.5, color: TM, marginTop: 4, fontFamily: F }}>
            {jur === "ALL" ? "Configure calculation rules, tax logic, and leave settings by jurisdiction" : `Showing rules for ${jur}`}
          </p>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
      </div>
      <TabBar tabs={ENGINE_TABS} active={tab} setActive={setTab}/>
      {tab==="Overview"              && <EngineOverview setTab={setTab}/>}
      {tab==="Gross to Net"          && <GrossToNet/>}
      {tab==="Tax Rules"             && <TaxRules jur={jur}/>}
      {tab==="Leave Rules"           && <LeaveRules/>}
      {tab==="Compliance"            && <PlaceholderTab title="Compliance"/>}
      {tab==="Benefits & Deductions" && <PlaceholderTab title="Benefits & Deductions"/>}
    </div>
  );
}

function EngineOverview({ setTab }) {
  const modules=[
    {icon:"⚙️",title:"Gross to Net Engine", desc:"Configure wages, allowances and deduction calculations",         tab:"Gross to Net"},
    {icon:"🧮",title:"Tax Engine",           desc:"Configure PAYE, PAYG and jurisdiction withholding rules",        tab:"Tax Rules"},
    {icon:"🌿",title:"Leave Engine",         desc:"Configure leave accrual, entitlements and pay methods",          tab:"Leave Rules"},
    {icon:"📋",title:"Compliance Engine",    desc:"Regulatory filing rules and compliance thresholds",              tab:"Compliance"},
    {icon:"💰",title:"Benefits & Deductions",desc:"KiwiSaver, superannuation, allowances and deductions",           tab:"Benefits & Deductions"},
  ];
  return (
    <div>
      <div style={{background:BL,borderLeft:`3px solid ${B}`,borderRadius:8,padding:"13px 18px",marginBottom:24,display:"flex",gap:10,alignItems:"center"}}>
        <span>ℹ</span>
        <span style={{fontSize:13,color:BM,fontFamily:F}}>All payroll rules are version-controlled and jurisdiction-aware. Changes create new rule versions — historical pay runs are never affected.</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:18}}>
        {modules.slice(0,3).map(m=>(
          <Card key={m.title} className="eng-card" style={{padding:"22px",cursor:"pointer",border:`1.5px solid ${BR}`}} onClick={()=>setTab(m.tab)}>
            <div style={{fontSize:26,marginBottom:10}}>{m.icon}</div>
            <div style={{fontSize:14.5,fontWeight:700,color:TX,fontFamily:F,marginBottom:6}}>{m.title}</div>
            <div style={{fontSize:12.5,color:TM,fontFamily:F,lineHeight:1.5}}>{m.desc}</div>
            <div style={{marginTop:14,fontSize:12.5,color:B,fontWeight:600,fontFamily:F}}>Configure →</div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {modules.slice(3).map(m=>(
          <Card key={m.title} className="eng-card" style={{padding:"22px",cursor:"pointer",border:`1.5px solid ${BR}`}} onClick={()=>setTab(m.tab)}>
            <div style={{fontSize:26,marginBottom:10}}>{m.icon}</div>
            <div style={{fontSize:14.5,fontWeight:700,color:TX,fontFamily:F,marginBottom:6}}>{m.title}</div>
            <div style={{fontSize:12.5,color:TM,fontFamily:F,lineHeight:1.5}}>{m.desc}</div>
            <div style={{marginTop:14,fontSize:12.5,color:B,fontWeight:600,fontFamily:F}}>Configure →</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GrossToNet() {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <Stat label="Gross Pay" value="$1,356.20" sub="Before deductions"/>
        <Stat label="Total Deductions" value="$277.87" sub="PAYE + KS + ACC"/>
        <Stat label="Net Pay" value="$1,078.33" sub="Employee receives" dark/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{padding:"20px 22px"}}>
          <div style={{fontSize:11.5,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:14}}>Earnings</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Component</TH><TH>Hours</TH><TH>Rate</TH><TH>Amount</TH></tr></thead>
            <tbody>
              {GROSS_NET.earnings.map(e=>(
                <tr key={e.label} className="trow">
                  <TD bold>{e.label}</TD><TD mono muted>{e.hours}</TD><TD mono>{e.rate}</TD>
                  <td style={{padding:"12px 14px",fontFamily:F,fontWeight:700,color:GN.fg,fontSize:13.5,borderBottom:"1px solid #f0eef7"}}>{e.amount}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{padding:"12px 14px",fontFamily:F,fontWeight:700,fontSize:13.5,color:TX,borderTop:`2px solid ${BR}`}}>Gross Total</td>
                <td style={{padding:"12px 14px",fontFamily:F,fontWeight:800,color:TX,fontSize:14,borderTop:`2px solid ${BR}`}}>{GROSS_NET.gross}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card style={{padding:"20px 22px"}}>
          <div style={{fontSize:11.5,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:14}}>Deductions</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Deduction</TH><TH>Note</TH><TH>Amount</TH></tr></thead>
            <tbody>
              {GROSS_NET.deductions.map(d=>(
                <tr key={d.label} className="trow">
                  <TD bold>{d.label}</TD><TD muted>{d.note}</TD>
                  <td style={{padding:"12px 14px",fontFamily:F,fontWeight:700,color:RD.fg,fontSize:13.5,borderBottom:"1px solid #f0eef7"}}>{d.amount}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{padding:"12px 14px",fontFamily:F,fontWeight:700,fontSize:13.5,color:TX,borderTop:`2px solid ${BR}`}}>Total Deductions</td>
                <td style={{padding:"12px 14px",fontFamily:F,fontWeight:800,color:RD.fg,fontSize:14,borderTop:`2px solid ${BR}`}}>{GROSS_NET.totalDed}</td>
              </tr>
            </tbody>
          </table>
          <div style={{marginTop:16,background:B,borderRadius:9,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,.8)",fontFamily:F}}>Net Pay</span>
            <span style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:F}}>{GROSS_NET.net}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TaxRules({ jur: parentJur }) {
  const [localJur, setLocalJur] = useState("NZ");
  const jur = (parentJur && parentJur !== "ALL") ? parentJur : localJur;
  const filtered = TAX_RULES.filter(r => r.jur === jur);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{display:"flex",gap:8}}>
          {(!parentJur || parentJur === "ALL") && ["NZ","AU"].map(j=>(
            <button key={j} onClick={()=>setLocalJur(j)}
              style={{padding:"7px 20px",borderRadius:7,border:`1.5px solid ${jur===j?B:BR}`,
                background:jur===j?B:WH,color:jur===j?WH:TM,
                fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,transition:"all .15s"}}>
              {j==="NZ"?"🇳🇿":"🇦🇺"} {j} Rules
            </button>
          ))}
          {parentJur && parentJur !== "ALL" && (
            <span style={{fontSize:13,fontWeight:600,color:B,fontFamily:F}}>{parentJur === "NZ" ? "🇳🇿" : "🇦🇺"} {parentJur} Rules</span>
          )}
        </div>
        <Btn icon="plus">Add Rule</Btn>
      </div>
      <Card style={{padding:"20px 22px"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><TH>Rule Name</TH><TH>Rule Type</TH><TH>Applies To</TH><TH>Effective Date</TH><TH>Status</TH><TH>Overridable</TH><TH></TH></tr></thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id} className="trow">
                <TD bold>{r.name}</TD>
                <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                  <span style={{background:GY.bg,color:GY.fg,borderRadius:5,padding:"2px 9px",fontSize:11.5,fontWeight:600,fontFamily:F}}>{r.type}</span>
                </td>
                <TD muted>{r.applies}</TD><TD>{r.effective}</TD>
                <TD><Badge s={r.status}/></TD>
                <TD>{r.locked ? <Badge s="locked"/> : <Badge s="active"/>}</TD>
                <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                  {!r.locked && <button style={{background:"none",border:"none",color:B,fontWeight:600,fontSize:12.5,cursor:"pointer",fontFamily:F}}>Edit →</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function LeaveRules() {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <p style={{fontSize:13.5,color:TM,fontFamily:F}}>Configure leave entitlements, accrual methods and pay calculation rules per profile</p>
        <Btn icon="plus">Add Profile</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:24}}>
        {LEAVE_PROFILES.map(p=>(
          <Card key={p.id} className="eng-card" style={{padding:"22px",border:`1.5px solid ${BR}`,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{fontSize:14.5,fontWeight:700,color:TX,fontFamily:F}}>{p.name}</div>
              <span style={{background:BL,color:B,borderRadius:5,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:F}}>{p.employees} emp</span>
            </div>
            {[["Annual Leave",p.annual],["Sick Leave",p.sick],["Holiday Pay",p.holidayPay]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${BR}`}}>
                <span style={{fontSize:13,color:TM,fontFamily:F}}>{k}</span>
                <span style={{fontSize:13,fontWeight:600,color:TX,fontFamily:F}}>{v}</span>
              </div>
            ))}
            <button style={{marginTop:14,background:"none",border:"none",color:B,fontWeight:600,fontSize:12.5,cursor:"pointer",fontFamily:F,padding:0}}>Edit Profile →</button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── REPORTS ──────────────────────────────────────────────── */
const DB_TABLES = [
  { table:"bureaus",               label:"Bureaus" },
  { table:"tenants",               label:"Tenants" },
  { table:"tenant_jurisdictions",  label:"Tenant Jurisdictions" },
  { table:"jurisdictions",         label:"Jurisdictions" },
  { table:"users",                 label:"Users" },
  { table:"tenant_memberships",    label:"Tenant Memberships" },
  { table:"employees",             label:"Employees" },
  { table:"pay_settings",          label:"Pay Settings" },
  { table:"pay_schedules",         label:"Pay Schedules" },
  { table:"pay_runs",              label:"Pay Runs" },
  { table:"pay_run_items",         label:"Pay Run Items" },
  { table:"pay_run_line_items",    label:"Pay Run Line Items" },
  { table:"variable_pay_items",    label:"Variable Pay Items" },
  { table:"calculation_snapshots", label:"Calculation Snapshots" },
  { table:"rules",                 label:"Rules" },
  { table:"rule_versions",         label:"Rule Versions" },
  { table:"rule_overrides",        label:"Rule Overrides" },
  { table:"timesheets",            label:"Timesheets" },
  { table:"leave_types",           label:"Leave Types" },
  { table:"leave_profiles",        label:"Leave Profiles" },
  { table:"leave_profile_rules",   label:"Leave Profile Rules" },
  { table:"leave_entitlements",    label:"Leave Entitlements" },
  { table:"leave_transactions",    label:"Leave Transactions" },
  { table:"leave_requests",        label:"Leave Requests" },
  { table:"audit_log",             label:"Audit Log" },
];

function Reports({ jur, setJur }) {
  const [downloading, setDownloading] = useState(null);
  const [dlError, setDlError] = useState(null);

  async function downloadTable(table) {
    setDownloading(table);
    setDlError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/v1/admin/reports/${table}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(`Failed to download ${table}: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:TX, letterSpacing:-.4, fontFamily:F }}>Reports</h2>
          <p style={{ fontSize:13.5, color:TM, marginTop:4, fontFamily:F }}>
            Download any database table as a CSV file — opens directly in Excel.
          </p>
        </div>
      </div>

      {dlError && (
        <div style={{ background:RD.bg, color:RD.fg, borderRadius:8, padding:"10px 14px", fontSize:13, fontFamily:F, marginBottom:16 }}>
          {dlError}
        </div>
      )}

      <div style={{ marginBottom:8, fontSize:12, fontWeight:600, color:TM, fontFamily:F, letterSpacing:.5, textTransform:"uppercase" }}>
        Database Tables
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
        {DB_TABLES.map(({ table, label }) => {
          const isLoading = downloading === table;
          return (
            <button
              key={table}
              onClick={() => downloadTable(table)}
              disabled={!!downloading}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                gap:8, padding:"11px 14px",
                background:WH, border:`1.5px solid ${BR}`, borderRadius:8,
                cursor: downloading ? "wait" : "pointer",
                fontFamily:F, fontSize:13, color:TX, fontWeight:500,
                textAlign:"left", transition:"all .15s",
                opacity: (downloading && !isLoading) ? 0.5 : 1,
              }}
            >
              <span>{label}</span>
              {isLoading
                ? <span style={{ fontSize:11, color:TM }}>...</span>
                : <Icon d={ICONS.download} size={14} color={B} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── SETTINGS (with 5 sub-pages, each with placeholder tabs) ─ */
const SETTINGS_PAGES = {
  "settings-business":    { title:"Business Settings",   tabs:["Organisation","Branding","Billing","Notifications","Placeholder 5"] },
  "settings-payroll":     { title:"Payroll Settings",    tabs:["Pay Schedules","Default Rules","Tax Settings","Placeholder 4","Placeholder 5"] },
  "settings-engine":      { title:"Pay Engine Settings", tabs:["Rule Versions","Calculation Config","Placeholder 3","Placeholder 4","Placeholder 5"] },
  "settings-integration": { title:"Integration",         tabs:["API Keys","Webhooks","Connected Apps","Placeholder 4","Placeholder 5"] },
  "settings-other":       { title:"Other Settings",      tabs:["Placeholder 1","Placeholder 2","Placeholder 3","Placeholder 4","Placeholder 5"] },
};

function SettingsPage({ page }) {
  const cfg = SETTINGS_PAGES[page];
  const [tab, setTab] = useState(cfg.tabs[0]);
  // Reset tab when page changes
  useEffect(()=>{ setTab(cfg.tabs[0]); }, [page]);

  const isRealTab = (t) => !t.startsWith("Placeholder");

  return (
    <div>
      <SectionHead title={cfg.title}/>
      <TabBar tabs={cfg.tabs} active={tab} setActive={setTab}/>
      {/* Special: API Keys tab in Integration */}
      {page==="settings-integration" && tab==="API Keys" && <APIKeysContent/>}
      {/* Special: API Keys tab in Integration — Webhooks */}
      {page==="settings-integration" && tab==="Webhooks" && <WebhooksContent/>}
      {/* Special: Organisation tab */}
      {page==="settings-business" && tab==="Organisation" && <OrgContent/>}
      {/* Everything else */}
      {(tab.startsWith("Placeholder") || (isRealTab(tab) && !(
        (page==="settings-integration" && (tab==="API Keys"||tab==="Webhooks")) ||
        (page==="settings-business" && tab==="Organisation")
      ))) && <PlaceholderTab title={tab}/>}
    </div>
  );
}

function OrgContent() {
  const inp = (label,val) => (
    <div key={label} style={{marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:600,color:TM,marginBottom:5,fontFamily:F}}>{label}</div>
      <input defaultValue={val} style={{border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,width:"100%"}}/>
    </div>
  );
  return (
    <div style={{maxWidth:520}}>
      <Card style={{padding:"24px"}}>
        <div style={{fontSize:14,fontWeight:700,color:TX,fontFamily:F,marginBottom:20}}>Organisation Details</div>
        {inp("Organisation Name","Pay The Nanny")}
        {inp("Primary Jurisdiction","New Zealand")}
        {inp("Business Number (NZBN)","9429045678901")}
        {inp("Payroll Contact Email","payroll@paythenanny.co.nz")}
        <div style={{marginTop:8}}><Btn>Save Changes</Btn></div>
      </Card>
    </div>
  );
}

function APIKeysContent() {
  return (
    <div style={{maxWidth:640}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <span style={{fontSize:14,fontWeight:700,color:TX,fontFamily:F}}>API Keys</span>
        <Btn icon="plus">Generate Key</Btn>
      </div>
      {[
        {name:"Production Key",key:"ptk_live_••••••••3f9a",created:"Jan 12 2025",req:"12,430",live:true},
        {name:"Staging Key",   key:"ptk_test_••••••••8c2d",created:"Feb 3 2025", req:"4,210", live:false},
      ].map(k=>(
        <Card key={k.name} style={{padding:"18px 22px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:TX,fontFamily:F,display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {k.name}
                <span style={{background:k.live?GN.bg:GY.bg,color:k.live?GN.fg:GY.fg,borderRadius:5,padding:"1px 8px",fontSize:10.5,fontWeight:700,fontFamily:F}}>{k.live?"LIVE":"TEST"}</span>
              </div>
              <code style={{fontSize:12.5,color:TM,background:SU,padding:"4px 10px",borderRadius:6,display:"inline-block"}}>{k.key}</code>
            </div>
            <button style={{background:"none",border:"1px solid #f0c8c8",borderRadius:6,color:"#C05050",fontSize:12,fontWeight:600,cursor:"pointer",padding:"5px 12px",fontFamily:F}}>Revoke</button>
          </div>
          <div style={{fontSize:12,color:TT,marginTop:10,fontFamily:F}}>Created {k.created} · {k.req} requests</div>
        </Card>
      ))}
    </div>
  );
}

function WebhooksContent() {
  return (
    <div style={{maxWidth:540}}>
      <Card style={{padding:"20px 22px"}}>
        <div style={{fontSize:11.5,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:14}}>Webhook Events</div>
        {["payrun.completed","payslip.generated","employee.created","employee.updated","timesheet.submitted"].map(ev=>(
          <div key={ev} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${BR}`}}>
            <code style={{fontSize:13,color:TX,fontFamily:F}}>{ev}</code>
            <div style={{width:36,height:20,background:B,borderRadius:10,position:"relative",cursor:"pointer",flexShrink:0}}>
              <div style={{width:16,height:16,background:WH,borderRadius:"50%",position:"absolute",top:2,right:2,boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── USER ROLE BANNER ─────────────────────────────────────── */
function RoleBanner({ role }) {
  if(role==="admin") return null;
  const cfg = {
    client:   { msg:"Client View — Showing data for your organisation only.", color:BU },
    employee: { msg:"Employee View — Showing your personal payroll information only.", color:AM },
  }[role];
  if(!cfg) return null;
  return (
    <div style={{background:cfg.color.bg,borderBottom:`2px solid ${cfg.color.fg}20`,padding:"9px 28px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <span style={{fontSize:13,fontWeight:600,color:cfg.color.fg,fontFamily:F}}>
        {cfg.msg}
      </span>
      <span style={{fontSize:12,color:cfg.color.fg,opacity:.7,fontFamily:F}}>
        Switch role using the Admin / Client / Employee toggle in the top bar.
      </span>
    </div>
  );
}

/* ── CLIENTS PAGE (Bureaus & Employers) ───────────────────── */
const COUNTRY_OPTIONS = [
  { value: "",     label: "Select country…" },
  { value: "NZ",   label: "🇳🇿 New Zealand" },
  { value: "AU",   label: "🇦🇺 Australia" },
  { value: "BOTH", label: "🌐 Both NZ & AU" },
];

function ClientForm({ values, onChange }) {
  return (
    <>
      <FormField label="Client Name">
        <TextInput value={values.name ?? ""} onChange={v => onChange("name", v)} placeholder="e.g. Pay The Nanny" autoFocus />
      </FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormField label="Country">
          <select value={values.country ?? ""} onChange={e => onChange("country", e.target.value)}
            style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH}}>
            {COUNTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Admin Email">
          <TextInput value={values.admin_email ?? ""} onChange={v => onChange("admin_email", v)} placeholder="admin@example.com" />
        </FormField>
        <FormField label="Phone">
          <TextInput value={values.phone ?? ""} onChange={v => onChange("phone", v)} placeholder="+64 9 123 4567" />
        </FormField>
        <FormField label="Website">
          <TextInput value={values.website ?? ""} onChange={v => onChange("website", v)} placeholder="https://example.com" />
        </FormField>
      </div>
    </>
  );
}

const FREQ_LABELS = { weekly:"Weekly", fortnightly:"Fortnightly", monthly:"Monthly", one_off:"One-off Payment" };
const FREQ_COLORS = { weekly:GN, fortnightly:BU, monthly:AM, one_off:GY };

function EmployerDetail({ employer, onClose, onUpdated }) {
  const [tab,           setTab]           = useState("Details");
  const [editValues,    setEditValues]    = useState({ name: employer.name, status: employer.status });
  const [jurValues,     setJurValues]     = useState({ jurisdiction: "NZ", legal_entity_name: "", tax_id: "" });
  const [jurisdictions, setJurisdictions] = useState([]);
  const [schedules,     setSchedules]     = useState([]);
  const [showSchForm,   setShowSchForm]   = useState(false);
  const [schValues,     setSchValues]     = useState({
    name:"", frequency:"weekly", period_start:"", period_end:"", pay_date:"",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => { loadDetail(); loadSchedules(); }, []);

  async function loadDetail() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}`, { headers: apiHeaders() });
    if (res.ok) { const data = await res.json(); setJurisdictions(data.jurisdictions ?? []); }
  }

  async function loadSchedules() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/pay-schedules`, { headers: apiHeaders() });
    if (res.ok) setSchedules(await res.json());
  }

  async function saveDetails() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to save"); return; }
      onUpdated(data);
    } finally { setSaving(false); }
  }

  async function addJurisdiction() {
    setSaving(true); setError(null);
    try {
      const body = { jurisdiction: jurValues.jurisdiction };
      if (jurValues.legal_entity_name) body.legal_entity_name = jurValues.legal_entity_name;
      if (jurValues.tax_id)            body.tax_id = jurValues.tax_id;
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/jurisdictions`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to add jurisdiction"); return; }
      setJurisdictions(prev => {
        const idx = prev.findIndex(j => j.jurisdiction === data.jurisdiction);
        return idx >= 0 ? prev.map((j,i) => i===idx ? data : j) : [...prev, data];
      });
      setJurValues({ jurisdiction: "NZ", legal_entity_name: "", tax_id: "" });
    } finally { setSaving(false); }
  }

  async function createSchedule() {
    setSaving(true); setError(null);
    try {
      const body = {
        name: schValues.name, frequency: schValues.frequency,
        period_start: schValues.period_start, pay_date: schValues.pay_date,
      };
      if (schValues.frequency === "one_off") body.period_end = schValues.period_end;
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/pay-schedules`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create schedule"); return; }
      setSchedules(prev => [data, ...prev]);
      setShowSchForm(false);
      setSchValues({ name:"", frequency:"weekly", period_start:"", period_end:"", pay_date:"" });
    } finally { setSaving(false); }
  }

  const selStyle = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};
  const taxLabel = jurValues.jurisdiction === "AU" ? "ABN" : "NZBN";

  return (
    <Modal title={employer.name} onClose={onClose} maxWidth={580}>
      <TabBar tabs={["Details","Jurisdictions","Pay Schedules"]} active={tab} setActive={setTab}/>

      {tab === "Details" && (
        <>
          <FormField label="Employer Name">
            <TextInput value={editValues.name} onChange={v => setEditValues(p=>({...p,name:v}))} />
          </FormField>
          <FormField label="Status">
            <select value={editValues.status} onChange={e=>setEditValues(p=>({...p,status:e.target.value}))} style={selStyle}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={saveDetails}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </>
      )}

      {tab === "Jurisdictions" && (
        <>
          {jurisdictions.length > 0 && (
            <div style={{marginBottom:20}}>
              {jurisdictions.map(j => (
                <div key={j.jurisdiction} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${BR}`}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <JurTag j={j.jurisdiction}/>
                      <span style={{fontSize:13.5,fontWeight:600,color:TX,fontFamily:F}}>{j.legal_entity_name || "—"}</span>
                    </div>
                    <div style={{fontSize:12,color:TT,fontFamily:F}}>{j.jurisdiction==="AU"?"ABN":"NZBN"}: {j.tax_id || "Not set"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:12,fontWeight:700,color:TM,textTransform:"uppercase",letterSpacing:.5,fontFamily:F,marginBottom:12}}>
            {jurisdictions.length > 0 ? "Update Jurisdiction" : "Add Jurisdiction"}
          </div>
          <FormField label="Jurisdiction">
            <select value={jurValues.jurisdiction} onChange={e=>setJurValues(p=>({...p,jurisdiction:e.target.value}))} style={selStyle}>
              <option value="NZ">🇳🇿 New Zealand</option>
              <option value="AU">🇦🇺 Australia</option>
            </select>
          </FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormField label="Legal Entity Name">
              <TextInput value={jurValues.legal_entity_name} onChange={v=>setJurValues(p=>({...p,legal_entity_name:v}))} placeholder="Registered name" />
            </FormField>
            <FormField label={taxLabel} hint="encrypted in Phase 6">
              <TextInput value={jurValues.tax_id} onChange={v=>setJurValues(p=>({...p,tax_id:v}))} placeholder={jurValues.jurisdiction==="AU"?"12 345 678 901":"9429000000000"} />
            </FormField>
          </div>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={addJurisdiction}>{saving ? "Saving…" : "Save Jurisdiction"}</Btn>
          </ModalActions>
        </>
      )}

      {tab === "Pay Schedules" && (
        <>
          {/* Existing schedules list */}
          {schedules.length > 0 && (
            <div style={{marginBottom:20}}>
              {schedules.map(s => {
                const fc = FREQ_COLORS[s.frequency] || GY;
                return (
                  <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${BR}`}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <span style={{background:fc.bg,color:fc.fg,borderRadius:5,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:F}}>
                          {FREQ_LABELS[s.frequency]}
                        </span>
                        <span style={{fontSize:13.5,fontWeight:600,color:TX,fontFamily:F}}>{s.name}</span>
                        <JurTag j={s.jurisdiction}/>
                      </div>
                      <div style={{fontSize:12,color:TT,fontFamily:F}}>
                        Period: {fmtDate(s.period_start)} → {fmtDate(s.period_end)} · Pay date: {fmtDate(s.pay_date)}
                      </div>
                    </div>
                    {!s.is_active && <span style={{fontSize:11,color:TT,fontFamily:F}}>Inactive</span>}
                  </div>
                );
              })}
            </div>
          )}

          {!showSchForm ? (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <Btn icon="plus" onClick={()=>{ setShowSchForm(true); setError(null); }}>Add Pay Schedule</Btn>
            </div>
          ) : (
            <>
              <div style={{fontSize:12,fontWeight:700,color:TM,textTransform:"uppercase",letterSpacing:.5,fontFamily:F,marginBottom:14}}>New Pay Schedule</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FormField label="Schedule Name">
                  <TextInput value={schValues.name} onChange={v=>setSchValues(p=>({...p,name:v}))} placeholder="e.g. Weekly Wages" autoFocus />
                </FormField>
                <FormField label="Frequency">
                  <select value={schValues.frequency} onChange={e=>setSchValues(p=>({...p,frequency:e.target.value}))} style={selStyle}>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one_off">One-off Payment</option>
                  </select>
                </FormField>
                <FormField label={schValues.frequency === "one_off" ? "Period Start" : "First Period Start"}>
                  <TextInput type="date" value={schValues.period_start} onChange={v=>setSchValues(p=>({...p,period_start:v}))} />
                </FormField>
                {schValues.frequency === "one_off" && (
                  <FormField label="Period End">
                    <TextInput type="date" value={schValues.period_end} onChange={v=>setSchValues(p=>({...p,period_end:v}))} />
                  </FormField>
                )}
                <FormField label={schValues.frequency === "one_off" ? "Pay Date" : "First Pay Date"}>
                  <TextInput type="date" value={schValues.pay_date} onChange={v=>setSchValues(p=>({...p,pay_date:v}))} />
                </FormField>
              </div>
              {schValues.frequency !== "one_off" && (
                <div style={{fontSize:12,color:TT,fontFamily:F,marginBottom:12,marginTop:-4}}>
                  Period end is calculated automatically from the start date.
                </div>
              )}
              {error && <ErrorMsg>{error}</ErrorMsg>}
              <ModalActions>
                <Btn ghost onClick={()=>{ setShowSchForm(false); setError(null); }}>Cancel</Btn>
                <Btn onClick={createSchedule}>{saving ? "Saving…" : "Create Schedule"}</Btn>
              </ModalActions>
            </>
          )}
          {!showSchForm && (
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn></ModalActions>
          )}
        </>
      )}
    </Modal>
  );
}

function Clients() {
  const [clients,          setClients]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedClient,   setSelectedClient]   = useState(null);
  const [employers,        setEmployers]        = useState([]);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [showNewClient,    setShowNewClient]    = useState(false);
  const [showEditClient,   setShowEditClient]   = useState(false);
  const [showNewEmployer,  setShowNewEmployer]  = useState(false);
  const [editingEmployer,  setEditingEmployer]  = useState(null);
  const [newClientValues,  setNewClientValues]  = useState({name:"",country:"",admin_email:"",phone:"",website:""});
  const [editClientValues, setEditClientValues] = useState({});
  const [employerName,     setEmployerName]     = useState("");
  const [employerSlug,     setEmployerSlug]     = useState("");
  const [employerJur,      setEmployerJur]      = useState("NZ");
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (selectedClient) loadEmployers(selectedClient.id); }, [selectedClient]);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
      if (res.ok) { const data = await res.json(); setClients(data); if (data.length > 0) setSelectedClient(data[0]); }
    } finally { setLoading(false); }
  }

  async function loadEmployers(clientId) {
    setEmployersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${clientId}/tenants`, { headers: apiHeaders() });
      if (res.ok) setEmployers(await res.json());
    } finally { setEmployersLoading(false); }
  }

  function closeNewClient()   { setShowNewClient(false);   setNewClientValues({name:"",country:"",admin_email:"",phone:"",website:""}); setError(null); }
  function closeEditClient()  { setShowEditClient(false);  setEditClientValues({});    setError(null); }
  function closeNewEmployer() { setShowNewEmployer(false); setEmployerName(""); setEmployerSlug(""); setEmployerJur("NZ"); setError(null); }

  function openEditClient() {
    setEditClientValues({
      name:        selectedClient?.name        ?? "",
      country:     selectedClient?.country     ?? "",
      admin_email: selectedClient?.admin_email ?? "",
      phone:       selectedClient?.phone       ?? "",
      website:     selectedClient?.website     ?? "",
    });
    setShowEditClient(true); setError(null);
  }

  function handleEmployerNameChange(val) {
    setEmployerName(val);
    setEmployerSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function createClient() {
    setSaving(true); setError(null);
    try {
      const body = Object.fromEntries(Object.entries(newClientValues).filter(([,v]) => v !== ""));
      const res = await fetch(`${API_URL}/api/v1/bureaus`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create client"); return; }
      setClients(prev => [data, ...prev]); setSelectedClient(data); setEmployers([]); closeNewClient();
    } finally { setSaving(false); }
  }

  async function updateClient() {
    if (!selectedClient) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${selectedClient.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editClientValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to update client"); return; }
      setClients(prev => prev.map(c => c.id === data.id ? data : c)); setSelectedClient(data); closeEditClient();
    } finally { setSaving(false); }
  }

  async function createEmployer() {
    if (!selectedClient) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${selectedClient.id}/tenants`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ name: employerName, slug: employerSlug, jurisdiction: employerJur }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create employer"); return; }
      setEmployers(prev => [data, ...prev]); closeNewEmployer();
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div>
      <SectionHead
        title="Clients"
        sub="Manage your clients and their employers"
        actions={<Btn icon="plus" disabled>New Client</Btn>}
      />
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20,alignItems:"start"}}>
        {/* Client sidebar skeleton */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Clients</div>
          {[1,2,3].map(i => (
            <div key={i} style={{padding:"13px 16px",borderRadius:9,marginBottom:8,background:WH,border:`1.5px solid ${BR}`}}>
              <div style={{height:14,width:"70%",borderRadius:6,background:"#e8e4f0",marginBottom:8,animation:"pulse 1.4s ease-in-out infinite"}}/>
              <div style={{height:11,width:"40%",borderRadius:6,background:"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
            </div>
          ))}
        </div>
        {/* Employer panel skeleton */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{height:16,width:180,borderRadius:6,background:"#e8e4f0",marginBottom:8,animation:"pulse 1.4s ease-in-out infinite"}}/>
              <div style={{height:12,width:120,borderRadius:6,background:"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{height:32,width:90,borderRadius:8,background:"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
              <div style={{height:32,width:110,borderRadius:8,background:"#e8e4f0",animation:"pulse 1.4s ease-in-out infinite"}}/>
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Employers</div>
          <Card>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
              <tbody>
                {[1,2,3,4].map(i => (
                  <tr key={i} style={{borderBottom:`1px solid ${BR}`}}>
                    {[["55%",8],["20%",6],["18%",6],["8%",6]].map(([w,h],j) => (
                      <td key={j} style={{padding:"12px 14px"}}>
                        <div style={{height:h,width:w,borderRadius:4,background:i%2===0?"#e8e4f0":"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );

  return (
    <div>
      <SectionHead
        title="Clients"
        sub="Manage your clients and their employers"
        actions={<Btn icon="plus" onClick={()=>{ setShowNewClient(true); setError(null); }}>New Client</Btn>}
      />

      {clients.length === 0 ? (
        <Card style={{padding:48,textAlign:"center"}}>
          <div style={{fontSize:36,opacity:.12,marginBottom:14}}>◎</div>
          <div style={{fontSize:15,fontWeight:700,color:TT,fontFamily:F}}>No clients yet</div>
          <div style={{fontSize:13,color:TT,fontFamily:F,marginTop:6}}>Create your first client to get started.</div>
        </Card>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20,alignItems:"start"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Clients</div>
            {clients.map(c => (
              <div key={c.id} onClick={()=>setSelectedClient(c)} className="card-h"
                style={{padding:"13px 16px",borderRadius:9,marginBottom:8,cursor:"pointer",
                  background:selectedClient?.id===c.id?BL:WH,
                  border:`1.5px solid ${selectedClient?.id===c.id?B:BR}`,transition:"all .15s"}}>
                <div style={{fontSize:13.5,fontWeight:600,color:selectedClient?.id===c.id?B:TX,fontFamily:F}}>{c.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                  {c.country && <JurTag j={c.country==="BOTH"?"ALL":c.country}/>}
                  <span style={{fontSize:11.5,color:TT,fontFamily:F}}>{c.is_active?"Active":"Inactive"}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedClient && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:TX,fontFamily:F}}>{selectedClient.name}</div>
                  <div style={{display:"flex",gap:16,marginTop:4}}>
                    {selectedClient.admin_email && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>✉ {selectedClient.admin_email}</span>}
                    {selectedClient.phone       && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>☎ {selectedClient.phone}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn ghost small onClick={openEditClient}>Edit Client</Btn>
                  <Btn icon="plus" small onClick={()=>{ setShowNewEmployer(true); setError(null); }}>New Employer</Btn>
                </div>
              </div>

              <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Employers</div>

              {employersLoading ? (
                <Card>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
                    <tbody>
                      {[1,2,3].map(i => (
                        <tr key={i} style={{borderBottom:`1px solid ${BR}`}}>
                          {[["55%",8],["20%",6],["18%",6],["8%",6]].map(([w,h],j) => (
                            <td key={j} style={{padding:"12px 14px"}}>
                              <div style={{height:h,width:w,borderRadius:4,background:i%2===0?"#e8e4f0":"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
                </Card>
              ) : employers.length === 0 ? (
                <Card style={{padding:32,textAlign:"center"}}>
                  <div style={{fontSize:13.5,color:TT,fontFamily:F}}>No employers yet. Add the first one.</div>
                </Card>
              ) : (
                <Card>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
                    <tbody>
                      {employers.map(e => (
                        <tr key={e.id} className="trow">
                          <TD bold>{e.name}</TD>
                          <TD><Badge s={e.status}/></TD>
                          <TD muted>{new Date(e.created_at).toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"})}</TD>
                          <TD>
                            <button onClick={()=>setEditingEmployer(e)}
                              style={{background:"none",border:`1px solid ${BR}`,borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:600,color:TM,cursor:"pointer",fontFamily:F}}>
                              Edit
                            </button>
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {showNewClient && (
        <Modal title="New Client" onClose={closeNewClient}>
          <ClientForm values={newClientValues} onChange={(k,v)=>setNewClientValues(p=>({...p,[k]:v}))} />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeNewClient}>Cancel</Btn>
            <Btn onClick={createClient}>{saving ? "Creating…" : "Create Client"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {showEditClient && (
        <Modal title={`Edit Client — ${selectedClient?.name}`} onClose={closeEditClient}>
          <ClientForm values={editClientValues} onChange={(k,v)=>setEditClientValues(p=>({...p,[k]:v}))} />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeEditClient}>Cancel</Btn>
            <Btn onClick={updateClient}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {showNewEmployer && (
        <Modal title={`New Employer under ${selectedClient?.name}`} onClose={closeNewEmployer}>
          <FormField label="Employer Name">
            <TextInput value={employerName} onChange={handleEmployerNameChange} placeholder="e.g. Smith Family" autoFocus />
          </FormField>
          <FormField label="Jurisdiction">
            <select value={employerJur} onChange={e=>setEmployerJur(e.target.value)}
              style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH}}>
              <option value="NZ">🇳🇿 New Zealand</option>
              <option value="AU">🇦🇺 Australia</option>
            </select>
          </FormField>
          <FormField label="Slug" hint="auto-generated — edit if needed">
            <TextInput value={employerSlug} onChange={setEmployerSlug} placeholder="e.g. smith-family" />
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeNewEmployer}>Cancel</Btn>
            <Btn onClick={createEmployer}>{saving ? "Creating…" : "Create Employer"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {editingEmployer && (
        <EmployerDetail
          employer={editingEmployer}
          onClose={()=>setEditingEmployer(null)}
          onUpdated={updated=>{ setEmployers(prev=>prev.map(e=>e.id===updated.id?updated:e)); setEditingEmployer(updated); }}
        />
      )}
    </div>
  );
}

/* ── APP ROOT ─────────────────────────────────────────────── */
export default function App() {
  const { user, logout } = useAuth();
  const [page,      setPage]      = useState("dashboard");
  const [openMenu,  setOpenMenu]  = useState(null);
  const [jur,       setJur]       = useState("ALL");
  const [userRole,  setUserRole]  = useState("admin");

  const navigate = (p) => {
    setPage(p);
    if(["timesheets","expenses","leave"].includes(p))               setOpenMenu("payroll-inputs");
    else if(Object.keys(SETTINGS_PAGES).includes(p))               setOpenMenu("settings");
  };

  const getActionEl = () => {
    if(page==="pay-runs")  return <Btn icon="plus">New Pay Run</Btn>;
    if(page==="rule-sets") return <Btn icon="plus">Add Rule Set</Btn>;
    if(page==="dashboard") return (
      <button onClick={()=>navigate("pay-runs")} style={{background:"none",border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,color:TM}}>
        View Pay Runs →
      </button>
    );
    return null;
  };

  const isSettingsPage = Object.keys(SETTINGS_PAGES).includes(page);

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",height:"100vh",fontFamily:F,background:BG,color:TX,overflow:"hidden"}}>
        <Sidebar page={page} setPage={navigate} openMenu={openMenu} setOpenMenu={setOpenMenu} user={user} onLogout={logout}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Topbar page={page} jur={jur} setJur={setJur} actionEl={getActionEl()} userRole={userRole} setUserRole={setUserRole}/>
          <RoleBanner role={userRole}/>
          <main style={{flex:1,overflowY:"auto",padding:"26px 28px",background:BG}}>
            {page==="dashboard"                    && <Dashboard setPage={navigate} jur={jur} setJur={setJur}/>}
            {page==="clients"                      && <Clients/>}
            {page==="pay-runs"                     && <PayRuns jur={jur} setJur={setJur}/>}
            {page==="employees"                    && <Employees jur={jur} setJur={setJur}/>}
            {page==="rule-sets"                    && <RuleSets jur={jur} setJur={setJur}/>}
            {page==="reports"                      && <Reports jur={jur} setJur={setJur}/>}
            {isSettingsPage                        && <SettingsPage page={page}/>}
            {["timesheets","expenses","leave"].includes(page) && <PlaceholderTab title={PAGE_LABELS[page]}/>}
          </main>
        </div>
      </div>
    </>
  );
}
