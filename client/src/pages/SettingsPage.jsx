import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { B, TX, TM, TT, WH, BR, SU, GN, GY, F } from "../lib/constants";
import { Card, SectionHead, Btn, TabBar, PlaceholderTab } from "../components/ui";

const SETTINGS_PAGES = {
  "business":    { title:"Business Settings",   tabs:["Organisation","Branding","Billing","Notifications","Placeholder 5"] },
  "payroll":     { title:"Payroll Settings",    tabs:["Pay Schedules","Default Rules","Tax Settings","Placeholder 4","Placeholder 5"] },
  "engine":      { title:"Pay Engine Settings", tabs:["Rule Versions","Calculation Config","Placeholder 3","Placeholder 4","Placeholder 5"] },
  "integration": { title:"Integration",         tabs:["API Keys","Webhooks","Connected Apps","Placeholder 4","Placeholder 5"] },
  "other":       { title:"Other Settings",      tabs:["Placeholder 1","Placeholder 2","Placeholder 3","Placeholder 4","Placeholder 5"] },
};

function OrgContent() {
  const inp = (label, val) => (
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
        {name:"Production Key", key:"ptk_live_••••••••3f9a", created:"Jan 12 2025", req:"12,430", live:true},
        {name:"Staging Key",    key:"ptk_test_••••••••8c2d", created:"Feb 3 2025",  req:"4,210",  live:false},
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

export default function SettingsPage() {
  const { section } = useParams();
  const cfg = SETTINGS_PAGES[section] || SETTINGS_PAGES["business"];
  const [tab, setTab] = useState(cfg.tabs[0]);

  useEffect(() => { setTab(cfg.tabs[0]); }, [section]);

  const isPlaceholder = tab.startsWith("Placeholder");
  const isRealContent =
    (section === "integration" && (tab === "API Keys" || tab === "Webhooks")) ||
    (section === "business" && tab === "Organisation");

  return (
    <div>
      <SectionHead title={cfg.title}/>
      <TabBar tabs={cfg.tabs} active={tab} setActive={setTab}/>
      {section === "integration" && tab === "API Keys"  && <APIKeysContent/>}
      {section === "integration" && tab === "Webhooks"  && <WebhooksContent/>}
      {section === "business"    && tab === "Organisation" && <OrgContent/>}
      {!isRealContent && <PlaceholderTab title={tab}/>}
    </div>
  );
}
