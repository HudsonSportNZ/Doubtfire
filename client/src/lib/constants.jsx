/* ── DESIGN TOKENS ────────────────────────────────────────── */
export const B  = "#39175D";
export const BD = "#2d1048";
export const BL = "#f0ebf8";
export const BM = "#6b3fa0";
export const TX = "#1a1625";
export const TM = "#5a5270";
export const TT = "#9b96ad";
export const SU = "#f7f6fa";
export const BG = "#f2f1f6";
export const WH = "#ffffff";
export const BR = "#e8e5f0";
export const GN = { bg:"#eaf5ee", fg:"#1a7a3c" };
export const AM = { bg:"#fdf4e3", fg:"#8a5a00" };
export const RD = { bg:"#fdeaea", fg:"#8a1f1f" };
export const BU = { bg:"#e8f0fc", fg:"#2a4a9a" };
export const GY = { bg:"#f0eef5", fg:"#5a5270" };
export const F  = "'Barlow', sans-serif";

/* ── ICONS ────────────────────────────────────────────────── */
export const ICONS = {
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
export const JURISDICTIONS = [
  { code:"ALL", label:"All Countries",   flag:"🌐" },
  { code:"NZ",  label:"New Zealand",     flag:"🇳🇿" },
  { code:"AU",  label:"Australia",       flag:"🇦🇺" },
  { code:"CA",  label:"Canada",          flag:"🇨🇦", coming:true },
  { code:"UK",  label:"United Kingdom",  flag:"🇬🇧", coming:true },
  { code:"US",  label:"United States",   flag:"🇺🇸", coming:true },
];

export const USER_ROLES = [
  { code:"admin",    label:"Admin",    desc:"Full platform access — manages all clients, rules, and settings" },
  { code:"client",   label:"Client",   desc:"Employer view — manages their own employees and pay runs" },
  { code:"employee", label:"Employee", desc:"Employee self-service — view payslips, submit leave, update details" },
];

export const FREQ_LABELS = { weekly:"Weekly", fortnightly:"Fortnightly", monthly:"Monthly", one_off:"One-off Payment" };
export const FREQ_COLORS = { weekly:GN, fortnightly:BU, monthly:AM, one_off:GY };

/* ── NAVIGATION STRUCTURE (path-aware) ───────────────────── */
export const NAV = [
  { id:"dashboard",      label:"Dashboard",      iconKey:"dashboard", path:"/" },
  { id:"clients",        label:"Clients",        iconKey:"clients",   path:"/clients" },
  { id:"pay-runs",       label:"Pay Runs",       iconKey:"payRuns",   path:"/pay-runs" },
  { id:"employees",      label:"Employees",      iconKey:"employees", path:"/employees" },
  { id:"payroll-inputs", label:"Payroll Inputs", iconKey:"inputs",    children:[
    { id:"timesheets", label:"Timesheets", path:"/timesheets" },
    { id:"expenses",   label:"Expenses",   path:"/expenses"   },
    { id:"leave",      label:"Leave",      path:"/leave"      },
  ]},
  { id:"rule-sets",  label:"Rule Sets", iconKey:"ruleSets", path:"/rule-sets" },
  { id:"reports",    label:"Reports",   iconKey:"reports",  path:"/reports"   },
  { id:"settings",   label:"Settings",  iconKey:"settings", children:[
    { id:"settings-business",     label:"Business Settings",   path:"/settings/business"     },
    { id:"settings-payroll",      label:"Payroll Settings",    path:"/settings/payroll"      },
    { id:"settings-engine",       label:"Pay Engine Settings", path:"/settings/engine"       },
    { id:"settings-integration",  label:"Integration",         path:"/settings/integration"  },
    { id:"settings-other",        label:"Other Settings",      path:"/settings/other"        },
  ]},
];

export const PATH_LABELS = {
  "/":                     "Dashboard",
  "/clients":              "Clients",
  "/pay-runs":             "Pay Runs",
  "/employees":            "Employees",
  "/timesheets":           "Timesheets",
  "/expenses":             "Expenses",
  "/leave":                "Leave",
  "/rule-sets":            "Rule Sets",
  "/reports":              "Reports",
  "/settings/business":    "Business Settings",
  "/settings/payroll":     "Payroll Settings",
  "/settings/engine":      "Pay Engine Settings",
  "/settings/integration": "Integration",
  "/settings/other":       "Other Settings",
};

/* ── GLOBAL CSS ───────────────────────────────────────────── */
export const CSS = `
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

/* ── MOCK DATA ────────────────────────────────────────────── */
export const UPCOMING = [
  { id:1, name:"Weekly Payroll – NZ",  date:"Mon 10 Mar", emp:42,  status:"ready",   jur:"NZ" },
  { id:2, name:"Fortnightly – AU",     date:"Wed 12 Mar", emp:28,  status:"draft",   jur:"AU" },
  { id:3, name:"Monthly Household",   date:"Fri 28 Mar", emp:156, status:"pending", jur:"NZ" },
];
export const ALERTS = [
  { id:1, sev:"warn",  msg:"3 employees missing timesheets",     sub:"Weekly Payroll · Due in 2 days" },
  { id:2, sev:"info",  msg:"New employee onboarding incomplete", sub:"Sarah Chen · Pay The Nanny" },
  { id:3, sev:"error", msg:"KiwiSaver rate mismatch detected",  sub:"Johnson Family · 2 employees" },
];
export const ACTIVITY = [
  { id:1, ev:"Pay Run Completed",  client:"Smith Family",   emp:1, net:"$1,120.00",  time:"2h ago",    jur:"NZ" },
  { id:2, ev:"Payslips Generated", client:"Auckland Homes", emp:8, net:"$14,340.00", time:"5h ago",    jur:"NZ" },
  { id:3, ev:"Pay Run Completed",  client:"SydCare Pty",    emp:4, net:"$9,820.00",  time:"Yesterday", jur:"AU" },
  { id:4, ev:"New Employee Added", client:"Walker Family",  emp:1, net:"—",          time:"Yesterday", jur:"NZ" },
];
export const PAY_RUNS = [
  { id:1, schedule:"Weekly",      period:"3–9 Mar 2026",   datePaid:"10 Mar 2026", status:"finalised", emp:42,  ird:"finalised", payslips:"sent",     jur:"NZ" },
  { id:2, schedule:"Fortnightly", period:"24 Feb–9 Mar",   datePaid:"12 Mar 2026", status:"pending",   emp:28,  ird:"pending",   payslips:"not sent", jur:"AU" },
  { id:3, schedule:"Monthly",     period:"1–31 Mar 2026",  datePaid:"28 Mar 2026", status:"draft",     emp:156, ird:"draft",     payslips:"not sent", jur:"NZ" },
  { id:4, schedule:"Weekly",      period:"24 Feb–2 Mar",   datePaid:"3 Mar 2026",  status:"finalised", emp:42,  ird:"finalised", payslips:"sent",     jur:"NZ" },
  { id:5, schedule:"Fortnightly", period:"10–23 Feb",      datePaid:"24 Feb 2026", status:"finalised", emp:27,  ird:"finalised", payslips:"sent",     jur:"AU" },
];
export const TAX_RULES = [
  { id:1, name:"NZ PAYE",             type:"Tax Table",  applies:"Gross Income",        effective:"1 Apr 2024", status:"active", jur:"NZ", locked:true  },
  { id:2, name:"ACC Levy",            type:"Fixed Rate", applies:"Gross Earnings",      effective:"1 Apr 2024", status:"active", jur:"NZ", locked:true  },
  { id:3, name:"KiwiSaver Employee",  type:"Percentage", applies:"Gross Wages",         effective:"1 Apr 2024", status:"active", jur:"NZ", locked:false },
  { id:4, name:"KiwiSaver Employer",  type:"Percentage", applies:"Gross Wages",         effective:"1 Apr 2024", status:"active", jur:"NZ", locked:false },
  { id:5, name:"AU PAYG Withholding", type:"Tax Table",  applies:"Gross Income",        effective:"1 Jul 2024", status:"active", jur:"AU", locked:true  },
  { id:6, name:"AU Superannuation",   type:"Percentage", applies:"Ordinary Time Earn.", effective:"1 Jul 2024", status:"active", jur:"AU", locked:true  },
];
export const LEAVE_PROFILES = [
  { id:1, name:"Standard Employees", annual:"4 weeks",  sick:"10 days", holidayPay:"Included", employees:380 },
  { id:2, name:"Management",         annual:"5 weeks",  sick:"10 days", holidayPay:"Included", employees:22  },
  { id:3, name:"Casual Employees",   annual:"N/A",      sick:"N/A",     holidayPay:"8% gross", employees:215 },
];
export const GROSS_NET = {
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
