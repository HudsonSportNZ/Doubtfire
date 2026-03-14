import { useState } from "react";
import { TX, TM, TT, WH, BR, RD, F } from "../lib/constants";
import { ICONS } from "../lib/constants";
import { API_URL } from "../lib/api";
import { Icon } from "../components/ui";

const DB_TABLES = [
  { table:"bureaus",               label:"Bureaus" },
  { table:"tenants",               label:"Tenants" },
  { table:"tenant_jurisdictions",  label:"Tenant Jurisdictions" },
  { table:"jurisdictions",         label:"Jurisdictions" },
  { table:"users",                 label:"Users" },
  { table:"tenant_memberships",    label:"Tenant Memberships" },
  { table:"employees",             label:"Employees" },
  { table:"pay_settings",          label:"Pay Settings" },
  { table:"pay_schedules",         label:"Pay Schedules" },
  { table:"pay_runs",              label:"Pay Runs" },
  { table:"pay_run_items",         label:"Pay Run Items" },
  { table:"pay_run_line_items",    label:"Pay Run Line Items" },
  { table:"variable_pay_items",    label:"Variable Pay Items" },
  { table:"calculation_snapshots", label:"Calculation Snapshots" },
  { table:"rules",                 label:"Rules" },
  { table:"rule_versions",         label:"Rule Versions" },
  { table:"rule_overrides",        label:"Rule Overrides" },
  { table:"timesheets",            label:"Timesheets" },
  { table:"leave_types",           label:"Leave Types" },
  { table:"leave_profiles",        label:"Leave Profiles" },
  { table:"leave_profile_rules",   label:"Leave Profile Rules" },
  { table:"leave_entitlements",    label:"Leave Entitlements" },
  { table:"leave_transactions",    label:"Leave Transactions" },
  { table:"leave_requests",        label:"Leave Requests" },
  { table:"audit_log",             label:"Audit Log" },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);
  const [dlError,     setDlError]     = useState(null);

  async function downloadTable(table) {
    setDownloading(table);
    setDlError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/v1/admin/reports/${table}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${table}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(`Failed to download ${table}: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:TX, letterSpacing:-.4, fontFamily:F }}>Reports</h2>
          <p style={{ fontSize:13.5, color:TM, marginTop:4, fontFamily:F }}>
            Download any database table as a CSV file — opens directly in Excel.
          </p>
        </div>
      </div>

      {dlError && (
        <div style={{ background:RD.bg, color:RD.fg, borderRadius:8, padding:"10px 14px", fontSize:13, fontFamily:F, marginBottom:16 }}>
          {dlError}
        </div>
      )}

      <div style={{ marginBottom:8, fontSize:12, fontWeight:600, color:TM, fontFamily:F, letterSpacing:.5, textTransform:"uppercase" }}>
        Database Tables
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
        {DB_TABLES.map(({ table, label }) => {
          const isLoading = downloading === table;
          return (
            <button
              key={table}
              onClick={() => downloadTable(table)}
              disabled={!!downloading}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                gap:8, padding:"11px 14px",
                background:WH, border:`1.5px solid ${BR}`, borderRadius:8,
                cursor: downloading ? "wait" : "pointer",
                fontFamily:F, fontSize:13, color:TX, fontWeight:500,
                textAlign:"left", transition:"all .15s",
                opacity: (downloading && !isLoading) ? 0.5 : 1,
              }}
            >
              <span>{label}</span>
              {isLoading
                ? <span style={{ fontSize:11, color:TM }}>...</span>
                : <Icon d={ICONS.download} size={14} color="#39175D" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
