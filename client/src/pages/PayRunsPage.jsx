import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TX, TM, TT, WH, BR, F, B } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, fmtMoney } from "../lib/api";
import { Card, SectionHead, Badge, JurTag, TH, TD, Btn, Icon } from "../components/ui";

export default function PayRunsPage() {
  const navigate = useNavigate();
  const [bureaus,    setBureaus]    = useState([]);
  const [allRuns,    setAllRuns]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [statusFilter, setStatus]  = useState("all");

  const statuses = ["all", "draft", "review", "approved", "finalised"];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // Load bureaus → tenants → pay runs (walk the hierarchy)
      const bRes = await fetch(`${API_URL}/api/v1/bureaus`, { headers: apiHeaders() });
      if (!bRes.ok) return;
      const bureauList = await bRes.json();
      setBureaus(bureauList);

      const runs = [];
      for (const bureau of bureauList) {
        const tRes = await fetch(`${API_URL}/api/v1/bureaus/${bureau.id}/tenants`, { headers: apiHeaders() });
        if (!tRes.ok) continue;
        const tenants = await tRes.json();
        for (const tenant of tenants) {
          const rRes = await fetch(`${API_URL}/api/v1/tenants/${tenant.id}/pay-runs`, { headers: apiHeaders() });
          if (!rRes.ok) continue;
          const tenantRuns = await rRes.json();
          tenantRuns.forEach(r => runs.push({ ...r, tenant_name: tenant.name, bureau_name: bureau.name }));
        }
      }
      // Sort by period_start desc
      runs.sort((a, b) => new Date(b.period_start) - new Date(a.period_start));
      setAllRuns(runs);
    } finally { setLoading(false); }
  }

  const filtered = allRuns.filter(r => statusFilter === "all" || r.status === statusFilter);

  return (
    <div>
      <SectionHead
        title="Pay Runs"
        sub="All payroll runs across employers"
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
              ? "No pay runs yet. Open an employer and go to the Pay Runs tab to create one."
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
                <TH>Gross</TH>
                <TH>Net</TH>
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
                  <TD mono>{r.totals ? fmtMoney(r.totals.gross_wages, r.jurisdiction) : "—"}</TD>
                  <TD mono>{r.totals ? fmtMoney(r.totals.net_wages, r.jurisdiction) : "—"}</TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <span style={{ color: B, fontWeight: 600, fontSize: 12.5, fontFamily: F }}>Open →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
