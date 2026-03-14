import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { B, BL, BM, TX, TM, TT, WH, BR, SU, GN, AM, RD, F } from "../lib/constants";
import { ICONS, FREQ_LABELS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, REQUIRED_FIELDS, getMissingFields } from "../lib/api";
import {
  Icon, Badge, JurTag, Btn, Card, TH, TD,
  Modal, FormField, TextInput, ErrorMsg, ModalActions, TabBar, PlaceholderTab,
} from "../components/ui";

const NZ_TAX_CODES = ["M","M SL","ME","ME SL","S","SH","ST","SA","CAE","EDW","NSW","WT","SB","SB SL"];

/* ── EMPLOYEE DETAIL MODAL ────────────────────────────────── */
function EmployeeDetailModal({ employee, onClose, onUpdated, paySchedules = [] }) {
  const [tab, setTab] = useState("General");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [currentEmp, setCurrentEmp] = useState(employee);

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
  const [payValues,     setPayValues]     = useState({ pay_type:"hourly", pay_rate:"", hours_per_week:"", effective_from:"" });
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
      const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== ""));
      const res = await fetch(`${API_URL}/api/v1/employees/${employee.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(cleaned),
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
      const scheduleId     = emp.pay_schedule_id || employee.pay_schedule_id;
      const schedule       = paySchedules.find(s => s.id === scheduleId);
      const derivedFreq    = schedule?.frequency ?? "weekly";
      const derivedTaxCode = currentEmp.tax_code || taxVals.tax_code || "M";
      const body = {
        pay_type: payValues.pay_type, pay_rate: payValues.pay_rate,
        pay_frequency: derivedFreq, tax_code: derivedTaxCode,
        effective_from: payValues.effective_from,
      };
      if (payValues.hours_per_week) body.hours_per_week = payValues.hours_per_week;
      const res = await fetch(`${API_URL}/api/v1/employees/${employee.id}/pay-settings`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to add pay settings"); return; }
      setPaySettings(prev => [data, ...prev]);
      setShowPayForm(false);
      setPayValues({ pay_type:"hourly", pay_rate:"", hours_per_week:"", effective_from:"" });
    } finally { setSaving(false); }
  }

  const isNZ    = employee.jurisdiction === "NZ";
  const initials = `${(employee.first_name||"?")[0]}${(employee.last_name||"?")[0]}`.toUpperCase();
  const selSt   = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};
  const TABS    = ["General","Employment","Payments","Tax","Pay Settings"];
  const missing = getMissingFields(currentEmp, paySettings.length > 0);
  const completionTotal = REQUIRED_FIELDS.length + 1;
  const completionPct   = Math.round(((completionTotal - missing.length) / completionTotal) * 100);

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

      {/* Completion banner */}
      {missing.length > 0 ? (
        <div style={{background:AM.bg,border:`1.5px solid #f0c060`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <span style={{fontSize:13.5,fontWeight:700,color:AM.fg,fontFamily:F}}>Profile incomplete — {completionPct}% done</span>
              <span style={{fontSize:12.5,color:AM.fg,fontFamily:F,opacity:.75,marginLeft:8}}>{missing.length} field{missing.length!==1?"s":""} remaining</span>
            </div>
          </div>
          <div style={{background:"#f0d890",borderRadius:99,height:6,marginBottom:12,overflow:"hidden"}}>
            <div style={{width:`${completionPct}%`,height:"100%",background:AM.fg,borderRadius:99,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["General","Employment","Payments","Tax","Pay Settings"].map(t=>{
              const inTab = missing.filter(f=>f.tab===t);
              if (!inTab.length) return null;
              return (
                <button key={t} onClick={()=>{ setTab(t); setError(null); }}
                  style={{background:"#fdf4e3",border:`1.5px solid #f0c060`,borderRadius:6,padding:"3px 10px",
                    fontSize:11.5,fontWeight:700,color:AM.fg,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",gap:5}}>
                  {t}
                  <span style={{background:AM.fg,color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 6px",lineHeight:1.4}}>{inTab.length}</span>
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

        {/* GENERAL */}
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
              <FormField label="First Name"><TextInput value={gen.first_name} onChange={v=>setGen(p=>({...p,first_name:v}))} /></FormField>
              <FormField label="Middle Name" hint="optional"><TextInput value={gen.middle_name} onChange={v=>setGen(p=>({...p,middle_name:v}))} /></FormField>
              <FormField label="Surname"><TextInput value={gen.last_name} onChange={v=>setGen(p=>({...p,last_name:v}))} /></FormField>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FormField label="Date of Birth" hint="optional"><TextInput type="date" value={gen.date_of_birth} onChange={v=>setGen(p=>({...p,date_of_birth:v}))} /></FormField>
              <FormField label="External ID" hint="optional"><TextInput value={gen.external_id} onChange={v=>setGen(p=>({...p,external_id:v}))} placeholder="Payroll reference" /></FormField>
              <FormField label="Email"><TextInput type="email" value={gen.email} onChange={v=>setGen(p=>({...p,email:v}))} /></FormField>
              <FormField label="Mobile Phone"><TextInput value={gen.mobile_phone} onChange={v=>setGen(p=>({...p,mobile_phone:v}))} /></FormField>
            </div>
            <FormField label="Street Address"><TextInput value={gen.residential_street_address} onChange={v=>setGen(p=>({...p,residential_street_address:v}))} /></FormField>
            <FormField label="Address Line 2" hint="optional"><TextInput value={gen.residential_address_line2} onChange={v=>setGen(p=>({...p,residential_address_line2:v}))} /></FormField>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 1fr",gap:12}}>
              <FormField label="City"><TextInput value={gen.residential_city} onChange={v=>setGen(p=>({...p,residential_city:v}))} /></FormField>
              <FormField label="Region"><TextInput value={gen.residential_region} onChange={v=>setGen(p=>({...p,residential_region:v}))} /></FormField>
              <FormField label="Post Code"><TextInput value={gen.residential_post_code} onChange={v=>setGen(p=>({...p,residential_post_code:v}))} /></FormField>
              <FormField label="Country"><TextInput value={gen.residential_country} onChange={v=>setGen(p=>({...p,residential_country:v}))} placeholder={isNZ?"New Zealand (required)":"Australia (required)"} /></FormField>
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn><Btn onClick={()=>doPatch(gen)}>{saving?"Saving…":"Save"}</Btn></ModalActions>
          </>
        )}

        {/* EMPLOYMENT */}
        {tab === "Employment" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FormField label="Start Date"><TextInput type="date" value={emp.start_date} onChange={v=>setEmp(p=>({...p,start_date:v}))} /></FormField>
              <FormField label="Employment Type">
                <select value={emp.employment_type} onChange={e=>setEmp(p=>({...p,employment_type:e.target.value}))} style={selSt}>
                  <option value="">— Select —</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="casual">Casual</option>
                </select>
              </FormField>
              <FormField label="Job Title" hint="optional"><TextInput value={emp.job_title} onChange={v=>setEmp(p=>({...p,job_title:v}))} /></FormField>
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
              <FormField label="End Date" hint="if terminated"><TextInput type="date" value={emp.end_date} onChange={v=>setEmp(p=>({...p,end_date:v}))} /></FormField>
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
                    ? `$${Number(paySettings[0].pay_rate).toLocaleString("en-NZ",{minimumFractionDigits:2})}/yr (salary)`
                    : `$${Number(paySettings[0].pay_rate).toFixed(2)}/hr`}
                </strong>
                {paySettings[0].hours_per_week && <span style={{marginLeft:6,fontSize:12,color:TT}}>· {paySettings[0].hours_per_week} hrs/wk</span>}
                <span style={{marginLeft:8,fontSize:12,color:TT}}>· effective {fmtDate(paySettings[0].effective_from)}</span>
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
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn><Btn onClick={()=>doPatch(emp)}>{saving?"Saving…":"Save"}</Btn></ModalActions>
          </>
        )}

        {/* PAYMENTS */}
        {tab === "Payments" && (
          <>
            <FormField label="Bank Name"><TextInput value={pay.bank_name} onChange={v=>setPay(p=>({...p,bank_name:v}))} placeholder="e.g. ANZ" /></FormField>
            <FormField label={isNZ?"Account Number":"BSB-Account"}>
              <TextInput value={pay.bank_account_number} onChange={v=>setPay(p=>({...p,bank_account_number:v}))} placeholder={isNZ?"00-0000-0000000-00":"123456-12345678"} />
            </FormField>
            <FormField label="Account Name"><TextInput value={pay.bank_account_name} onChange={v=>setPay(p=>({...p,bank_account_name:v}))} /></FormField>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn><Btn onClick={()=>doPatch(pay)}>{saving?"Saving…":"Save"}</Btn></ModalActions>
          </>
        )}

        {/* TAX */}
        {tab === "Tax" && (
          <>
            {isNZ ? (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <FormField label="IRD Number"><TextInput value={taxVals.tax_identifier} onChange={v=>setTaxVals(p=>({...p,tax_identifier:v}))} placeholder="123-456-789" /></FormField>
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
                        <option value="0.0300">3%</option><option value="0.0350">3.5%</option>
                        <option value="0.0400">4%</option><option value="0.0600">6%</option>
                        <option value="0.0800">8%</option><option value="0.1000">10%</option>
                      </select>
                    </FormField>
                    <FormField label="Employer Contribution">
                      <select value={taxVals.kiwisaver_employer_rate} onChange={e=>setTaxVals(p=>({...p,kiwisaver_employer_rate:e.target.value}))} style={selSt}>
                        <option value="0.0300">3%</option><option value="0.0350">3.5%</option>
                        <option value="0.0400">4%</option><option value="0.0450">4.5%</option>
                        <option value="0.0500">5%</option>
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

        {/* PAY SETTINGS */}
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
                      From: {fmtDate(ps.effective_from)}{ps.effective_to ? ` → ${fmtDate(ps.effective_to)}` : ""}
                      {ps.hours_per_week && ` · ${ps.hours_per_week} hrs/wk`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showPayForm ? (
              <div style={{textAlign:"center",padding:"12px 0"}}><Btn onClick={()=>setShowPayForm(true)} icon="plus">Add Pay Settings</Btn></div>
            ) : (
              <>
                <div style={{fontSize:12,fontWeight:700,color:TM,textTransform:"uppercase",letterSpacing:.5,fontFamily:F,marginBottom:12}}>New Pay Settings</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <FormField label="Pay Type">
                    <select value={payValues.pay_type} onChange={e=>setPayValues(p=>({...p,pay_type:e.target.value}))} style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH}}>
                      <option value="hourly">Hourly</option>
                      <option value="salary">Salary</option>
                      <option value="casual">Casual</option>
                    </select>
                  </FormField>
                  <FormField label={payValues.pay_type==="salary"?"Annual Salary ($)":"Hourly Rate ($)"}>
                    <TextInput value={payValues.pay_rate} onChange={v=>setPayValues(p=>({...p,pay_rate:v}))} placeholder="e.g. 28.50" />
                  </FormField>
                  {payValues.pay_type !== "salary" && (
                    <FormField label="Hours Per Week"><TextInput value={payValues.hours_per_week} onChange={v=>setPayValues(p=>({...p,hours_per_week:v}))} placeholder="e.g. 40" /></FormField>
                  )}
                  <FormField label="Effective From"><TextInput type="date" value={payValues.effective_from} onChange={v=>setPayValues(p=>({...p,effective_from:v}))} /></FormField>
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
      </div>
    </Modal>
  );
}

/* ── EMPLOYEES PAGE ───────────────────────────────────────── */
export default function EmployeesPage() {
  const navigate = useNavigate();
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
  const [newValues,        setNewValues]        = useState({ first_name:"", last_name:"", email:"", tax_identifier:"", pay_schedule_id:"" });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (selectedEmployer) { loadEmployees(selectedEmployer.id); loadPaySchedules(selectedEmployer.id); }
  }, [selectedEmployer, statusFilter]);

  async function loadAll() {
    const res = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
    if (!res.ok) return;
    const bureaList = await res.json();
    setBureaus(bureaList);
    const all = [];
    for (const b of bureaList) {
      const r = await fetch(`${API_URL}/api/v1/bureaus/${b.id}/tenants`, { headers: apiHeaders() });
      if (r.ok) { const tenants = await r.json(); tenants.forEach(t => { t._bureauId = b.id; t._bureauName = b.name; }); all.push(...tenants); }
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
    if (res.ok) setPaySchedules(await res.json()); else setPaySchedules([]);
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
      const res = await fetch(`${API_URL}/api/v1/tenants/${selectedEmployer.id}/employees`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ first_name: newValues.first_name, last_name: newValues.last_name, email: newValues.email, tax_identifier: newValues.tax_identifier, pay_schedule_id: newValues.pay_schedule_id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create employee"); return; }
      setEmployees(prev => [data, ...prev]);
      closeNew();
    } finally { setSaving(false); }
  }

  const visibleEmployers = selectedBureauId === "all" ? allEmployers : allEmployers.filter(t => t._bureauId === selectedBureauId);
  const filtered = employees.filter(e => search === "" || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()));

  function handleBureauChange(bureauId) {
    setSelectedBureauId(bureauId);
    const next = bureauId === "all" ? allEmployers : allEmployers.filter(t => t._bureauId === bureauId);
    if (next.length > 0) setSelectedEmployer(next[0]);
  }

  const selStyle = {border:`1.5px solid ${BR}`,borderRadius:7,padding:"7px 13px",fontSize:13,fontFamily:F,color:TX,background:WH};

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:600,color:TT,fontFamily:F,whiteSpace:"nowrap"}}>Filter by:</span>
        <select value={selectedBureauId} onChange={e=>handleBureauChange(e.target.value)} style={selStyle}>
          <option value="all">All Clients</option>
          {bureaus.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={selectedEmployer?.id ?? ""} onChange={e=>setSelectedEmployer(visibleEmployers.find(t=>t.id===e.target.value))} style={selStyle}>
          {visibleEmployers.length === 0 ? <option value="">No employers</option> : visibleEmployers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={{...selStyle,color:TT}} disabled><option>All Pay Runs</option></select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={selStyle}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
          <option value="all">All Statuses</option>
        </select>
        <div style={{flex:1}}/>
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
                <tr key={e.id} className="trow" onClick={()=>navigate(`/employees/${e.id}`)}
                  style={{cursor:"pointer"}}>
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,background:BL,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:B,fontFamily:F,flexShrink:0}}>
                        {e.first_name[0]}{e.last_name[0]}
                      </div>
                      <span style={{fontSize:13.5,fontWeight:600,color:B,fontFamily:F,textDecoration:"underline",textDecorationColor:"rgba(57,23,93,.25)"}}>{e.first_name} {e.last_name}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNewModal && (
        <Modal title="New Employee" onClose={closeNew} maxWidth={520}>
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
            <FormField label="First Name"><TextInput value={newValues.first_name} onChange={v=>setNewValues(p=>({...p,first_name:v}))} autoFocus /></FormField>
            <FormField label="Last Name"><TextInput value={newValues.last_name} onChange={v=>setNewValues(p=>({...p,last_name:v}))} /></FormField>
            <FormField label="Email"><TextInput type="email" value={newValues.email} onChange={v=>setNewValues(p=>({...p,email:v}))} /></FormField>
            <FormField label={selectedEmployer?.jurisdiction==="AU"?"TFN":"IRD Number"}>
              <TextInput value={newValues.tax_identifier} onChange={v=>setNewValues(p=>({...p,tax_identifier:v}))} placeholder={selectedEmployer?.jurisdiction==="AU"?"123 456 782":"123-456-789"} />
            </FormField>
          </div>
          <FormField label="Pay Schedule">
            {paySchedules.length === 0 ? (
              <div style={{background:AM.bg,color:AM.fg,borderRadius:7,padding:"9px 13px",fontSize:13,fontFamily:F}}>
                No pay schedules set up. Go to Clients → Edit Employer → Pay Schedules to add one first.
              </div>
            ) : (
              <select value={newValues.pay_schedule_id} onChange={e=>setNewValues(p=>({...p,pay_schedule_id:e.target.value}))}
                style={{width:"100%",border:`1.5px solid ${newValues.pay_schedule_id?BR:"#f0c060"}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:newValues.pay_schedule_id?TX:TT,background:WH}}>
                <option value="">— Select pay schedule —</option>
                {paySchedules.map(s=><option key={s.id} value={s.id}>{s.name} ({FREQ_LABELS[s.frequency]})</option>)}
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

    </div>
  );
}
