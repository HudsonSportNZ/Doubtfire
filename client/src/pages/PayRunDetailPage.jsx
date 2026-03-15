import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { B, TX, TM, TT, WH, BR, GN, AM, GY, F } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, fmtMoney } from "../lib/api";
import { Icon, Badge, JurTag, Btn, Card, TH, TD } from "../components/ui";

const STATUS_FLOW = {
  draft:       { action: "Calculate",   endpoint: "calculate", color: GY },
  calculating: { action: "Calculating…", endpoint: null,       color: AM },
  review:      { action: "Approve",     endpoint: "approve",   color: AM, revert: true },
  approved:    { action: "Finalise",    endpoint: "finalise",  color: GN, revert: true },
  finalised:   { action: null,          endpoint: null,        color: GN },
};

function SummaryCard({ label, value, sub, dark }) {
  return (
    <Card style={{ padding: "18px 20px", background: dark ? B : WH, border: `1.5px solid ${dark ? B : BR}`, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: dark ? "rgba(255,255,255,.55)" : TT, marginBottom: 8, fontFamily: F }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.4, color: dark ? "#fff" : TX, fontFamily: F }}>{value}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4, color: dark ? "rgba(255,255,255,.55)" : TT, fontFamily: F }}>{sub}</div>}
    </Card>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: WH, borderRadius: 12, padding: "28px 32px", width: 420, maxWidth: "92vw", boxShadow: "0 8px 40px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TX, fontFamily: F }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TT, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PayRunDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [payRun,   setPayRun]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState({});

  // Add Employee modal
  const [showAddEmp,    setShowAddEmp]    = useState(false);
  const [allEmployees,  setAllEmployees]  = useState([]);
  const [selectedEmp,   setSelectedEmp]   = useState("");
  const [addEmpBusy,    setAddEmpBusy]    = useState(false);
  const [addEmpError,   setAddEmpError]   = useState(null);

  // Add Hours modal
  const [showHours,     setShowHours]     = useState(false);
  const [hoursEmp,      setHoursEmp]      = useState(null); // { employee_id, first_name, last_name }
  const [hoursValue,    setHoursValue]    = useState("");
  const [hoursBusy,     setHoursBusy]     = useState(false);
  const [hoursError,    setHoursError]    = useState(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}`, { headers: apiHeaders() });
      if (!res.ok) { navigate(-1); return; }
      const data = await res.json();
      setPayRun(data);
    } finally { setLoading(false); }
  }

  async function loadEmployees(tenantId) {
    const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/employees`, { headers: apiHeaders() });
    if (!res.ok) return;
    setAllEmployees(await res.json());
  }

  function openAddEmp() {
    setAddEmpError(null);
    setSelectedEmp("");
    if (payRun?.tenant_id) loadEmployees(payRun.tenant_id);
    setShowAddEmp(true);
  }

  async function doAddEmployee() {
    if (!selectedEmp) return;
    setAddEmpBusy(true); setAddEmpError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}/employees`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ employee_id: selectedEmp }),
      });
      const data = await res.json();
      if (!res.ok) { setAddEmpError(data?.error?.message || "Failed to add employee"); return; }
      setShowAddEmp(false);
      await load();
    } finally { setAddEmpBusy(false); }
  }

  async function doRemoveEmployee(employeeId) {
    if (!confirm("Remove this employee from the pay run?")) return;
    await fetch(`${API_URL}/api/v1/pay-runs/${id}/employees/${employeeId}`, {
      method: "DELETE",
      headers: apiHeaders(),
    });
    await load();
  }

  function openAddHours(item) {
    setHoursEmp(item);
    setHoursValue("");
    setHoursError(null);
    setShowHours(true);
  }

  async function doAddHours() {
    const hrs = parseFloat(hoursValue);
    if (!hrs || hrs <= 0) { setHoursError("Enter a valid number of hours"); return; }
    setHoursBusy(true); setHoursError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}/timesheets`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ employee_id: hoursEmp.employee_id, total_hours: hrs }),
      });
      const data = await res.json();
      if (!res.ok) { setHoursError(data?.error?.message || "Failed to save hours"); return; }
      setShowHours(false);
      await load();
    } finally { setHoursBusy(false); }
  }

  async function doAction(endpoint) {
    setActing(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}/${endpoint}`, {
        method: "POST",
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || data?.message || `Failed to ${endpoint}`); return; }
      await load();
    } finally { setActing(false); }
  }

  async function doRevert() {
    if (!confirm("Revert this pay run to draft? Calculated amounts will be cleared and you can recalculate.")) return;
    setActing(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}/revert`, {
        method: "POST",
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || "Failed to revert"); return; }
      await load();
    } finally { setActing(false); }
  }

  async function doDelete() {
    if (!confirm("Permanently delete this draft pay run?")) return;
    const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}`, {
      method: "DELETE",
      headers: apiHeaders(),
    });
    if (res.ok) { navigate(-1); }
  }

  function toggleExpand(itemId) {
    setExpanded(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>Loading…</div>;
  }
  if (!payRun) return null;

  const jur    = payRun.jurisdiction;
  const flow   = STATUS_FLOW[payRun.status] || STATUS_FLOW.draft;
  const totals = payRun.totals || {};
  const items  = payRun.items || [];
  const isDraft = payRun.status === "draft";

  const employerCost = jur === "NZ"
    ? (Number(totals.kiwisaver_er || 0) + Number(totals.acc_levy || 0))
    : Number(totals.super_er || 0);

  // Employees already in this pay run
  const existingEmpIds = new Set(items.map(i => i.employee_id));

  // Employees eligible to add (not already in the run)
  const eligibleEmps = allEmployees.filter(e => !existingEmpIds.has(e.id));

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TM, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: F, marginBottom: 18, padding: 0 }}>
        <Icon d={ICONS.chevron} size={12} color={TM} style={{ transform: "rotate(90deg)" }} />
        Back
      </button>

      {/* Header card */}
      <Card style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <JurTag j={jur} />
              <Badge s={payRun.status} />
              <span style={{ fontSize: 12, color: TT, fontFamily: F }}>{payRun.run_type}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TX, fontFamily: F, marginBottom: 4 }}>
              Pay Run · {fmtDate(payRun.period_start)} – {fmtDate(payRun.period_end)}
            </div>
            <div style={{ fontSize: 13, color: TM, fontFamily: F }}>
              Pay date: <strong>{fmtDate(payRun.pay_date)}</strong>
              <span style={{ margin: "0 8px", color: BR }}>|</span>
              {items.length} employee{items.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isDraft && (
                <button onClick={openAddEmp}
                  style={{ padding: "8px 18px", borderRadius: 7, border: `1.5px solid ${B}`, background: "transparent", color: B, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  + Add Employee
                </button>
              )}
              {flow.revert && (
                <button onClick={doRevert} disabled={acting}
                  style={{ padding: "8px 18px", borderRadius: 7, border: "1.5px solid #c0392b", background: "transparent", color: "#c0392b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  Revert to Draft
                </button>
              )}
              {flow.action && flow.endpoint && (
                <Btn onClick={() => doAction(flow.endpoint)} disabled={acting || payRun.status === "calculating"}>
                  {acting ? "Working…" : flow.action}
                </Btn>
              )}
              {isDraft && (
                <button onClick={doDelete}
                  style={{ padding: "8px 14px", borderRadius: 7, border: "1.5px solid #e0d8f0", background: "transparent", color: "#999", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  Delete
                </button>
              )}
            </div>
            {isDraft && (
              <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>
                Add employees and hours, then click Calculate
              </div>
            )}
            {payRun.status === "review" && (
              <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>Review amounts below before approving</div>
            )}
            {payRun.status === "approved" && (
              <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>Finalising locks this pay run permanently</div>
            )}
            {payRun.status === "finalised" && (
              <div style={{ fontSize: 12.5, color: GN.fg, fontWeight: 600, fontFamily: F, background: GN.bg, borderRadius: 7, padding: "8px 16px" }}>
                Finalised {fmtDate(payRun.finalised_at)} · Read-only
              </div>
            )}
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fdeaea", color: "#8a1f1f", borderRadius: 7, fontSize: 13, fontFamily: F }}>
            {error}
          </div>
        )}
      </Card>

      {/* Summary totals */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <SummaryCard label="Total Gross" value={fmtMoney(totals.gross_wages, jur)} />
          <SummaryCard label={jur === "NZ" ? "Total PAYE" : "Total PAYG"} value={fmtMoney(totals.paye_tax, jur)} />
          <SummaryCard label="Total Net Pay" value={fmtMoney(totals.net_wages, jur)} dark />
          <SummaryCard
            label={jur === "NZ" ? "Employer KiwiSaver + ACC" : "Employer Super"}
            value={fmtMoney(employerCost, jur)}
            sub="Employer cost (not deducted from employee)"
          />
        </div>
      )}

      {/* Employee table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>
            {isDraft
              ? <>Use <strong>+ Add Employee</strong> to add people to this run, then click <strong>Calculate</strong>.</>
              : "No employees found for this pay run."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Employee</TH>
                <TH>Gross</TH>
                <TH>{jur === "NZ" ? "PAYE" : "PAYG"}</TH>
                {jur === "NZ" && <TH>KiwiSaver EE</TH>}
                {jur === "NZ" && <TH>ACC</TH>}
                {jur === "AU" && <TH>Super ER</TH>}
                <TH>Net Pay</TH>
                <TH>Status</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <>
                  <tr key={item.id} className="trow">
                    <TD bold>{item.first_name} {item.last_name}</TD>
                    <TD mono>{item.gross_wages ? fmtMoney(item.gross_wages, jur) : "—"}</TD>
                    <TD mono>{item.paye_tax ? fmtMoney(item.paye_tax, jur) : "—"}</TD>
                    {jur === "NZ" && <TD mono>{item.kiwisaver_ee ? fmtMoney(item.kiwisaver_ee, jur) : "—"}</TD>}
                    {jur === "NZ" && <TD mono>{item.acc_levy ? fmtMoney(item.acc_levy, jur) : "—"}</TD>}
                    {jur === "AU" && <TD mono>{item.super_er ? fmtMoney(item.super_er, jur) : "—"}</TD>}
                    <TD mono accent>{item.net_wages ? fmtMoney(item.net_wages, jur) : "—"}</TD>
                    <TD><Badge s={item.status} /></TD>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f0eef7" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isDraft && (
                          <>
                            <button onClick={() => openAddHours(item)}
                              style={{ background: "none", border: `1px solid ${B}`, color: B, borderRadius: 5, padding: "4px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap" }}>
                              Set Hours
                            </button>
                            <button onClick={() => doRemoveEmployee(item.employee_id)}
                              style={{ background: "none", border: "none", color: "#c0392b", fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
                              Remove
                            </button>
                          </>
                        )}
                        {item.line_items && item.line_items.length > 0 && (
                          <button onClick={() => toggleExpand(item.id)}
                            style={{ background: "none", border: "none", color: TM, fontSize: 12, cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
                            {expanded[item.id] ? "Hide" : "Details"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded[item.id] && item.line_items && item.line_items.length > 0 && (
                    <tr key={`${item.id}-lines`}>
                      <td colSpan={jur === "NZ" ? 9 : 8} style={{ padding: "0 0 4px 0", background: "#faf9fc" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ padding: "8px 28px", fontSize: 11, fontWeight: 700, color: TT, textTransform: "uppercase", letterSpacing: .4, fontFamily: F, textAlign: "left" }}>Component</th>
                              <th style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: TT, textTransform: "uppercase", letterSpacing: .4, fontFamily: F, textAlign: "right" }}>Amount</th>
                              <th style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: TT, textTransform: "uppercase", letterSpacing: .4, fontFamily: F }}>Taxable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.line_items.map(li => (
                              <tr key={li.id}>
                                <td style={{ padding: "6px 28px", fontSize: 12.5, color: TX, fontFamily: F, borderBottom: `1px solid ${BR}` }}>{li.code}</td>
                                <td style={{ padding: "6px 14px", fontSize: 12.5, fontFamily: "monospace", color: TX, textAlign: "right", borderBottom: `1px solid ${BR}` }}>{fmtMoney(li.amount, jur)}</td>
                                <td style={{ padding: "6px 14px", fontSize: 12, color: TT, fontFamily: F, borderBottom: `1px solid ${BR}` }}>{li.is_taxable ? "Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {payRun.finalised_at && (
        <div style={{ marginTop: 16, fontSize: 12, color: TT, fontFamily: F, textAlign: "right" }}>
          Finalised {fmtDate(payRun.finalised_at)} · Pay run ID: <code style={{ fontFamily: "monospace" }}>{payRun.id}</code>
        </div>
      )}

      {/* ── Add Employee Modal ─────────────────────────────────────────────── */}
      {showAddEmp && (
        <Modal title="Add Employee to Pay Run" onClose={() => setShowAddEmp(false)}>
          {eligibleEmps.length === 0 && allEmployees.length > 0 ? (
            <p style={{ fontSize: 13, color: TT, fontFamily: F }}>All active employees are already in this pay run.</p>
          ) : (
            <>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: TM, fontFamily: F, display: "block", marginBottom: 6 }}>
                Employee
              </label>
              <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${BR}`, fontSize: 13.5, fontFamily: F, color: TX, marginBottom: 16 }}>
                <option value="">Select employee…</option>
                {eligibleEmps.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
              {addEmpError && (
                <div style={{ marginBottom: 14, padding: "8px 12px", background: "#fdeaea", color: "#8a1f1f", borderRadius: 6, fontSize: 12.5, fontFamily: F }}>
                  {addEmpError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowAddEmp(false)}
                  style={{ padding: "9px 20px", borderRadius: 7, border: `1.5px solid ${BR}`, background: WH, color: TM, fontSize: 13, cursor: "pointer", fontFamily: F }}>
                  Cancel
                </button>
                <Btn onClick={doAddEmployee} disabled={!selectedEmp || addEmpBusy}>
                  {addEmpBusy ? "Adding…" : "Add to Run"}
                </Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Set Hours Modal ────────────────────────────────────────────────── */}
      {showHours && hoursEmp && (
        <Modal title={`Set Hours — ${hoursEmp.first_name} ${hoursEmp.last_name}`} onClose={() => setShowHours(false)}>
          <p style={{ fontSize: 13, color: TT, fontFamily: F, marginBottom: 16 }}>
            Enter the total hours worked in this pay period. For salary employees these hours are recorded but salary is always pro-rata.
          </p>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: TM, fontFamily: F, display: "block", marginBottom: 6 }}>
            Total hours
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={hoursValue}
            onChange={e => setHoursValue(e.target.value)}
            placeholder="e.g. 40"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${BR}`, fontSize: 14, fontFamily: F, color: TX, marginBottom: 16, boxSizing: "border-box" }}
            onKeyDown={e => e.key === "Enter" && doAddHours()}
            autoFocus
          />
          {hoursError && (
            <div style={{ marginBottom: 14, padding: "8px 12px", background: "#fdeaea", color: "#8a1f1f", borderRadius: 6, fontSize: 12.5, fontFamily: F }}>
              {hoursError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowHours(false)}
              style={{ padding: "9px 20px", borderRadius: 7, border: `1.5px solid ${BR}`, background: WH, color: TM, fontSize: 13, cursor: "pointer", fontFamily: F }}>
              Cancel
            </button>
            <Btn onClick={doAddHours} disabled={hoursBusy}>
              {hoursBusy ? "Saving…" : "Save Hours"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
