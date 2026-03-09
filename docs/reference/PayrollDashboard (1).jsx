import { useState, useRef, useEffect } from "react";

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

/* ── NAV STRUCTURE ────────────────────────────────────────── */
const NAV = [
  { id:"dashboard", label:"Dashboard",     iconKey:"dashboard" },
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
  dashboard:"Dashboard", "pay-runs":"Pay Runs", employees:"Employees",
  timesheets:"Timesheets", expenses:"Expenses", leave:"Leave",
  "rule-sets":"Rule Sets", reports:"Reports",
  "settings-business":"Business Settings", "settings-payroll":"Payroll Settings",
  "settings-engine":"Pay Engine Settings", "settings-integration":"Integration",
  "settings-other":"Other Settings", settings:"Settings",
};

/* ── SIDEBAR ──────────────────────────────────────────────── */
function Sidebar({ page, setPage, openMenu, setOpenMenu }) {
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

      {/* User role indicator */}
      <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,background:"rgba(255,255,255,.18)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,fontFamily:F,flexShrink:0}}>OT</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"rgba(255,255,255,.9)",fontSize:12.5,fontWeight:600,fontFamily:F,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Ops Team</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:11,fontFamily:F}}>Admin</div>
          </div>
        </div>
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

/* ── EMPLOYEES ────────────────────────────────────────────── */
function Employees({ jur, setJur }) {
  const filtered = jur === "ALL" ? EMPLOYEES : EMPLOYEES.filter(e => e.jur === jur);
  return (
    <div>
      <SectionHead
        title="Employees"
        sub={`${filtered.length} employee${filtered.length !== 1 ? "s" : ""}${jur !== "ALL" ? ` in ${jur}` : " across all countries"}`}
        actions={<><Btn ghost icon="upload">Import Employees</Btn><Btn icon="plus">Add New Employee</Btn></>}
      />
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PageJurFilter jur={jur} setJur={setJur} />
            {jur !== "ALL" && (
              <button onClick={() => setJur("ALL")} style={{ background: "none", border: "none", color: TT, fontSize: 12.5, cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>Clear</button>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <Icon d={ICONS.search} size={14} color={TT} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input placeholder="Search employees…" style={{ border: `1.5px solid ${BR}`, borderRadius: 7, padding: "7px 13px 7px 32px", fontSize: 13, fontFamily: F, color: TX, width: 220 }} />
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><TH>Employee</TH><TH>Pay Frequency</TH><TH>Rule Set</TH><TH>Start Date</TH><TH>Last Paid Date</TH><TH></TH></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ padding: "28px 14px", textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>No employees found for this country.</td></tr>
              : filtered.map(e => (
                <tr key={e.id} className="trow">
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: BL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: B, fontFamily: F, flexShrink: 0 }}>
                        {e.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: TX, fontFamily: F }}>{e.name}</span>
                    </div>
                  </td>
                  <TD>{e.freq}</TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <span style={{ background: BL, color: BM, borderRadius: 5, padding: "2px 9px", fontSize: 12, fontWeight: 600, fontFamily: F }}>{e.ruleSet}</span>
                  </td>
                  <TD muted>{e.start}</TD><TD muted>{e.lastPaid}</TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <button style={{ background: "none", border: `1.5px solid ${BR}`, borderRadius: 6, color: B, fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: F, padding: "4px 12px" }}>View</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
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
function Reports({ jur, setJur }) {
  const cards=[
    {icon:"📊",title:"Payroll Summary",    desc:"Summary of all pay runs, gross and net totals by period"},
    {icon:"🧾",title:"Tax Reports",        desc:"PAYE, PAYG and withholding reports for IRD and ATO filing"},
    {icon:"🌿",title:"Leave Reports",      desc:"Leave balances, accruals and usage by employee"},
    {icon:"👤",title:"Employee Earnings",  desc:"Individual earnings history and YTD totals"},
    {icon:"📤",title:"Export Centre",      desc:"Download CSV, XLSX and filing format exports"},
    {icon:"📋",title:"Compliance Reports", desc:"Regulatory compliance snapshots and audit exports"},
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TX, letterSpacing: -.4, fontFamily: F }}>Reports</h2>
          <p style={{ fontSize: 13.5, color: TM, marginTop: 4, fontFamily: F }}>
            {jur === "ALL" ? "Generate and export payroll reports across all countries" : `Reports filtered for ${jur}`}
          </p>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {cards.map(c=>(
          <Card key={c.title} className="card-h" style={{padding:"24px",cursor:"pointer",transition:"all .18s"}}>
            <div style={{fontSize:28,marginBottom:12}}>{c.icon}</div>
            <div style={{fontSize:15,fontWeight:700,color:TX,fontFamily:F,marginBottom:6}}>{c.title}</div>
            <div style={{fontSize:13,color:TM,fontFamily:F,lineHeight:1.5}}>{c.desc}</div>
            {jur !== "ALL" && <div style={{ fontSize: 11.5, color: B, fontWeight: 600, fontFamily: F, marginTop: 8 }}>{jur} only</div>}
            <div style={{marginTop:12,fontSize:13,color:B,fontWeight:600,fontFamily:F}}>Generate →</div>
          </Card>
        ))}
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

/* ── APP ROOT ─────────────────────────────────────────────── */
export default function App() {
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
    if(page==="employees") return (
      <div style={{display:"flex",gap:8}}>
        <Btn ghost icon="upload">Import Employees</Btn>
        <Btn icon="plus">Add New Employee</Btn>
      </div>
    );
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
        <Sidebar page={page} setPage={navigate} openMenu={openMenu} setOpenMenu={setOpenMenu}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Topbar page={page} jur={jur} setJur={setJur} actionEl={getActionEl()} userRole={userRole} setUserRole={setUserRole}/>
          <RoleBanner role={userRole}/>
          <main style={{flex:1,overflowY:"auto",padding:"26px 28px",background:BG}}>
            {page==="dashboard"                    && <Dashboard setPage={navigate} jur={jur} setJur={setJur}/>}
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
