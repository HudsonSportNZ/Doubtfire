import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { B, BL, TX, TM, TT, WH, BR, GN, AM, F } from "../lib/constants";
import { FREQ_LABELS, FREQ_COLORS, ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate } from "../lib/api";
import {
  Icon, Badge, JurTag, Btn, Card, TabBar,
  FormField, TextInput, ErrorMsg, ModalActions,
} from "../components/ui";

export default function EmployerDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [employer,      setEmployer]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("Details");
  const [editValues,    setEditValues]    = useState({ name: "", status: "" });
  const [jurValues,     setJurValues]     = useState({ jurisdiction: "NZ", legal_entity_name: "", tax_id: "" });
  const [jurisdictions, setJurisdictions] = useState([]);
  const [schedules,     setSchedules]     = useState([]);
  const [showSchForm,   setShowSchForm]   = useState(false);
  const [schValues,     setSchValues]     = useState({ name:"", frequency:"weekly", period_start:"", period_end:"", pay_date:"" });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const selStyle = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};

  useEffect(() => { loadEmployer(); loadSchedules(); }, [id]);

  async function loadEmployer() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/${id}`, { headers: apiHeaders() });
      if (!res.ok) { navigate("/clients"); return; }
      const data = await res.json();
      setEmployer(data);
      setEditValues({ name: data.name, status: data.status });
      setJurisdictions(data.jurisdictions ?? []);
    } finally { setLoading(false); }
  }

  async function loadSchedules() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${id}/pay-schedules`, { headers: apiHeaders() });
    if (res.ok) setSchedules(await res.json());
  }

  async function saveDetails() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/${id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to save"); return; }
      setEmployer(data);
      setEditValues({ name: data.name, status: data.status });
    } finally { setSaving(false); }
  }

  async function addJurisdiction() {
    setSaving(true); setError(null);
    try {
      const body = { jurisdiction: jurValues.jurisdiction };
      if (jurValues.legal_entity_name) body.legal_entity_name = jurValues.legal_entity_name;
      if (jurValues.tax_id)            body.tax_id = jurValues.tax_id;
      const res = await fetch(`${API_URL}/api/v1/tenants/${id}/jurisdictions`, {
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
      const body = { name: schValues.name, frequency: schValues.frequency, period_start: schValues.period_start, pay_date: schValues.pay_date };
      if (schValues.frequency === "one_off") body.period_end = schValues.period_end;
      const res = await fetch(`${API_URL}/api/v1/tenants/${id}/pay-schedules`, {
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

  const taxLabel = jurValues.jurisdiction === "AU" ? "ABN" : "NZBN";

  if (loading) {
    return (
      <div style={{padding:40,textAlign:"center",color:TT,fontFamily:F,fontSize:13.5}}>Loading…</div>
    );
  }

  if (!employer) return null;

  return (
    <div>
      {/* Back button */}
      <button onClick={()=>navigate(-1)}
        style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:TM,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:F,marginBottom:18,padding:0}}>
        <Icon d={ICONS.chevron} size={12} color={TM} style={{transform:"rotate(90deg)"}}/>
        Back
      </button>

      {/* Header */}
      <div style={{background:WH,border:`1.5px solid ${BR}`,borderRadius:12,padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:48,height:48,background:BL,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:B,fontFamily:F,flexShrink:0}}>
          {employer.name[0]}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:700,color:TX,fontFamily:F,marginBottom:4}}>{employer.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <JurTag j={employer.jurisdiction}/>
            <Badge s={employer.status}/>
            <span style={{fontSize:12,color:TT,fontFamily:F}}>ID: <code style={{fontFamily:"monospace"}}>{employer.id}</code></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={["Details","Jurisdictions","Pay Schedules"]} active={tab} setActive={t=>{ setTab(t); setError(null); }}/>

      <div style={{maxWidth:620,marginTop:20}}>

        {/* DETAILS */}
        {tab === "Details" && (
          <Card style={{padding:24}}>
            <FormField label="Employer Name">
              <TextInput value={editValues.name} onChange={v=>setEditValues(p=>({...p,name:v}))} />
            </FormField>
            <FormField label="Status">
              <select value={editValues.status} onChange={e=>setEditValues(p=>({...p,status:e.target.value}))} style={selStyle}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
              </select>
            </FormField>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <div style={{marginTop:8}}>
              <Btn onClick={saveDetails}>{saving ? "Saving…" : "Save Changes"}</Btn>
            </div>
          </Card>
        )}

        {/* JURISDICTIONS */}
        {tab === "Jurisdictions" && (
          <Card style={{padding:24}}>
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
            <div style={{marginTop:8}}>
              <Btn onClick={addJurisdiction}>{saving ? "Saving…" : "Save Jurisdiction"}</Btn>
            </div>
          </Card>
        )}

        {/* PAY SCHEDULES */}
        {tab === "Pay Schedules" && (
          <Card style={{padding:24}}>
            {schedules.length > 0 && (
              <div style={{marginBottom:20}}>
                {schedules.map(s => {
                  const fc = FREQ_COLORS[s.frequency] || { bg:"#f0eef5", fg:"#5a5270" };
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
          </Card>
        )}
      </div>
    </div>
  );
}
