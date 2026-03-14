import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import { Topbar, RoleBanner } from "../components/Topbar";
import { Btn } from "../components/ui";
import { BG, BR, F, TM } from "../lib/constants";
import { CSS } from "../lib/constants";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [jur,      setJur]      = useState("ALL");
  const [userRole, setUserRole] = useState("admin");
  const location  = useLocation();
  const navigate  = useNavigate();

  const getActionEl = () => {
    if (location.pathname === "/pay-runs")  return <Btn icon="plus">New Pay Run</Btn>;
    if (location.pathname === "/rule-sets") return <Btn icon="plus">Add Rule Set</Btn>;
    if (location.pathname === "/")          return (
      <button
        onClick={() => navigate("/pay-runs")}
        style={{background:"none",border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,color:TM}}
      >
        View Pay Runs →
      </button>
    );
    return null;
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",height:"100vh",fontFamily:F,background:BG,color:"#1a1625",overflow:"hidden"}}>
        <Sidebar user={user} onLogout={logout} />
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Topbar
            jur={jur} setJur={setJur}
            actionEl={getActionEl()}
            userRole={userRole} setUserRole={setUserRole}
          />
          <RoleBanner role={userRole} />
          <main style={{flex:1,overflowY:"auto",padding:"26px 28px",background:BG}}>
            <Outlet context={{ jur, setJur }} />
          </main>
        </div>
      </div>
    </>
  );
}
