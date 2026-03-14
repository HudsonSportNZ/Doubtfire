import { useLocation } from "react-router-dom";
import { B, BU, AM, TX, TM, F, WH } from "../lib/constants";
import { PATH_LABELS, USER_ROLES, ICONS } from "../lib/constants";
import { Icon, JurisdictionDropdown } from "./ui";

export function Topbar({ jur, setJur, actionEl, userRole, setUserRole }) {
  const location = useLocation();
  const path = location.pathname;
  // Handle dynamic routes not in PATH_LABELS
  const dynamicLabel =
    /^\/employees\//.test(path) ? "Employee" :
    /^\/employers\//.test(path) ? "Employer" :
    /^\/clients\//.test(path)   ? "Client"   : null;
  const label = dynamicLabel || PATH_LABELS[path] || path.replace("/", "");

  return (
    <>
      <div style={{background:B,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:"rgba(255,255,255,.5)",fontSize:13,fontFamily:F}}>Payroll Engine</span>
          <span style={{color:"rgba(255,255,255,.25)"}}>›</span>
          <span style={{color:"#fff",fontSize:13,fontWeight:600,fontFamily:F}}>{label}</span>
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
          <JurisdictionDropdown jur={jur} setJur={setJur}/>
          <div style={{width:1,height:18,background:"rgba(255,255,255,.2)"}}/>
          <div style={{position:"relative",cursor:"pointer",display:"flex",alignItems:"center"}}>
            <Icon d={ICONS.bell} size={18} color="rgba(255,255,255,.7)"/>
            <span style={{position:"absolute",top:-5,right:-5,width:14,height:14,background:"#D94040",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,fontFamily:F}}>3</span>
          </div>
          <div style={{width:30,height:30,background:"rgba(255,255,255,.18)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11.5,fontWeight:700,fontFamily:F}}>OT</div>
        </div>
      </div>
      {/* Sub-header */}
      <div style={{background:WH,borderBottom:`1px solid #e8e5f0`,padding:"0 28px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <h1 style={{fontSize:16,fontWeight:700,color:TX,letterSpacing:-.3,fontFamily:F}}>{label}</h1>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>{actionEl}</div>
      </div>
    </>
  );
}

export function RoleBanner({ role }) {
  if (role === "admin") return null;
  const cfg = {
    client:   { msg:"Client View — Showing data for your organisation only.", color:BU },
    employee: { msg:"Employee View — Showing your personal payroll information only.", color:AM },
  }[role];
  if (!cfg) return null;
  return (
    <div style={{background:cfg.color.bg,borderBottom:`2px solid ${cfg.color.fg}20`,padding:"9px 28px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <span style={{fontSize:13,fontWeight:600,color:cfg.color.fg,fontFamily:F}}>{cfg.msg}</span>
      <span style={{fontSize:12,color:cfg.color.fg,opacity:.7,fontFamily:F}}>
        Switch role using the Admin / Client / Employee toggle in the top bar.
      </span>
    </div>
  );
}
