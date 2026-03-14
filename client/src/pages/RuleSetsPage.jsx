import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { B, BL, BM, TX, TM, TT, WH, BR, F } from "../lib/constants";
import { TAX_RULES, LEAVE_PROFILES, GROSS_NET, ICONS } from "../lib/constants";
import { Card, Stat, SectionHead, Badge, JurTag, TH, TD, Btn, TabBar, PlaceholderTab, PageJurFilter, Icon } from "../components/ui";

const ENGINE_TABS = ["Overview","Gross to Net","Tax Rules","Leave Rules","Compliance","Benefits & Deductions"];

function EngineOverview({ setTab }) {
  const modules = [
    { icon:"⚙️", title:"Gross to Net Engine",  desc:"Configure wages, allowances and deduction calculations",       tab:"Gross to Net" },
    { icon:"🧮", title:"Tax Engine",            desc:"Configure PAYE, PAYG and jurisdiction withholding rules",      tab:"Tax Rules" },
    { icon:"🌿", title:"Leave Engine",          desc:"Configure leave accrual, entitlements and pay methods",        tab:"Leave Rules" },
    { icon:"📋", title:"Compliance Engine",     desc:"Regulatory filing rules and compliance thresholds",            tab:"Compliance" },
    { icon:"💰", title:"Benefits & Deductions", desc:"KiwiSaver, superannuation, allowances and deductions",         tab:"Benefits & Deductions" },
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
  const { GN: _GN, RD: _RD } = { GN: { bg:"#eaf5ee", fg:"#1a7a3c" }, RD: { bg:"#fdeaea", fg:"#8a1f1f" } };
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
                  <td style={{padding:"12px 14px",fontFamily:F,fontWeight:700,color:"#1a7a3c",fontSize:13.5,borderBottom:"1px solid #f0eef7"}}>{e.amount}</td>
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
                  <td style={{padding:"12px 14px",fontFamily:F,fontWeight:700,color:"#8a1f1f",fontSize:13.5,borderBottom:"1px solid #f0eef7"}}>{d.amount}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{padding:"12px 14px",fontFamily:F,fontWeight:700,fontSize:13.5,color:TX,borderTop:`2px solid ${BR}`}}>Total Deductions</td>
                <td style={{padding:"12px 14px",fontFamily:F,fontWeight:800,color:"#8a1f1f",fontSize:14,borderTop:`2px solid ${BR}`}}>{GROSS_NET.totalDed}</td>
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
  const GY = { bg:"#f0eef5", fg:"#5a5270" };
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
              <span style={{background:"#f0ebf8",color:B,borderRadius:5,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:F}}>{p.employees} emp</span>
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

export default function RuleSetsPage() {
  const { jur, setJur } = useOutletContext();
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
