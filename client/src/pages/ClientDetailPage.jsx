import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { B, BL, TX, TM, TT, WH, BR, F } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL, apiHeaders } from "../lib/api";
import {
  Icon, Badge, JurTag, Btn, Card, TH, TD,
  Modal, FormField, TextInput, ErrorMsg, ModalActions,
} from "../components/ui";

const COUNTRY_OPTIONS = [
  { value: "",     label: "Select country…" },
  { value: "NZ",   label: "🇳🇿 New Zealand" },
  { value: "AU",   label: "🇦🇺 Australia" },
  { value: "BOTH", label: "🌐 Both NZ & AU" },
];

export default function ClientDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [client,         setClient]         = useState(null);
  const [employers,      setEmployers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showEdit,       setShowEdit]       = useState(false);
  const [showNewEmployer,setShowNewEmployer]= useState(false);
  const [editValues,     setEditValues]     = useState({});
  const [employerName,   setEmployerName]   = useState("");
  const [employerSlug,   setEmployerSlug]   = useState("");
  const [employerJur,    setEmployerJur]    = useState("NZ");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const selStyle = {width:"100%",border:`1.5px solid ${BR}`,borderRadius:7,padding:"9px 13px",fontSize:13.5,fontFamily:F,color:TX,background:WH};

  useEffect(() => { loadClient(); loadEmployers(); }, [id]);

  async function loadClient() {
    setLoading(true);
    try {
      // No GET /bureaus/:id endpoint — fetch list and find by id
      const res = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
      if (!res.ok) { navigate("/clients"); return; }
      const list = await res.json();
      const found = list.find(b => b.id === id);
      if (!found) { navigate("/clients"); return; }
      setClient(found);
      setEditValues({ name: found.name, country: found.country ?? "", admin_email: found.admin_email ?? "", phone: found.phone ?? "", website: found.website ?? "" });
    } finally { setLoading(false); }
  }

  async function loadEmployers() {
    const res = await fetch(`${API_URL}/api/v1/bureaus/${id}/tenants`, { headers: apiHeaders() });
    if (res.ok) setEmployers(await res.json());
  }

  function handleEmployerNameChange(val) {
    setEmployerName(val);
    setEmployerSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function updateClient() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${id}`, {
        method: "PATCH",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to update client"); return; }
      setClient(data);
      setShowEdit(false);
    } finally { setSaving(false); }
  }

  async function createEmployer() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bureaus/${id}/tenants`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ name: employerName, slug: employerSlug, jurisdiction: employerJur }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to create employer"); return; }
      setEmployers(prev => [data, ...prev]);
      setShowNewEmployer(false);
      setEmployerName(""); setEmployerSlug(""); setEmployerJur("NZ"); setError(null);
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div style={{padding:40,textAlign:"center",color:TT,fontFamily:F,fontSize:13.5}}>Loading…</div>;
  }

  if (!client) return null;

  return (
    <div>
      {/* Back */}
      <button onClick={()=>navigate("/clients")}
        style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:TM,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:F,marginBottom:18,padding:0}}>
        <Icon d={ICONS.chevron} size={12} color={TM} style={{transform:"rotate(90deg)"}}/>
        All Clients
      </button>

      {/* Client header card */}
      <div style={{background:WH,border:`1.5px solid ${BR}`,borderRadius:12,padding:"20px 24px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,background:BL,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:B,fontFamily:F,flexShrink:0}}>
            {client.name[0]}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:TX,fontFamily:F,marginBottom:4}}>{client.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {client.country && <JurTag j={client.country==="BOTH"?"ALL":client.country}/>}
              {client.admin_email && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>✉ {client.admin_email}</span>}
              {client.phone       && <span style={{fontSize:12.5,color:TM,fontFamily:F}}>☎ {client.phone}</span>}
            </div>
          </div>
        </div>
        <Btn ghost onClick={()=>{ setShowEdit(true); setError(null); }}>Edit Client</Btn>
      </div>

      {/* Employers section */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:TT,letterSpacing:.6,textTransform:"uppercase",fontFamily:F}}>Employers ({employers.length})</div>
        <Btn icon="plus" onClick={()=>{ setShowNewEmployer(true); setError(null); }}>New Employer</Btn>
      </div>

      {employers.length === 0 ? (
        <Card style={{padding:32,textAlign:"center"}}>
          <div style={{fontSize:13.5,color:TT,fontFamily:F}}>No employers yet. Add the first one.</div>
        </Card>
      ) : (
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Name</TH><TH>Jurisdiction</TH><TH>Status</TH><TH>Created</TH><TH></TH></tr></thead>
            <tbody>
              {employers.map(e => (
                <tr key={e.id} className="trow">
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    <span style={{fontSize:13.5,fontWeight:600,color:TX,fontFamily:F}}>{e.name}</span>
                  </td>
                  <TD><JurTag j={e.jurisdiction}/></TD>
                  <TD><Badge s={e.status}/></TD>
                  <TD muted>{new Date(e.created_at).toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"})}</TD>
                  <td style={{padding:"12px 14px",borderBottom:"1px solid #f0eef7"}}>
                    <button onClick={()=>navigate(`/employers/${e.id}`)}
                      style={{background:"none",border:`1.5px solid ${BR}`,borderRadius:6,color:B,fontWeight:600,fontSize:12.5,cursor:"pointer",fontFamily:F,padding:"4px 12px"}}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Edit Client modal */}
      {showEdit && (
        <Modal title={`Edit Client — ${client.name}`} onClose={()=>setShowEdit(false)}>
          <FormField label="Client Name">
            <TextInput value={editValues.name ?? ""} onChange={v=>setEditValues(p=>({...p,name:v}))} />
          </FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormField label="Country">
              <select value={editValues.country ?? ""} onChange={e=>setEditValues(p=>({...p,country:e.target.value}))} style={selStyle}>
                {COUNTRY_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Admin Email">
              <TextInput value={editValues.admin_email ?? ""} onChange={v=>setEditValues(p=>({...p,admin_email:v}))} />
            </FormField>
            <FormField label="Phone">
              <TextInput value={editValues.phone ?? ""} onChange={v=>setEditValues(p=>({...p,phone:v}))} />
            </FormField>
            <FormField label="Website">
              <TextInput value={editValues.website ?? ""} onChange={v=>setEditValues(p=>({...p,website:v}))} />
            </FormField>
          </div>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <ModalActions>
            <Btn ghost onClick={()=>setShowEdit(false)}>Cancel</Btn>
            <Btn onClick={updateClient}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </Modal>
      )}

      {/* New Employer modal */}
      {showNewEmployer && (
        <Modal title={`New Employer under ${client.name}`} onClose={()=>{ setShowNewEmployer(false); setEmployerName(""); setEmployerSlug(""); setEmployerJur("NZ"); setError(null); }}>
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
            <Btn ghost onClick={()=>{ setShowNewEmployer(false); setError(null); }}>Cancel</Btn>
            <Btn onClick={createEmployer}>{saving ? "Creating…" : "Create Employer"}</Btn>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
