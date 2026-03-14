import { useOutletContext, useNavigate } from "react-router-dom";
import { TX, TM, TT, F } from "../lib/constants";
import { UPCOMING, ALERTS, ACTIVITY } from "../lib/constants";
import { Card, Stat, Badge, JurTag, TH, TD, PageJurFilter } from "../components/ui";

export default function DashboardPage() {
  const { jur, setJur } = useOutletContext();
  const navigate = useNavigate();

  const filteredUpcoming = jur === "ALL" ? UPCOMING : UPCOMING.filter(r => r.jur === jur);
  const filteredActivity = jur === "ALL" ? ACTIVITY : ACTIVITY.filter(a => a.jur === jur);

  const stats = jur === "ALL"
    ? [
        { label: "NZ Employees",       value: "402",  sub: "↑ +8 this month", accentSub: true },
        { label: "AU Employees",        value: "215",  sub: "↑ +4 this month", accentSub: true },
        { label: "Draft Pay Runs",      value: "3",    sub: "Awaiting action" },
        { label: "Payroll This Month",  value: "$284K",sub: "Net disbursed", dark: true },
      ]
    : jur === "NZ"
    ? [
        { label: "NZ Employees",       value: "402",  sub: "↑ +8 this month", accentSub: true },
        { label: "NZ Pay Runs",        value: "2",    sub: "Active this period" },
        { label: "NZ Draft Runs",      value: "1",    sub: "Awaiting action" },
        { label: "NZ Payroll Month",   value: "$168K",sub: "Net disbursed", dark: true },
      ]
    : [
        { label: "AU Employees",       value: "215",  sub: "↑ +4 this month", accentSub: true },
        { label: "AU Pay Runs",        value: "1",    sub: "Active this period" },
        { label: "AU Draft Runs",      value: "2",    sub: "Awaiting action" },
        { label: "AU Payroll Month",   value: "$116K",sub: "Net disbursed", dark: true },
      ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TX, letterSpacing: -.4, fontFamily: F }}>Good morning 👋</h2>
          <p style={{ fontSize: 13.5, color: TM, marginTop: 4, fontFamily: F }}>Friday, 6 March 2026 · Pay The Nanny</p>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 22 }}>
        {stats.map(s => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} accentSub={s.accentSub} dark={s.dark} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F }}>Upcoming Pay Runs</span>
            <button onClick={() => navigate("/pay-runs")} style={{ background: "none", border: "none", color: "#39175D", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: F }}>View all →</button>
          </div>
          {filteredUpcoming.length === 0
            ? <p style={{ fontSize: 13.5, color: TT, fontFamily: F, padding: "12px 0" }}>No upcoming pay runs for this country.</p>
            : filteredUpcoming.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #f0eef7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, background: "#f0ebf8", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#39175D", fontFamily: F }}>{r.jur}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TX, fontFamily: F }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: TT, marginTop: 2, fontFamily: F }}>{r.date} · {r.emp} employees</div>
                  </div>
                </div>
                <Badge s={r.status} />
              </div>
            ))}
        </Card>

        <Card style={{ padding: "20px 22px" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 16 }}>Alerts</span>
          {ALERTS.map(a => {
            const col = a.sev === "error" ? "#D94040" : a.sev === "warn" ? "#C07800" : "#4A6EB0";
            return (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid #f0eef7" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: TX, fontFamily: F }}>{a.msg}</div>
                  <div style={{ fontSize: 12, color: TT, marginTop: 2, fontFamily: F }}>{a.sub}</div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <Card style={{ padding: "20px 22px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: TT, letterSpacing: .6, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 14 }}>Recent Activity</span>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><TH>Event</TH><TH>Client</TH><TH>Employees</TH><TH>Net Pay</TH><TH>Jurisdiction</TH><TH>Time</TH></tr></thead>
          <tbody>
            {filteredActivity.length === 0
              ? <tr><td colSpan={6} style={{ padding: "24px 14px", textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>No activity for this country.</td></tr>
              : filteredActivity.map(a => (
                <tr key={a.id} className="trow">
                  <TD bold>{a.ev}</TD><TD>{a.client}</TD><TD mono>{a.emp}</TD>
                  <TD mono accent={a.net !== "—"} bold={a.net !== "—"}>{a.net}</TD>
                  <TD><JurTag j={a.jur} /></TD><TD muted>{a.time}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
