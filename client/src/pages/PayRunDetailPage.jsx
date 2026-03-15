import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { B, TX, TM, TT, WH, BR, GN, AM, BU, GY, F } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate, fmtMoney } from "../lib/api";
import { Icon, Badge, JurTag, Btn, Card, TH, TD } from "../components/ui";

const STATUS_FLOW = {
  draft:       { action: "Calculate",   next: "calculating", endpoint: "calculate", color: GY },
  calculating: { action: "Calculating…", next: null, endpoint: null,                color: BU },
  review:      { action: "Approve",     next: "approved",    endpoint: "approve",   color: AM },
  approved:    { action: "Finalise",    next: "finalised",   endpoint: "finalise",  color: GN },
  finalised:   { action: null,          next: null,          endpoint: null,        color: GN },
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

export default function PayRunDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [payRun,   setPayRun]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}`, { headers: apiHeaders() });
      if (!res.ok) { navigate(-1); return; }
      setPayRun(await res.json());
    } finally { setLoading(false); }
  }

  async function doAction(endpoint) {
    setActing(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/pay-runs/${id}/${endpoint}`, {
        method: "POST",
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || `Failed to ${endpoint}`); return; }
      // Reload to get fresh state + calculated items
      await load();
    } finally { setActing(false); }
  }

  function toggleExpand(itemId) {
    setExpanded(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>Loading…</div>;
  }

  if (!payRun) return null;

  const jur     = payRun.jurisdiction;
  const flow    = STATUS_FLOW[payRun.status] || STATUS_FLOW.draft;
  const totals  = payRun.totals || {};
  const items   = payRun.items || [];

  const employerCost = jur === "NZ"
    ? (Number(totals.kiwisaver_er || 0) + Number(totals.acc_levy || 0))
    : Number(totals.super_er || 0);

  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate(-1)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TM, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: F, marginBottom: 18, padding: 0 }}>
        <Icon d={ICONS.chevron} size={12} color={TM} style={{ transform: "rotate(90deg)" }} />
        Back
      </button>

      {/* Header */}
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

          {/* Action button */}
          {flow.action && flow.endpoint && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <Btn onClick={() => doAction(flow.endpoint)} disabled={acting || payRun.status === "calculating"}>
                {acting ? "Working…" : flow.action}
              </Btn>
              {payRun.status === "draft" && (
                <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>
                  Calculation reads live employee pay settings
                </div>
              )}
              {payRun.status === "review" && (
                <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>
                  Review the amounts below before approving
                </div>
              )}
              {payRun.status === "approved" && (
                <div style={{ fontSize: 11.5, color: TT, fontFamily: F }}>
                  Finalising locks this pay run permanently
                </div>
              )}
            </div>
          )}
          {payRun.status === "finalised" && (
            <div style={{ fontSize: 12.5, color: GN.fg, fontWeight: 600, fontFamily: F, background: GN.bg, borderRadius: 7, padding: "8px 16px" }}>
              Finalised {fmtDate(payRun.finalised_at)} · Read-only
            </div>
          )}
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

      {/* Employee breakdown */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>
            {payRun.status === "draft"
              ? "Click Calculate to run payroll for all active employees on this schedule."
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
                    <TD mono>{fmtMoney(item.gross_wages, jur)}</TD>
                    <TD mono>{fmtMoney(item.paye_tax, jur)}</TD>
                    {jur === "NZ" && <TD mono>{fmtMoney(item.kiwisaver_ee, jur)}</TD>}
                    {jur === "NZ" && <TD mono>{fmtMoney(item.acc_levy, jur)}</TD>}
                    {jur === "AU" && <TD mono>{fmtMoney(item.super_er, jur)}</TD>}
                    <TD mono accent>{fmtMoney(item.net_wages, jur)}</TD>
                    <TD><Badge s={item.status} /></TD>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                      <button onClick={() => toggleExpand(item.id)}
                        style={{ background: "none", border: "none", color: TM, fontSize: 12, cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
                        {expanded[item.id] ? "Hide" : "Details"}
                      </button>
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

      {/* Finalised metadata */}
      {payRun.finalised_at && (
        <div style={{ marginTop: 16, fontSize: 12, color: TT, fontFamily: F, textAlign: "right" }}>
          Finalised {fmtDate(payRun.finalised_at)} · Pay run ID: <code style={{ fontFamily: "monospace" }}>{payRun.id}</code>
        </div>
      )}
    </div>
  );
}
