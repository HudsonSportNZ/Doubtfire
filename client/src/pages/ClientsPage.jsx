import { useState, useEffect } from "react";
import { B, BL, BM, TX, TM, TT, WH, BR, GN, AM, F } from "../lib/constants";
import { FREQ_LABELS, FREQ_COLORS, ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate } from "../lib/api";
import {
  Icon, Badge, JurTag, Btn, Card, SectionHead, TH, TD,
  Modal, FormField, TextInput, ErrorMsg, ModalActions, TabBar,
} from "../components/ui";

const COUNTRY_OPTIONS = [
  { value: "",     label: "Select country…" },
  { value: "NZ",   label: "🇳🇿 New Zealand" },
  { value: "AU",   label: "🇦🇺 Australia" },
  { value: "BOTH", label: "🌐 Both NZ & AU" },
];

function ClientForm({ values, onChange }) {
  return (
    <>
      <FormField label="Client Name">
        <TextInput value={values.name ?? ""} onChange={v => onChange("name", v)} placeholder="e.g. Pay The Nanny" autoFocus />
      </FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormField label="Country">
          <select value={values.country ?? ""} onChange={e => onChange("country", e.target.value)}
            style={{width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH}}>
            {COUNTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Admin Email">
          <TextInput value={values.admin_email ?? ""} onChange={v => onChange("admin_email", v)} placeholder="admin@example.com" />
        </FormField>
        <FormField label="Phone">
          <TextInput value={values.phone ?? ""} onChange={v => onChange("phone", v)} placeholder="+64 9 123 4567" />
        </FormField>
        <FormField label="Website">
          <TextInput value={values.website ?? ""} onChange={v => onChange("website", v)} placeholder="https://example.com" />
        </FormField>
      </div>
    </>
  );
}

function EmployerDetail({ employer, onClose, onUpdated }) {
  const [tab,           setTab]           = useState("Details");
  const [editValues,    setEditValues]    = useState({ name: employer.name, status: employer.status });
  const [jurValues,     setJurValues]     = useState({ jurisdiction: "NZ", legal_entity_name: "", tax_id: "" });
  const [jurisdictions, setJurisdictions] = useState([]);
  const [schedules,     setSchedules]     = useState([]);
  const [showSchForm,   setShowSchForm]   = useState(false);
  const [schValues,     setSchValues]     = useState({ name:"", frequency:"weekly", period_start:"", period_end:"", pay_date:"" });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const selStyle = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};

  useEffect(() => { loadDetail(); loadSchedules(); }, []);

  async function loadDetail() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}`, { headers: apiHeaders() });
    if (res.ok) { const data = await res.json(); setJurisdictions(data.jurisdictions ?? []); }
  }
  async function loadSchedules() {
    const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/pay-schedules`, { headers: apiHeaders() });
    if (res.ok) setSchedules(await res.json());
  }
  async function saveDetails() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to save"); return; }
      onUpdated(data);
    } finally { setSaving(false); }
  }
  async function addJurisdiction() {
    setSaving(true); setError(null);
    try {
      const body = { jurisdiction: jurValues.jurisdiction };
      if (jurValues.legal_entity_name) body.legal_entity_name = jurValues.legal_entity_name;
      if (jurValues.tax_id)            body.tax_id = jurValues.tax_id;
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/jurisdictions`, {
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
      const res = await fetch(`${API_URL}/api/v1/tenants/${employer.id}/pay-schedules`, {
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

  return (
    <Modal title={employer.name} onClose={onClose} maxWidth={580}>
      <TabBar tabs={["Details","Jurisdictions","Pay Schedules"]} active={tab} setActive={setTab}/>

      {tab === "Details" && (
        <>
          <FormField label="Employer Name">
            <TextInput value={editValues.name} onChange={v => setEditValues(p=>({...p,name:v}))} />
          </FormField>
          <FormField label="Status">
            <select value={editValues.status} onChange={e=>setEditValues(p=>({...p,status:e.target.value}))} style={selStyle}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={saveDetails}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </>
      )}

      {tab === "Jurisdictions" && (
        <>
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
          <ModalActions>
            <Btn ghost onClick={onClose}>Close</Btn>
            <Btn onClick={addJurisdiction}>{saving ? "Saving…" : "Save Jurisdiction"}</Btn>
          </ModalActions>
        </>
      )}

      {tab === "Pay Schedules" && (
        <>
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
          {!showSchForm && (
            <ModalActions><Btn ghost onClick={onClose}>Close</Btn></ModalActions>
          )}
        </>
      )}
    </Modal>
  );
}

/* ── SKELETON ROWS ────────────────────────────────────────── */
function SkeletonRows({ count = 4 }) {
  return (
    <>
      {Array.from({length:count}).map((_, i) => (
        <tr key={i} style={{borderBottom:`1px solid ${BR}`}}>
          {[["55%",8],["20%",6],["18%",6],["8%",6]].map(([w,h],j) => (
            <td key={j} style={{padding:"12px 14px"}}>
              <div style={{height:h,width:w,borderRadius:4,background:i%2===0?"#e8e4f0":"#ede9f5",animation:"pulse 1.4s ease-in-out infinite"}}/>
            </td>
          ))}
        </tr>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </>
  );
}

/* ── CLIENTS PAGE ─────────────────────────────────────────── */
export default function ClientsPage() {
  const [clients,          setClients]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedClient,   setSelectedClient]   = useState(null);
  const [employers,        setEmployers]        = useState([]);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [showNewClient,    setShowNewClient]    = useState(false);
  const [showEditClient,   setShowEditClient]   = useState(false);
  const [showNewEmployer,  setShowNewEmployer]  = useState(false);
  const [editingEmployer,  setEditingEmployer]  = useState(null);
  const [newClientValues,  setNewClientValues]  = useState({name:"",country:"",admin_email:"",phone:"",website:""});
  const [editClientValues, setEditClientValues] = useState({});
  const [employerName,     setEmployerName]     = useState("");
  const [employerSlug,     setEmployerSlug]     = useState("");
  const [employerJur,      setEmployerJur]      = useState("NZ");
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (selectedClient) loadEmployers(selectedClient.id); }, [selectedClient]);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
      if (res.ok) { const data = await res.json(); setClients(data); if (data.length > 0) setSelectedClient(data[0]); }
    } finally { setLoading(false); }
  }
  async function loadEmployers(clientId) {
    setEmployersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${clientId}/tenants`, { headers: apiHeaders() });
      if (res.ok) setEmployers(await res.json());
    } finally { setEmployersLoading(false); }
  }
  function closeNewClient()   { setShowNewClient(false);   setNewClientValues({name:"",country:"",admin_email:"",phone:"",website:""}); setError(null); }
  function closeEditClient()  { setShowEditClient(false);  setEditClientValues({}); setError(null); }
  function closeNewEmployer() { setShowNewEmployer(false); setEmployerName(""); setEmployerSlug(""); setEmployerJur("NZ"); setError(null); }

  function openEditClient() {
    setEditClientValues({ name: selectedClient?.name ?? "", country: selectedClient?.country ?? "", admin_email: selectedClient?.admin_email ?? "", phone: selectedClient?.phone ?? "", website: selectedClient?.website ?? "" });
    setShowEditClient(true); setError(null);
  }
  function handleEmployerNameChange(val) {
    setEmployerName(val);
    setEmployerSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  async function createClient() {
    setSaving(true); setError(null);
    try {
      const body = Object.fromEntries(Object.entries(newClientValues).filter(([,v]) => v !== ""));
      const res = await fetch(`${API_URL}/api/v1/bureaus`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create client"); return; }
      setClients(prev => [data, ...prev]); setSelectedClient(data); setEmployers([]); closeNewClient();
    } finally { setSaving(false); }
  }
  async function updateClient() {
    if (!selectedClient) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${selectedClient.id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editClientValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to update client"); return; }
      setClients(prev => prev.map(c => c.id === data.id ? data : c)); setSelectedClient(data); closeEditClient();
    } finally { setSaving(false); }
  }
  async function createEmployer() {
    if (!selectedClient) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${selectedClient.id}/tenants`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ name: employerName, slug: employerSlug, jurisdiction: employerJur }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create employer"); return; }
      setEmployers(prev => [data, ...prev]); closeNewEmployer();
    } finally { setSaving(false); }
  }

  const selStyle = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};

  return (
    <div>
      <SectionHead
        title="Clients"
        sub="Manage your clients and their employers"
        actions={
          <Btn icon="plus" onClick={()=>{ setShowNewClient(true); setError(null); }} disabled={loading}>
            New Client
          </Btn>
        }
      />

      {loading ? (
        <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20,alignItems:"start"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Clients</div>
            {[1,2,3].map(i => (
              <div key={i} style={{padding:"13px 16px",borderRadius:9,marginBottom:8,background:WH,border:`1.5px solid ${BR}`}}>
                <div style={{height:14,width:"70%",borderRadius:6,background:"#e8e4f0",marginBottom:8}}/>
                <div style={{height:11,width:"40%",borderRadius:6,background:"#ede9f5"}}/>
              </div>
            ))}
          </div>
          <Card>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
              <tbody><SkeletonRows/></tbody>
            </table>
          </Card>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        </div>
      ) : clients.length === 0 ? (
        <Card style={{padding:48,textAlign:"center"}}>
          <div style={{fontSize:36,opacity:.12,marginBottom:14}}>◎</div>
          <div style={{fontSize:15,fontWeight:700,color:TT,fontFamily:F}}>No clients yet</div>
          <div style={{fontSize:13,color:TT,fontFamily:F,marginTop:6}}>Create your first client to get started.</div>
        </Card>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20,alignItems:"start"}}>
          {/* Client list */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Clients</div>
            {clients.map(c => (
              <div key={c.id} onClick={()=>setSelectedClient(c)} className="card-h"
                style={{padding:"13px 16px",borderRadius:9,marginBottom:8,cursor:"pointer",
                  background:selectedClient?.id===c.id?BL:WH,
                  border:`1.5px solid ${selectedClient?.id===c.id?B:BR}`,transition:"all .15s"}}>
                <div style={{fontSize:13.5,fontWeight:600,color:selectedClient?.id===c.id?B:TX,fontFamily:F}}>{c.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                  {c.country && <JurTag j={c.country==="BOTH"?"ALL":c.country}/>}
                  <span style={{fontSize:11.5,color:TT,fontFamily:F}}>{c.is_active?"Active":"Inactive"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Employer panel */}
          {selectedClient && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:TX,fontFamily:F}}>{selectedClient.name}</div>
                  <div style={{display:"flex",gap:16,marginTop:4}}>
                    {selectedClient.admin_email && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>✉ {selectedClient.admin_email}</span>}
                    {selectedClient.phone       && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>☎ {selectedClient.phone}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn ghost small onClick={openEditClient}>Edit Client</Btn>
                  <Btn icon="plus" small onClick={()=>{ setShowNewEmployer(true); setError(null); }}>New Employer</Btn>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F,marginBottom:10}}>Employers</div>
              {employersLoading ? (
                <Card>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
                    <tbody><SkeletonRows count={3}/></tbody>
                  </table>
                </Card>
              ) : employers.length === 0 ? (
                <Card style={{padding:32,textAlign:"center"}}>
                  <div style={{fontSize:13.5,color:TT,fontFamily:F}}>No employers yet. Add the first one.</div>
                </Card>
              ) : (
                <Card>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH>Name</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
                    <tbody>
                      {employers.map(e => (
                        <tr key={e.id} className="trow">
                          <TD bold>{e.name}</TD>
                          <TD><Badge s={e.status}/></TD>
                          <TD muted>{new Date(e.created_at).toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"})}</TD>
                          <TD>
                            <button onClick={()=>setEditingEmployer(e)}
                              style={{background:"none",border:`1px solid ${BR}`,borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:600,color:TM,cursor:"pointer",fontFamily:F}}>
                              Edit
                            </button>
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {showNewClient && (
        <Modal title="New Client" onClose={closeNewClient}>
          <ClientForm values={newClientValues} onChange={(k,v)=>setNewClientValues(p=>({...p,[k]:v}))} />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeNewClient}>Cancel</Btn>
            <Btn onClick={createClient}>{saving ? "Creating…" : "Create Client"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {showEditClient && (
        <Modal title={`Edit Client — ${selectedClient?.name}`} onClose={closeEditClient}>
          <ClientForm values={editClientValues} onChange={(k,v)=>setEditClientValues(p=>({...p,[k]:v}))} />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeEditClient}>Cancel</Btn>
            <Btn onClick={updateClient}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {showNewEmployer && (
        <Modal title={`New Employer under ${selectedClient?.name}`} onClose={closeNewEmployer}>
          <FormField label="Employer Name">
            <TextInput value={employerName} onChange={handleEmployerNameChange} placeholder="e.g. Smith Family" autoFocus />
          </FormField>
          <FormField label="Jurisdiction">
            <select value={employerJur} onChange={e=>setEmployerJur(e.target.value)} style={selStyle}>
              <option value="NZ">🇳🇿 New Zealand</option>
              <option value="AU">🇦🇺 Australia</option>
            </select>
          </FormField>
          <FormField label="Slug" hint="auto-generated — edit if needed">
            <TextInput value={employerSlug} onChange={setEmployerSlug} placeholder="e.g. smith-family" />
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={closeNewEmployer}>Cancel</Btn>
            <Btn onClick={createEmployer}>{saving ? "Creating…" : "Create Employer"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {editingEmployer && (
        <EmployerDetail
          employer={editingEmployer}
          onClose={()=>setEditingEmployer(null)}
          onUpdated={updated=>{ setEmployers(prev=>prev.map(e=>e.id===updated.id?updated:e)); setEditingEmployer(updated); }}
        />
      )}
    </div>
  );
}
