import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { B, BL, BM, TX, TM, TT, WH, BR, SU, GN, AM, F } from "../lib/constants";
import { FREQ_LABELS, ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, REQUIRED_FIELDS, getMissingFields } from "../lib/api";
import {
  Icon, Badge, JurTag, Btn, Card, TabBar,
  FormField, TextInput, ErrorMsg, ModalActions, PlaceholderTab,
} from "../components/ui";

const NZ_TAX_CODES = ["M","M SL","ME","ME SL","S","SH","ST","SA","CAE","EDW","NSW","WT","SB","SB SL"];

const selSt = { width:"100%", border:`1.5px solid ${BR}`, borderRadius:7, padding:"9px 13px", fontSize:13.5, fontFamily:F, color:TX, background:WH };

export default function EmployeeDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [employee,      setEmployee]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [paySchedules,  setPaySchedules]  = useState([]);
  const [leaveProfiles, setLeaveProfiles] = useState([]);

  const [tab,     setTab]     = useState("General");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  // Form state — populated once employee loads
  const [gen,     setGen]     = useState(null);
  const [emp,     setEmp]     = useState(null);
  const [pay,     setPay]     = useState(null);
  const [taxVals, setTaxVals] = useState(null);
  const [paySettings,   setPaySettings]   = useState([]);
  const [showPayForm,   setShowPayForm]   = useState(false);
  const [payValues,     setPayValues]     = useState({ pay_type:"hourly", pay_rate:"", hours_per_week:"", effective_from:"" });

  useEffect(() => { loadEmployee(); }, [id]);

  async function loadEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/employees/${id}`, { headers: apiHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      initState(data);
      // load contextual data using tenant_id from employee
      if (data.tenant_id) {
        loadPaySchedules(data.tenant_id);
        loadLeaveProfiles(data.tenant_id);
      }
    } finally { setLoading(false); }
  }

  function initState(data) {
    setEmployee(data);
    setPaySettings(data.pay_settings ?? []);
    setGen({
      title:                      data.title ?? "",
      first_name:                 data.first_name ?? "",
      middle_name:                data.middle_name ?? "",
      last_name:                  data.last_name ?? "",
      date_of_birth:              data.date_of_birth ? String(data.date_of_birth).split("T")[0] : "",
      external_id:                data.external_id ?? "",
      email:                      data.email ?? "",
      mobile_phone:               data.mobile_phone ?? "",
      residential_street_address: data.residential_street_address ?? "",
      residential_address_line2:  data.residential_address_line2 ?? "",
      residential_city:           data.residential_city ?? "",
      residential_region:         data.residential_region ?? "",
      residential_post_code:      data.residential_post_code ?? "",
      residential_country:        data.residential_country ?? "",
    });
    setEmp({
      start_date:        data.start_date ? String(data.start_date).split("T")[0] : "",
      employment_type:   data.employment_type ?? "",
      job_title:         data.job_title ?? "",
      status:            data.status ?? "draft",
      end_date:          data.end_date ? String(data.end_date).split("T")[0] : "",
      pay_schedule_id:   data.pay_schedule_id ?? "",
      leave_profile_id:  data.leave_profile_id ?? "",
      automatically_pay: data.automatically_pay ?? false,
    });
    setPay({
      bank_name:           data.bank_name ?? "",
      bank_account_number: data.bank_account_number ?? "",
      bank_account_name:   data.bank_account_name ?? "",
    });
    setTaxVals({
      tax_identifier:          data.tax_identifier ?? "",
      tax_code:                data.tax_code ?? "",
      kiwisaver_member:        data.kiwisaver_member ?? false,
      kiwisaver_employee_rate: data.kiwisaver_employee_rate ? Number(data.kiwisaver_employee_rate).toFixed(4) : "0.0300",
      kiwisaver_employer_rate: data.kiwisaver_employer_rate ? Number(data.kiwisaver_employer_rate).toFixed(4) : "0.0300",
    });
  }

  async function loadPaySchedules(tenantId) {
    const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/pay-schedules`, { headers: apiHeaders() });
    if (res.ok) setPaySchedules(await res.json());
  }
  async function loadLeaveProfiles(tenantId) {
    const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/leave-profiles`, { headers: apiHeaders() });
    if (res.ok) setLeaveProfiles(await res.json());
  }

  async function doPatch(body) {
    setSaving(true); setError(null);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== ""));
      const res = await fetch(`${API_URL}/api/v1/employees/${id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(cleaned),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to save"); return; }
      initState({ ...data, pay_settings: paySettings });
    } finally { setSaving(false); }
  }

  async function activateEmployee() {
    const missing = getMissingFields(employee, paySettings.length > 0);
    if (missing.length > 0) {
      setTab(missing[0].tab);
      setError(`Complete this section: ${missing.filter(f => f.tab === missing[0].tab).map(f => f.label).join(", ")}`);
      return;
    }
    await doPatch({ status: "active" });
  }

  async function addPaySettings() {
    setSaving(true); setError(null);
    try {
      const scheduleId  = emp.pay_schedule_id || employee.pay_schedule_id;
      const schedule    = paySchedules.find(s => s.id === scheduleId);
      const derivedFreq = schedule?.frequency ?? "weekly";
      const derivedTax  = employee.tax_code || taxVals.tax_code || "M";
      const body = { pay_type: payValues.pay_type, pay_rate: payValues.pay_rate, pay_frequency: derivedFreq, tax_code: derivedTax, effective_from: payValues.effective_from };
      if (payValues.hours_per_week) body.hours_per_week = payValues.hours_per_week;
      const res = await fetch(`${API_URL}/api/v1/employees/${id}/pay-settings`, {
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

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>Loading…</div>
  );
  if (!employee || !gen) return (
    <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>Employee not found.</div>
  );

  const isNZ     = employee.jurisdiction === "NZ";
  const initials = `${(employee.first_name || "?")[0]}${(employee.last_name || "?")[0]}`.toUpperCase();
  const missing  = getMissingFields(employee, paySettings.length > 0);
  const total    = REQUIRED_FIELDS.length + 1;
  const pct      = Math.round(((total - missing.length) / total) * 100);
  const TABS     = ["General", "Employment", "Payments", "Tax", "Pay Settings"];

  return (
    <div>
      {/* Back link */}
      <button onClick={() => navigate("/employees")}
        style={{ background:"none", border:"none", color:TM, fontSize:13, fontFamily:F, cursor:"pointer", marginBottom:18, display:"flex", alignItems:"center", gap:6, padding:0 }}>
        <Icon d="M19 12H5M12 5l-7 7 7 7" size={14} color={TM}/> Back to Employees
      </button>

      {/* Employee header */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
        <div style={{ width:52, height:52, background:BL, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:B, flexShrink:0 }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:TX, letterSpacing:-.4, fontFamily:F }}>
            {employee.first_name} {employee.last_name}
          </h1>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <JurTag j={employee.jurisdiction}/>
            <Badge s={employee.status}/>
            {employee.employment_type && <span style={{ fontSize:12, color:TT, fontFamily:F, alignSelf:"center" }}>{employee.employment_type.replace("_"," ")}</span>}
          </div>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <div style={{ fontSize:11, color:TT, fontFamily:F, marginBottom:4 }}>Employee ID</div>
          <code style={{ fontSize:12, color:TM, background:"#f0eef7", padding:"3px 8px", borderRadius:5, fontFamily:"monospace" }}>{employee.id}</code>
        </div>
      </div>

      {/* Completion banner */}
      {missing.length > 0 ? (
        <div style={{ background:AM.bg, border:`1.5px solid #f0c060`, borderRadius:10, padding:"14px 18px", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:13.5, fontWeight:700, color:AM.fg, fontFamily:F }}>Profile incomplete — {pct}% done</span>
            <span style={{ fontSize:12.5, color:AM.fg, fontFamily:F, opacity:.75 }}>{missing.length} field{missing.length !== 1 ? "s" : ""} remaining</span>
          </div>
          <div style={{ background:"#f0d890", borderRadius:99, height:6, marginBottom:12, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:AM.fg, borderRadius:99, transition:"width .4s" }}/>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {TABS.filter(t => t !== "Pay Settings" || true).map(t => {
              const inTab = missing.filter(f => f.tab === t);
              if (!inTab.length) return null;
              return (
                <button key={t} onClick={() => { setTab(t); setError(null); }}
                  style={{ background:"#fdf4e3", border:`1.5px solid #f0c060`, borderRadius:6, padding:"3px 10px", fontSize:11.5, fontWeight:700, color:AM.fg, cursor:"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:5 }}>
                  {t} <span style={{ background:AM.fg, color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{inTab.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ background:GN.bg, border:`1.5px solid #7bcf9a`, borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13.5, fontWeight:700, color:GN.fg, fontFamily:F }}>Profile complete</span>
          {employee.status === "active"
            ? <span style={{ fontSize:13, color:GN.fg, fontFamily:F, opacity:.75 }}>Employee is active</span>
            : <Btn onClick={activateEmployee}>{saving ? "Activating…" : "Activate Employee"}</Btn>}
        </div>
      )}

      <Card style={{ padding:"24px 28px" }}>
        <TabBar tabs={TABS} active={tab} setActive={t => { setTab(t); setError(null); }}/>

        {/* GENERAL */}
        {tab === "General" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 1fr 1fr", gap:12 }}>
              <FormField label="Title">
                <select value={gen.title} onChange={e => setGen(p => ({...p, title:e.target.value}))} style={selSt}>
                  <option value="">—</option>
                  {["Mr","Mrs","Ms","Miss","Dr","Prof"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="First Name"><TextInput value={gen.first_name} onChange={v => setGen(p => ({...p, first_name:v}))}/></FormField>
              <FormField label="Middle Name" hint="optional"><TextInput value={gen.middle_name} onChange={v => setGen(p => ({...p, middle_name:v}))}/></FormField>
              <FormField label="Surname"><TextInput value={gen.last_name} onChange={v => setGen(p => ({...p, last_name:v}))}/></FormField>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <FormField label="Date of Birth" hint="optional"><TextInput type="date" value={gen.date_of_birth} onChange={v => setGen(p => ({...p, date_of_birth:v}))}/></FormField>
              <FormField label="External ID" hint="optional"><TextInput value={gen.external_id} onChange={v => setGen(p => ({...p, external_id:v}))} placeholder="Payroll reference"/></FormField>
              <FormField label="Email"><TextInput type="email" value={gen.email} onChange={v => setGen(p => ({...p, email:v}))}/></FormField>
              <FormField label="Mobile Phone"><TextInput value={gen.mobile_phone} onChange={v => setGen(p => ({...p, mobile_phone:v}))}/></FormField>
            </div>
            <FormField label="Street Address"><TextInput value={gen.residential_street_address} onChange={v => setGen(p => ({...p, residential_street_address:v}))}/></FormField>
            <FormField label="Address Line 2" hint="optional"><TextInput value={gen.residential_address_line2} onChange={v => setGen(p => ({...p, residential_address_line2:v}))}/></FormField>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px 1fr", gap:12 }}>
              <FormField label="City"><TextInput value={gen.residential_city} onChange={v => setGen(p => ({...p, residential_city:v}))}/></FormField>
              <FormField label="Region"><TextInput value={gen.residential_region} onChange={v => setGen(p => ({...p, residential_region:v}))}/></FormField>
              <FormField label="Post Code"><TextInput value={gen.residential_post_code} onChange={v => setGen(p => ({...p, residential_post_code:v}))}/></FormField>
              <FormField label="Country"><TextInput value={gen.residential_country} onChange={v => setGen(p => ({...p, residential_country:v}))} placeholder={isNZ ? "New Zealand (required)" : "Australia (required)"}/></FormField>
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ModalActions><Btn onClick={() => doPatch(gen)}>{saving ? "Saving…" : "Save Changes"}</Btn></ModalActions>
          </>
        )}

        {/* EMPLOYMENT */}
        {tab === "Employment" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <FormField label="Start Date"><TextInput type="date" value={emp.start_date} onChange={v => setEmp(p => ({...p, start_date:v}))}/></FormField>
              <FormField label="Employment Type">
                <select value={emp.employment_type} onChange={e => setEmp(p => ({...p, employment_type:e.target.value}))} style={selSt}>
                  <option value="">— Select —</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="casual">Casual</option>
                </select>
              </FormField>
              <FormField label="Job Title" hint="optional"><TextInput value={emp.job_title} onChange={v => setEmp(p => ({...p, job_title:v}))}/></FormField>
              <FormField label="Pay Schedule">
                <select value={emp.pay_schedule_id} onChange={e => setEmp(p => ({...p, pay_schedule_id:e.target.value}))} style={selSt}>
                  <option value="">— Select —</option>
                  {paySchedules.map(s => <option key={s.id} value={s.id}>{s.name} ({FREQ_LABELS[s.frequency]})</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={emp.status} onChange={e => setEmp(p => ({...p, status:e.target.value}))} style={selSt}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="terminated">Terminated</option>
                </select>
              </FormField>
              <FormField label="End Date" hint="if terminated"><TextInput type="date" value={emp.end_date} onChange={v => setEmp(p => ({...p, end_date:v}))}/></FormField>
              <FormField label="Leave Template">
                <select value={emp.leave_profile_id} onChange={e => setEmp(p => ({...p, leave_profile_id:e.target.value}))} style={selSt}>
                  <option value="">— Select —</option>
                  {leaveProfiles.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
                </select>
              </FormField>
            </div>
            {paySettings.length > 0 && (
              <div style={{ background:SU, borderRadius:7, padding:"9px 13px", marginBottom:14, fontSize:13, color:TM, fontFamily:F }}>
                Current rate: <strong style={{ color:TX }}>
                  {paySettings[0].pay_type === "salary"
                    ? `$${Number(paySettings[0].pay_rate).toLocaleString("en-NZ", {minimumFractionDigits:2})}/yr (salary)`
                    : `$${Number(paySettings[0].pay_rate).toFixed(2)}/hr`}
                </strong>
                {paySettings[0].hours_per_week && <span style={{ marginLeft:6, fontSize:12, color:TT }}>· {paySettings[0].hours_per_week} hrs/wk</span>}
                <span style={{ marginLeft:8, fontSize:12, color:TT }}>· effective {fmtDate(paySettings[0].effective_from)}</span>
              </div>
            )}
            <FormField label="Automatically Pay Employee">
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"4px 0" }}>
                <input type="checkbox" checked={emp.automatically_pay} onChange={e => setEmp(p => ({...p, automatically_pay:e.target.checked}))} style={{ width:16, height:16, accentColor:B, cursor:"pointer" }}/>
                <span style={{ fontSize:13.5, color:TX, fontFamily:F }}>Include in pay run automatically</span>
              </label>
            </FormField>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ModalActions><Btn onClick={() => doPatch(emp)}>{saving ? "Saving…" : "Save Changes"}</Btn></ModalActions>
          </>
        )}

        {/* PAYMENTS */}
        {tab === "Payments" && (
          <>
            <FormField label="Bank Name"><TextInput value={pay.bank_name} onChange={v => setPay(p => ({...p, bank_name:v}))} placeholder="e.g. ANZ"/></FormField>
            <FormField label={isNZ ? "Account Number" : "BSB-Account"}>
              <TextInput value={pay.bank_account_number} onChange={v => setPay(p => ({...p, bank_account_number:v}))} placeholder={isNZ ? "00-0000-0000000-00" : "123456-12345678"}/>
            </FormField>
            <FormField label="Account Name"><TextInput value={pay.bank_account_name} onChange={v => setPay(p => ({...p, bank_account_name:v}))}/></FormField>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ModalActions><Btn onClick={() => doPatch(pay)}>{saving ? "Saving…" : "Save Changes"}</Btn></ModalActions>
          </>
        )}

        {/* TAX */}
        {tab === "Tax" && (
          <>
            {isNZ ? (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <FormField label="IRD Number"><TextInput value={taxVals.tax_identifier} onChange={v => setTaxVals(p => ({...p, tax_identifier:v}))} placeholder="123-456-789"/></FormField>
                  <FormField label="Tax Code">
                    <select value={taxVals.tax_code} onChange={e => setTaxVals(p => ({...p, tax_code:e.target.value}))} style={selSt}>
                      <option value="">— Select —</option>
                      {NZ_TAX_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="KiwiSaver Member">
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"4px 0" }}>
                    <input type="checkbox" checked={taxVals.kiwisaver_member} onChange={e => setTaxVals(p => ({...p, kiwisaver_member:e.target.checked}))} style={{ width:16, height:16, accentColor:B, cursor:"pointer" }}/>
                    <span style={{ fontSize:13.5, color:TX, fontFamily:F }}>Enrolled in KiwiSaver</span>
                  </label>
                </FormField>
                {taxVals.kiwisaver_member && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <FormField label="Employee Contribution">
                      <select value={taxVals.kiwisaver_employee_rate} onChange={e => setTaxVals(p => ({...p, kiwisaver_employee_rate:e.target.value}))} style={selSt}>
                        <option value="0.0300">3%</option><option value="0.0350">3.5%</option>
                        <option value="0.0400">4%</option><option value="0.0600">6%</option>
                        <option value="0.0800">8%</option><option value="0.1000">10%</option>
                      </select>
                    </FormField>
                    <FormField label="Employer Contribution">
                      <select value={taxVals.kiwisaver_employer_rate} onChange={e => setTaxVals(p => ({...p, kiwisaver_employer_rate:e.target.value}))} style={selSt}>
                        <option value="0.0300">3%</option><option value="0.0350">3.5%</option>
                        <option value="0.0400">4%</option><option value="0.0450">4.5%</option>
                        <option value="0.0500">5%</option>
                      </select>
                    </FormField>
                  </div>
                )}
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <ModalActions><Btn onClick={() => doPatch(taxVals)}>{saving ? "Saving…" : "Save Changes"}</Btn></ModalActions>
              </>
            ) : (
              <PlaceholderTab title="Tax — Australia (coming soon)"/>
            )}
          </>
        )}

        {/* PAY SETTINGS */}
        {tab === "Pay Settings" && (
          <>
            {paySettings.length > 0 && (
              <div style={{ marginBottom:20 }}>
                {paySettings.map((ps, i) => (
                  <div key={ps.id} style={{ padding:"12px 0", borderBottom:`1px solid ${BR}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <span style={{ fontSize:13.5, fontWeight:600, color:TX, fontFamily:F, textTransform:"capitalize" }}>{ps.pay_type}</span>
                        <span style={{ fontSize:13.5, color:TX, fontFamily:F }}> · ${Number(ps.pay_rate).toFixed(2)} · {ps.pay_frequency}</span>
                      </div>
                      {i === 0 && <span style={{ background:GN.bg, color:GN.fg, fontSize:11, fontWeight:700, borderRadius:4, padding:"2px 8px", fontFamily:F }}>CURRENT</span>}
                    </div>
                    <div style={{ fontSize:12, color:TT, fontFamily:F, marginTop:3 }}>
                      From: {fmtDate(ps.effective_from)}{ps.effective_to ? ` → ${fmtDate(ps.effective_to)}` : ""}
                      {ps.hours_per_week && ` · ${ps.hours_per_week} hrs/wk`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showPayForm ? (
              <div style={{ textAlign:"center", padding:"12px 0" }}>
                <Btn onClick={() => setShowPayForm(true)} icon="plus">Add Pay Settings</Btn>
              </div>
            ) : (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:TM, textTransform:"uppercase", letterSpacing:.5, fontFamily:F, marginBottom:12 }}>New Pay Settings</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <FormField label="Pay Type">
                    <select value={payValues.pay_type} onChange={e => setPayValues(p => ({...p, pay_type:e.target.value}))} style={selSt}>
                      <option value="hourly">Hourly</option>
                      <option value="salary">Salary</option>
                      <option value="casual">Casual</option>
                    </select>
                  </FormField>
                  <FormField label={payValues.pay_type === "salary" ? "Annual Salary ($)" : "Hourly Rate ($)"}>
                    <TextInput value={payValues.pay_rate} onChange={v => setPayValues(p => ({...p, pay_rate:v}))} placeholder="e.g. 28.50"/>
                  </FormField>
                  {payValues.pay_type !== "salary" && (
                    <FormField label="Hours Per Week"><TextInput value={payValues.hours_per_week} onChange={v => setPayValues(p => ({...p, hours_per_week:v}))} placeholder="e.g. 40"/></FormField>
                  )}
                  <FormField label="Effective From"><TextInput type="date" value={payValues.effective_from} onChange={v => setPayValues(p => ({...p, effective_from:v}))}/></FormField>
                </div>
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <ModalActions>
                  <Btn ghost onClick={() => { setShowPayForm(false); setError(null); }}>Cancel</Btn>
                  <Btn onClick={addPaySettings}>{saving ? "Saving…" : "Save Pay Settings"}</Btn>
                </ModalActions>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
