import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { B, F, WH } from "../lib/constants";
import { NAV, ICONS } from "../lib/constants";
import { Icon } from "./ui";

export default function Sidebar({ user, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const path      = location.pathname;

  // Auto-open the parent group whose child matches the current path
  const activeParent = NAV.find(n => n.children?.some(c => c.path === path));
  const [openMenu, setOpenMenu] = useState(activeParent?.id ?? null);

  useEffect(() => {
    const parent = NAV.find(n => n.children?.some(c => c.path === path));
    if (parent) setOpenMenu(parent.id);
  }, [path]);

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
          const isActive = n.children
            ? n.children.some(c => c.path === path)
            : path === n.path;
          const isOpen   = openMenu === n.id;
          const iconPaths = ICONS[n.iconKey];

          return (
            <div key={n.id}>
              <div
                className="nav-row"
                onClick={() => {
                  if (n.children) {
                    setOpenMenu(isOpen ? null : n.id);
                  } else {
                    navigate(n.path);
                  }
                }}
                style={{
                  display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                  borderRadius:8,marginBottom:1,cursor:"pointer",
                  background:isActive&&!n.children?"rgba(255,255,255,.18)":"transparent",
                  transition:"background .15s"
                }}
              >
                <Icon d={iconPaths} size={16} color={navIconColor(isActive)} style={{flexShrink:0}}/>
                <span style={{fontSize:13.5,fontWeight:isActive?600:400,color:isActive?"#fff":"rgba(255,255,255,.72)",fontFamily:F,flex:1,lineHeight:1.3}}>{n.label}</span>
                {n.children && (
                  <Icon d={ICONS.chevron} size={12} color="rgba(255,255,255,.35)"
                    style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
                )}
              </div>

              {n.children && isOpen && (
                <div style={{marginLeft:28,marginBottom:4}}>
                  {n.children.map(c => (
                    <div
                      key={c.id}
                      className="sub-row"
                      onClick={() => navigate(c.path)}
                      style={{
                        padding:"7px 12px",borderRadius:6,cursor:"pointer",
                        fontSize:13,fontWeight:path===c.path?600:400,
                        color:path===c.path?"#fff":"rgba(255,255,255,.58)",fontFamily:F,
                        background:path===c.path?"rgba(255,255,255,.13)":"transparent",
                        marginBottom:1,transition:"background .15s",
                        borderLeft:`2px solid ${path===c.path?"rgba(255,255,255,.4)":"rgba(255,255,255,.1)"}`,
                        paddingLeft:14
                      }}
                    >
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
        <button
          onClick={onLogout}
          style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:6,color:"rgba(255,255,255,.6)",fontSize:12,fontWeight:600,cursor:"pointer",padding:"6px 0",fontFamily:F,transition:"background .15s"}}
          onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
          onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
