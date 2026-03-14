import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { TX, TM, TT, WH, BR, F } from "../lib/constants";
import { PAY_RUNS, ICONS } from "../lib/constants";
import { Card, SectionHead, Badge, TH, TD, Btn, PageJurFilter, Icon } from "../components/ui";

export default function PayRunsPage() {
  const { jur, setJur } = useOutletContext();
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [dateFilter,     setDateFilter]     = useState("");

  const schedules = ["all", "Weekly", "Fortnightly", "Monthly"];
  const filtered  = PAY_RUNS.filter(r => {
    if (jur !== "ALL" && r.jur !== jur)                                                  return false;
    if (scheduleFilter !== "all" && r.schedule !== scheduleFilter)                        return false;
    if (dateFilter && !r.datePaid.toLowerCase().includes(dateFilter.toLowerCase()))       return false;
    return true;
  });

  return (
    <div>
      <SectionHead
        title="Pay Runs"
        sub={jur === "ALL" ? "All payroll runs across jurisdictions" : `Payroll runs · ${jur}`}
        actions={<Btn icon="plus">New Pay Run</Btn>}
      />

      <Card style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={ICONS.filter} size={14} color={TT} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: TT, fontFamily: F }}>Filter:</span>
        </div>
        <PageJurFilter jur={jur} setJur={setJur} />
        <div style={{ width: 1, height: 20, background: BR }} />
        <div style={{ display: "flex", gap: 6 }}>
          {schedules.map(s => (
            <button key={s} onClick={() => setScheduleFilter(s)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: `1.5px solid ${scheduleFilter === s ? "#39175D" : BR}`,
                background: scheduleFilter === s ? "#39175D" : WH, color: scheduleFilter === s ? WH : TM,
                fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all .15s"
              }}>
              {s === "all" ? "All Schedules" : s}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: BR }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: TT, fontFamily: F }}>Pay Date:</span>
          <input value={dateFilter} onChange={e => setDateFilter(e.target.value)} placeholder="e.g. Mar 2026"
            style={{ border: `1.5px solid ${BR}`, borderRadius: 7, padding: "5px 12px", fontSize: 13, fontFamily: F, color: TX, width: 140 }} />
        </div>
        {(jur !== "ALL" || scheduleFilter !== "all" || dateFilter) && (
          <button onClick={() => { setJur("ALL"); setScheduleFilter("all"); setDateFilter(""); }}
            style={{ background: "none", border: "none", color: TT, fontSize: 12.5, cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
            Clear all
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: TT, fontFamily: F }}>{filtered.length} runs</span>
      </Card>

      <Card style={{ padding: "20px 22px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><TH>Pay Schedule</TH><TH>Pay Period</TH><TH>Date Paid</TH><TH>Status</TH><TH>Employees</TH><TH>IRD Filing</TH><TH>Payslips</TH><TH></TH></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} style={{ padding: "28px 14px", textAlign: "center", color: TT, fontFamily: F, fontSize: 13.5 }}>No pay runs match your filters.</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="trow">
                  <TD bold>{r.schedule}</TD>
                  <TD muted>{r.period}</TD>
                  <TD>{r.datePaid}</TD>
                  <TD><Badge s={r.status} /></TD>
                  <TD mono>{r.emp}</TD>
                  <TD><Badge s={r.ird} /></TD>
                  <TD><Badge s={r.payslips} /></TD>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0eef7" }}>
                    <button style={{ background: "none", border: "none", color: "#39175D", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: F }}>Open →</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
