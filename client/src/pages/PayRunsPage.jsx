import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TX, TM, TT, WH, BR, F, B } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, fmtMoney } from "../lib/api";
import { Card, SectionHead, Badge, JurTag, TH, TD, Btn, Icon } from "../components/ui";

const FREQ_LABEL = { weekly: "Weekly", fortnightly: "Fortnightly", monthly: "Monthly", one_off: "One-off" };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: WH, borderRadius: 12, padding: "28px 32px", width: 480, maxWidth: "94vw", boxShadow: "0 8px 40px rgba(0,0,0,.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TX, fontFamily: F }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TT, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: TM, fontFamily: F, display: "block", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${BR}`, fontSize: 13.5, fontFamily: F, color: TX, boxSizing: "border-box" };
const selectStyle = { ...inputStyle };

export default function PayRunsPage() {
  const navigate = useNavigate();

  const [allRuns,      setAllRuns]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatus]       = useState("all");

  // New Pay Run modal state
  const [showNew,     setShowNew]     = useState(false);
  const [bureaus,     setBureaus]     = useState([]);
  const [tenants,     setTenants]     = useState([]);  // tenants for selected bureau
  const [schedules,   setSchedules]   = useState([]);  // schedules for selected tenant
  const [selectedBureau,  setSelBureau]   = useState("");
  const [selectedTenant,  setSelTenant]   = useState("");
  const [selectedSched,   setSelSched]    = useState("");
  const [prForm,      setPrForm]      = useState({ period_start: "", period_end: "", pay_date: "" });
  const [newBusy,     setNewBusy]     = useState(false);
  const [newError,    setNewError]    = useState(null);

  // Bureaus + tenants map (used to enrich pay run list)
  const [tenantMap, setTenantMap] = useState({});  // tenantId → { name, bureau_name }

  const statuses = ["all", "draft", "review", "approved", "finalised"];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const bRes = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
      if (!bRes.ok) return;
      const bureauList = await bRes.json();
      setBureaus(bureauList);

      const runs = [];
      const tMap = {};
      for (const bureau of bureauList) {
        const tRes = await fetch(`${API_URL}/api/v1/bureaus/${bureau.id}/tenants`, { headers: apiHeaders() });
        if (!tRes.ok) continue;
        const tenantList = await tRes.json();
        for (const tenant of tenantList) {
          tMap[tenant.id] = { name: tenant.name, bureau_name: bureau.name };
          const rRes = await fetch(`${API_URL}/api/v1/tenants/${tenant.id}/pay-runs`, { headers: apiHeaders() });
          if (!rRes.ok) continue;
          const tenantRuns = await rRes.json();
          tenantRuns.forEach(r => runs.push({ ...r, tenant_name: tenant.name, bureau_name: bureau.name }));
        }
      }
      runs.sort((a, b) => new Date(b.period_start) - new Date(a.period_start));
      setAllRuns(runs);
      setTenantMap(tMap);
    } finally { setLoading(false); }
  }

  // When bureau changes, load its tenants
  async function handleBureauChange(bureauId) {
    setSelBureau(bureauId);
    setSelTenant(""); setSelSched(""); setSchedules([]);
    if (!bureauId) { setTenants([]); return; }
    const res = await fetch(`${API_URL}/api/v1/bureaus/${bureauId}/tenants`, { headers: apiHeaders() });
    if (!res.ok) return;
    setTenants(await res.json());
  }

  // When tenant changes, load its pay schedules
  async function handleTenantChange(tenantId) {
    setSelTenant(tenantId);
    setSelSched(""); setSchedules([]);
    if (!tenantId) return;
    const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/pay-schedules`, { headers: apiHeaders() });
    if (!res.ok) return;
    setSchedules(await res.json());
  }

  function openNew() {
    setSelBureau(""); setSelTenant(""); setSelSched("");
    setTenants([]); setSchedules([]);
    setPrForm({ period_start: "", period_end: "", pay_date: "" });
    setNewError(null);
    setShowNew(true);
  }

  async function doCreatePayRun() {
    if (!selectedTenant || !selectedSched || !prForm.period_start || !prForm.period_end || !prForm.pay_date) {
      setNewError("All fields are required"); return;
    }
    setNewBusy(true); setNewError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/${selectedTenant}/pay-runs`, {
        method: "POST",
        headers: { ...apiHeaders(), "X-Idempotency-Key": `new-${Date.now()}` },
        body: JSON.stringify({
          pay_schedule_id: selectedSched,
          period_start:    prForm.period_start,
          period_end:      prForm.period_end,
          pay_date:        prForm.pay_date,
          run_type:        "regular",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setNewError(data?.error?.message || "Failed to create pay run"); return; }
      setShowNew(false);
      navigate(`/pay-runs/${data.id}`);
    } finally { setNewBusy(false); }
  }

  const filtered = allRuns.filter(r => statusFilter === "all" || r.status === statusFilter);

  return (
    <div>
      <SectionHead
        title="Pay Runs"
        sub="All payroll runs across employers"
        actions={<Btn onClick={openNew}>+ New Pay Run</Btn>}
      />

      {/* Filter bar */}
      <Card style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={ICONS.filter} size={14} color={TT} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: TT, fontFamily: F }}>Status:</span>
        </div>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{
              padding: "5px 14px", borderRadius: 6, border: `1.5px solid ${statusFilter === s ? B : BR}`,
              background: statusFilter === s ? B : WH, color: statusFilter === s ? WH : TM,
              fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all .15s",
            }}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: TT, fontFamily: F }}>{filtered.length} run{filtered.length !== 1 ? "s" : ""}</span>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>
            {allRuns.length === 0
              ? <>No pay runs yet. Click <strong>+ New Pay Run</strong> to create one.</>
              : "No pay runs match the selected filter."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Employer</TH>
                <TH>Schedule</TH>
                <TH>Period</TH>
                <TH>Pay Date</TH>
                <TH>Jur</TH>
                <TH>Status</TH>
                <TH>Employees</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="trow" style={{ cursor: "pointer" }} onClick={() => navigate(`/pay-runs/${r.id}`)}>
                  <TD bold>{r.tenant_name}</TD>
                  <TD>{r.schedule_name || "—"}</TD>
                  <TD muted>{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</TD>
                  <TD>{fmtDate(r.pay_date)}</TD>
                  <TD><JurTag j={r.jurisdiction} /></TD>
                  <TD><Badge s={r.status} /></TD>
                  <TD mono>{r.employee_count ?? "—"}</TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <span style={{ color: B, fontWeight: 600, fontSize: 12.5, fontFamily: F }}>Open →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── New Pay Run Modal ──────────────────────────────────────────────── */}
      {showNew && (
        <Modal title="New Pay Run" onClose={() => setShowNew(false)}>
          <Field label="Bureau">
            <select value={selectedBureau} onChange={e => handleBureauChange(e.target.value)} style={selectStyle}>
              <option value="">Select bureau…</option>
              {bureaus.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>

          <Field label="Employer">
            <select value={selectedTenant} onChange={e => handleTenantChange(e.target.value)} style={selectStyle} disabled={!selectedBureau}>
              <option value="">Select employer…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>

          <Field label="Pay Schedule">
            <select value={selectedSched} onChange={e => setSelSched(e.target.value)} style={selectStyle} disabled={!selectedTenant || schedules.length === 0}>
              <option value="">Select schedule…</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({FREQ_LABEL[s.frequency] || s.frequency})</option>
              ))}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
            <Field label="Period Start">
              <input type="date" value={prForm.period_start} onChange={e => setPrForm(p => ({ ...p, period_start: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Period End">
              <input type="date" value={prForm.period_end} onChange={e => setPrForm(p => ({ ...p, period_end: e.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="Pay Date">
            <input type="date" value={prForm.pay_date} onChange={e => setPrForm(p => ({ ...p, pay_date: e.target.value }))} style={inputStyle} />
          </Field>

          {newError && (
            <div style={{ marginBottom: 14, padding: "8px 12px", background: "#fdeaea", color: "#8a1f1f", borderRadius: 6, fontSize: 12.5, fontFamily: F }}>
              {newError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowNew(false)}
              style={{ padding: "9px 20px", borderRadius: 7, border: `1.5px solid ${BR}`, background: WH, color: TM, fontSize: 13, cursor: "pointer", fontFamily: F }}>
              Cancel
            </button>
            <Btn onClick={doCreatePayRun} disabled={newBusy}>
              {newBusy ? "Creating…" : "Create Pay Run"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
