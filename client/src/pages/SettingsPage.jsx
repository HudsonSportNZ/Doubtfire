import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { B, TX, TM, TT, WH, BR, SU, BL, GN, GY, AM, F } from "../lib/constants";
import { API_URL, apiHeaders, fmtDate } from "../lib/api";
import { Card, SectionHead, Btn, TabBar, PlaceholderTab, Badge, FormField, TextInput, ErrorMsg, ModalActions } from "../components/ui";

// ─── Human-friendly scale summaries ──────────────────────────────────────────

function scaleSummary(def) {
  if (!def) return "—";
  switch (def.type) {
    case "nz_flat_rate":
      return `${(def.rate * 100).toFixed(1)}% flat · ACC ${def.acc_applies ? "applies" : "exempt"}`;
    case "nz_marginal_rate": {
      const top = def.brackets?.[def.brackets.length - 1];
      return `Marginal · ${def.brackets?.length} brackets · top rate ${top ? (top.rate * 100).toFixed(1) + "%" : "?"}${def.ietc ? " · IETC" : ""}${def.student_loan ? " · SL" : ""}`;
    }
    case "nz_acc_levy":
      return `${(def.rate * 100).toFixed(2)}% · cap $${def.annual_maximum_liable_earnings?.toLocaleString()}`;
    case "nz_student_loan":
      return `${(def.rate * 100).toFixed(0)}% above $${def.annual_threshold?.toLocaleString()} threshold`;
    case "nz_esct":
      return `Marginal · ${def.brackets?.length} ESCT brackets`;
    case "au_payg_marginal": {
      const top = def.brackets?.[def.brackets.length - 1];
      return `Scale ${def.scale} · ${def.scale_name} · ${def.brackets?.length} brackets · top ${top ? (top.rate * 100).toFixed(1) + "%" : "?"}${def.lito ? " · LITO" : ""}`;
    }
    case "au_payg_flat":
      return `Scale ${def.scale} · ${(def.rate * 100).toFixed(0)}% flat · ${def.scale_name}`;
    case "au_medicare":
      return `${(def.standard_rate * 100).toFixed(0)}% · threshold $${def.low_income_threshold?.toLocaleString()} · shade-in to $${def.shade_in_upper?.toLocaleString()}`;
    case "au_help":
      return `${def.thresholds?.filter(t => t.rate > 0).length} repayment bands · ${(def.thresholds?.[def.thresholds.length - 1]?.rate * 100).toFixed(0)}% max rate`;
    default:
      return def.type || "—";
  }
}

function BracketsTable({ brackets, valueLabel = "Rate" }) {
  if (!brackets?.length) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: F }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "4px 10px", color: TT, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>From</th>
          <th style={{ textAlign: "left", padding: "4px 10px", color: TT, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>To</th>
          <th style={{ textAlign: "left", padding: "4px 10px", color: TT, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {brackets.map((b, i) => (
          <tr key={i} style={{ background: i % 2 ? "#faf9fc" : WH }}>
            <td style={{ padding: "5px 10px", color: TX }}>${b.from?.toLocaleString()}</td>
            <td style={{ padding: "5px 10px", color: TX }}>{b.to === null ? "No limit" : `$${b.to?.toLocaleString()}`}</td>
            <td style={{ padding: "5px 10px", color: B, fontWeight: 600 }}>{((b.rate ?? b.rate) * 100).toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScaleDefinitionDetail({ def }) {
  if (!def) return null;

  return (
    <div style={{ padding: "12px 0 4px" }}>
      {/* NZ marginal rate */}
      {(def.type === "nz_marginal_rate") && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 6 }}>PAYE Brackets</div>
          <BracketsTable brackets={def.brackets} valueLabel="Marginal Rate" />
          {def.ietc && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 4 }}>IETC (Independent Earner Tax Credit)</div>
              <div style={{ fontSize: 12.5, color: TX }}>
                ${def.ietc.annual_credit}/yr for income ${def.ietc.lower_threshold?.toLocaleString()}–${def.ietc.full_credit_upper?.toLocaleString()},
                abates at {(def.ietc.abatement_rate * 100).toFixed(0)}¢/$ to ${def.ietc.upper_threshold?.toLocaleString()}
              </div>
            </div>
          )}
          {def.student_loan && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 4 }}>Student Loan (inline)</div>
              <div style={{ fontSize: 12.5, color: TX }}>
                {(def.student_loan.rate * 100).toFixed(0)}% above ${def.student_loan.annual_threshold?.toLocaleString()}/yr
              </div>
            </div>
          )}
        </>
      )}

      {/* NZ flat rate */}
      {def.type === "nz_flat_rate" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: B }}>{(def.rate * 100).toFixed(1)}%</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>ACC</div><div style={{ fontSize: 14, fontWeight: 600, color: TX }}>{def.acc_applies ? "Applies" : "Exempt"}</div></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Reason</div><div style={{ fontSize: 12.5, color: TM }}>{def.reason}</div></div>
        </div>
      )}

      {/* NZ ACC levy */}
      {def.type === "nz_acc_levy" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: B }}>{(def.rate * 100).toFixed(2)}%</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Max Liable Earnings</div><div style={{ fontSize: 16, fontWeight: 700, color: TX }}>${def.annual_maximum_liable_earnings?.toLocaleString()}/yr</div></div>
        </div>
      )}

      {/* NZ Student Loan */}
      {def.type === "nz_student_loan" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Repayment Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: B }}>{(def.rate * 100).toFixed(0)}%</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Annual Threshold</div><div style={{ fontSize: 16, fontWeight: 700, color: TX }}>${def.annual_threshold?.toLocaleString()}</div></div>
        </div>
      )}

      {/* NZ ESCT */}
      {def.type === "nz_esct" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 6 }}>ESCT Brackets (based on employee annual gross)</div>
          <BracketsTable brackets={def.brackets} valueLabel="ESCT Rate" />
        </>
      )}

      {/* AU PAYG marginal */}
      {def.type === "au_payg_marginal" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 6 }}>Income Tax Brackets</div>
          <BracketsTable brackets={def.brackets} valueLabel="Marginal Rate" />
          {def.lito && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 4 }}>LITO (Low Income Tax Offset)</div>
              <div style={{ fontSize: 12.5, color: TX }}>
                Max ${def.lito.max_offset} · phases out at {(def.lito.phase_out_1_rate * 100).toFixed(0)}¢/$ above ${def.lito.phase_out_1_threshold?.toLocaleString()},
                then {(def.lito.phase_out_2_rate * 100).toFixed(1)}¢/$ above ${def.lito.phase_out_2_threshold?.toLocaleString()}
              </div>
            </div>
          )}
        </>
      )}

      {/* AU PAYG flat */}
      {def.type === "au_payg_flat" && (
        <div style={{ display: "flex", gap: 24 }}>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: B }}>{(def.rate * 100).toFixed(0)}%</div></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Scale</div><div style={{ fontSize: 14, color: TX }}>{def.scale_name}</div></div>
        </div>
      )}

      {/* AU Medicare */}
      {def.type === "au_medicare" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Standard Rate</div><div style={{ fontSize: 20, fontWeight: 800, color: B }}>{(def.standard_rate * 100).toFixed(0)}%</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Low Income Threshold</div><div style={{ fontSize: 15, fontWeight: 700, color: TX }}>${def.low_income_threshold?.toLocaleString()}</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Shade-in Upper</div><div style={{ fontSize: 15, fontWeight: 700, color: TX }}>${def.shade_in_upper?.toLocaleString()}</div></div>
          <div><div style={{ fontSize: 11, color: TT, textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Shade-in Rate</div><div style={{ fontSize: 15, fontWeight: 700, color: TX }}>{(def.shade_in_rate * 100).toFixed(0)}%</div></div>
        </div>
      )}

      {/* AU HELP */}
      {def.type === "au_help" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: TM, marginBottom: 6 }}>HELP Repayment Thresholds</div>
          <BracketsTable brackets={def.thresholds?.filter(t => t.rate > 0)} valueLabel="Repayment %" />
        </>
      )}

      {/* Note */}
      {def.note && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbea", borderRadius: 6, border: "1px solid #f0e0a0", fontSize: 12, color: "#8a6a00", fontFamily: F }}>
          ⚠️ {def.note}
        </div>
      )}
    </div>
  );
}

// ─── Edit rate modal ──────────────────────────────────────────────────────────

function EditRateModal({ scale, onClose, onSaved }) {
  const [values, setValues] = useState({
    effective_from: scale.effective_from,
    effective_to: scale.effective_to || "",
    definition: JSON.stringify(scale.definition, null, 2),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setSaving(true); setError(null);
    let parsedDef;
    try {
      parsedDef = JSON.parse(values.definition);
    } catch {
      setError("Definition is not valid JSON. Check formatting."); setSaving(false); return;
    }

    const body = {
      effective_from: values.effective_from,
      effective_to: values.effective_to || null,
      definition: parsedDef,
    };

    const res = await fetch(`${API_URL}/api/v1/admin/tax-scales/${scale.id}`, {
      method: "PATCH",
      headers: apiHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data?.error?.message || "Failed to save"); setSaving(false); return; }
    onSaved(data);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,22,37,.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: WH, borderRadius: 14, boxShadow: "0 24px 80px rgba(57,23,93,.22)", width: "100%", maxWidth: 660, fontFamily: F, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TX }}>Edit — {scale.scale_type}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: TT, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px 0", overflowY: "auto", flex: 1 }}>
          <div style={{ fontSize: 12.5, color: TM, marginBottom: 14, padding: "8px 12px", background: "#fff8e1", borderRadius: 7, border: "1px solid #f0d070" }}>
            You are editing a live rule. Changes take effect immediately on the next pay run calculation.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <FormField label="Effective From (YYYY-MM-DD)">
              <TextInput value={values.effective_from} onChange={v => setValues(p => ({ ...p, effective_from: v }))} placeholder="e.g. 2025-04-01" />
            </FormField>
            <FormField label="Effective To (leave blank = no end date)">
              <TextInput value={values.effective_to} onChange={v => setValues(p => ({ ...p, effective_to: v }))} placeholder="blank = active indefinitely" />
            </FormField>
          </div>
          <FormField label="Definition (JSON)">
            <textarea
              value={values.definition}
              onChange={e => setValues(p => ({ ...p, definition: e.target.value }))}
              style={{ width: "100%", minHeight: 280, border: `1.5px solid ${BR}`, borderRadius: 7, padding: "10px 13px", fontSize: 12.5, fontFamily: "monospace", color: TX, resize: "vertical", boxSizing: "border-box" }}
            />
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </div>
        <div style={{ padding: "12px 24px 20px" }}>
          <ModalActions>
            <Btn ghost onClick={onClose}>Cancel</Btn>
            <Btn onClick={save} disabled={saving || !values.effective_from}>{saving ? "Saving…" : "Save Changes"}</Btn>
          </ModalActions>
        </div>
      </div>
    </div>
  );
}

// ─── Scale row (collapsible) ──────────────────────────────────────────────────

function ScaleRow({ scale, isActive, canDelete, onAddNew, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const def = scale.definition;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true); setDeleteError(null);
    const res = await fetch(`${API_URL}/api/v1/admin/tax-scales/${scale.id}`, {
      method: "DELETE",
      headers: apiHeaders(),
    });
    if (res.ok) {
      onDelete(scale.id);
    } else {
      const data = await res.json();
      setDeleteError(data?.error?.message || "Failed to delete");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div style={{ borderBottom: `1px solid ${BR}` }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: "0 0 200px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TX, fontFamily: F }}>{scale.scale_type}</div>
          <div style={{ fontSize: 11.5, color: TT, fontFamily: F, marginTop: 2 }}>{def?.tax_year || "—"}</div>
        </div>
        <div style={{ flex: 1, fontSize: 12.5, color: TM, fontFamily: F }}>{scaleSummary(def)}</div>
        <div style={{ flex: "0 0 120px", textAlign: "right" }}>
          {isActive
            ? <span style={{ background: GN.bg, color: GN.fg, borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, fontFamily: F }}>Active from {fmtDate(scale.effective_from)}</span>
            : <span style={{ background: GY.bg, color: GY.fg, borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, fontFamily: F }}>Until {fmtDate(scale.effective_to)}</span>
          }
        </div>
        <span style={{ fontSize: 16, color: TT, fontFamily: F, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: "0 0 16px 0" }}>
          <ScaleDefinitionDetail def={def} />

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {isActive && (
              <Btn small ghost onClick={e => { e.stopPropagation(); onAddNew(scale); }}>
                + Add New Year's Rates for {scale.scale_type}
              </Btn>
            )}
            <Btn small ghost onClick={e => { e.stopPropagation(); onEdit(scale); }}>
              Edit this row
            </Btn>
            {canDelete && (
              confirmDelete ? (
                <>
                  <span style={{ fontSize: 12.5, color: "#c0392b", fontFamily: F }}>Confirm delete?</span>
                  <Btn small ghost onClick={handleDelete} disabled={deleting} style={{ color: "#c0392b", borderColor: "#c0392b" }}>
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </Btn>
                  <Btn small ghost onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}>Cancel</Btn>
                </>
              ) : (
                <Btn small ghost onClick={handleDelete} style={{ color: "#c0392b", borderColor: "#c0392b" }}>
                  Delete
                </Btn>
              )
            )}
            {deleteError && <span style={{ fontSize: 12, color: "#c0392b", fontFamily: F }}>{deleteError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New rate modal ───────────────────────────────────────────────────────────

function NewRateModal({ template, onClose, onSaved }) {
  const [values, setValues] = useState({
    effective_from: "",
    effective_to: "",
    definition: JSON.stringify(template.definition, null, 2),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setSaving(true); setError(null);
    let parsedDef;
    try {
      parsedDef = JSON.parse(values.definition);
    } catch {
      setError("Definition is not valid JSON. Check formatting."); setSaving(false); return;
    }

    const body = {
      jurisdiction: template.jurisdiction,
      scale_type: template.scale_type,
      effective_from: values.effective_from,
      effective_to: values.effective_to || null,
      definition: parsedDef,
    };

    const res = await fetch(`${API_URL}/api/v1/admin/tax-scales`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data?.error?.message || "Failed to save"); setSaving(false); return; }
    onSaved(data);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,22,37,.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: WH, borderRadius: 14, boxShadow: "0 24px 80px rgba(57,23,93,.22)", width: "100%", maxWidth: 660, fontFamily: F, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TX }}>New Rates — {template.scale_type}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: TT, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px 0", overflowY: "auto", flex: 1 }}>
          <div style={{ fontSize: 12.5, color: TM, marginBottom: 14, padding: "8px 12px", background: BL, borderRadius: 7 }}>
            The existing row stays intact for historical pay run recalculations. This new row becomes active from the date you set.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <FormField label="Effective From (YYYY-MM-DD)">
              <TextInput value={values.effective_from} onChange={v => setValues(p => ({ ...p, effective_from: v }))} placeholder="e.g. 2025-04-01" />
            </FormField>
            <FormField label="Effective To (leave blank = current)">
              <TextInput value={values.effective_to} onChange={v => setValues(p => ({ ...p, effective_to: v }))} placeholder="blank = active indefinitely" />
            </FormField>
          </div>
          <FormField label="Definition (JSON — edit the values, keep the structure)">
            <textarea
              value={values.definition}
              onChange={e => setValues(p => ({ ...p, definition: e.target.value }))}
              style={{ width: "100%", minHeight: 280, border: `1.5px solid ${BR}`, borderRadius: 7, padding: "10px 13px", fontSize: 12.5, fontFamily: "monospace", color: TX, resize: "vertical", boxSizing: "border-box" }}
            />
          </FormField>
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </div>
        <div style={{ padding: "12px 24px 20px" }}>
          <ModalActions>
            <Btn ghost onClick={onClose}>Cancel</Btn>
            <Btn onClick={save} disabled={saving || !values.effective_from}>{saving ? "Saving…" : "Save New Rates"}</Btn>
          </ModalActions>
        </div>
      </div>
    </div>
  );
}

// ─── Tax Engine tab ───────────────────────────────────────────────────────────

function TaxEngineContent() {
  const [scales,      setScales]      = useState([]);
  const [superRates,  setSuperRates]  = useState([]);
  const [ksRates,     setKsRates]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [jurFilter,   setJurFilter]   = useState("ALL");
  const [addModal,    setAddModal]    = useState(null); // template scale row
  const [editModal,   setEditModal]   = useState(null); // scale row to edit
  const [subTab,      setSubTab]      = useState("Tax Scales");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, srRes, ksRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/tax-scales`, { headers: apiHeaders() }),
        fetch(`${API_URL}/api/v1/admin/super-rates`, { headers: apiHeaders() }),
        fetch(`${API_URL}/api/v1/admin/kiwisaver-rates`, { headers: apiHeaders() }),
      ]);
      if (sRes.ok)  setScales(await sRes.json());
      if (srRes.ok) setSuperRates(await srRes.json());
      if (ksRes.ok) setKsRates(await ksRes.json());
    } finally { setLoading(false); }
  }

  function handleSaved(newRow) {
    setScales(prev => [newRow, ...prev]);
  }

  function handleEdited(updatedRow) {
    setScales(prev => prev.map(s => s.id === updatedRow.id ? updatedRow : s));
  }

  function handleDeleted(deletedId) {
    setScales(prev => prev.filter(s => s.id !== deletedId));
  }

  // Group scales by scale_type, mark which row is active (no effective_to or latest)
  const filteredScales = jurFilter === "ALL" ? scales : scales.filter(s => s.jurisdiction === jurFilter);

  // For each scale_type, the first row (newest effective_from) with effective_to=null is active
  const activeIds = new Set();
  const grouped = {};
  for (const s of filteredScales) {
    if (!grouped[s.scale_type]) grouped[s.scale_type] = [];
    grouped[s.scale_type].push(s);
  }
  for (const [, rows] of Object.entries(grouped)) {
    const active = rows.find(r => !r.effective_to);
    if (active) activeIds.add(active.id);
  }

  return (
    <div>
      <TabBar tabs={["Tax Scales", "Super Rates (AU)", "KiwiSaver Rates (NZ)"]} active={subTab} setActive={setSubTab} />

      {/* TAX SCALES */}
      {subTab === "Tax Scales" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: TM, fontFamily: F }}>Filter:</span>
            {["ALL", "NZ", "AU"].map(j => (
              <button key={j} onClick={() => setJurFilter(j)}
                style={{ padding: "5px 16px", borderRadius: 6, border: `1.5px solid ${jurFilter === j ? B : BR}`, background: jurFilter === j ? B : WH, color: jurFilter === j ? WH : TM, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: F }}>
                {j}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: TT, fontFamily: F }}>{filteredScales.length} rows</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: TT, fontFamily: F }}>Loading…</div>
          ) : (
            <Card style={{ padding: "0 24px" }}>
              {Object.entries(grouped).map(([scaleType, rows]) => (
                <div key={scaleType}>
                  <div style={{ padding: "14px 0 2px", fontSize: 11, fontWeight: 700, color: TT, textTransform: "uppercase", letterSpacing: .5, fontFamily: F, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: rows[0]?.jurisdiction === "NZ" ? "#eaf5ee" : "#e8f0fc", color: rows[0]?.jurisdiction === "NZ" ? "#1a7a3c" : "#2a4a9a", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{rows[0]?.jurisdiction}</span>
                    {scaleType}
                    <span style={{ color: TT, fontWeight: 400 }}>· {rows.length} version{rows.length > 1 ? "s" : ""}</span>
                  </div>
                  {rows.map(s => (
                    <ScaleRow
                      key={s.id}
                      scale={s}
                      isActive={activeIds.has(s.id)}
                      canDelete={rows.length > 1}
                      onAddNew={setAddModal}
                      onEdit={setEditModal}
                      onDelete={handleDeleted}
                    />
                  ))}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* SUPER RATES */}
      {subTab === "Super Rates (AU)" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 13, color: TM, fontFamily: F, marginBottom: 16 }}>
            AU Superannuation Guarantee rate history. The engine automatically picks the rate applicable to the pay run's period end date.
          </div>
          <Card style={{ padding: "0 24px" }}>
            {superRates.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < superRates.length - 1 ? `1px solid ${BR}` : "none" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: B, fontFamily: F, flex: "0 0 80px" }}>{(Number(r.rate) * 100).toFixed(2)}%</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: TX, fontFamily: F }}>From {fmtDate(r.effective_from)}</div>
                  <div style={{ fontSize: 12, color: TT, fontFamily: F }}>{r.effective_to ? `Until ${fmtDate(r.effective_to)}` : "Current / scheduled"}</div>
                </div>
                {!r.effective_to && <span style={{ background: GN.bg, color: GN.fg, borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, fontFamily: F }}>Active</span>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* KIWISAVER RATES */}
      {subTab === "KiwiSaver Rates (NZ)" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 13, color: TM, fontFamily: F, marginBottom: 16 }}>
            Valid KiwiSaver contribution rates per IRD. Employees choose their rate on their KS2 form.
          </div>
          <Card style={{ padding: "0 24px" }}>
            {ksRates.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < ksRates.length - 1 ? `1px solid ${BR}` : "none" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: B, fontFamily: F, flex: "0 0 60px" }}>{(Number(r.rate) * 100).toFixed(0)}%</div>
                <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.is_valid_employee_rate && <span style={{ background: GN.bg, color: GN.fg, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: F }}>Employee rate</span>}
                  {r.is_valid_employer_rate && <span style={{ background: "#e8f0fc", color: "#2a4a9a", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: F }}>Employer rate</span>}
                </div>
                {!r.is_active && <span style={{ fontSize: 11, color: TT, fontFamily: F }}>Inactive</span>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {addModal && (
        <NewRateModal template={addModal} onClose={() => setAddModal(null)} onSaved={handleSaved} />
      )}
      {editModal && (
        <EditRateModal scale={editModal} onClose={() => setEditModal(null)} onSaved={handleEdited} />
      )}
    </div>
  );
}

// ─── Existing content components ──────────────────────────────────────────────

function OrgContent() {
  const inp = (label, val) => (
    <div key={label} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: TM, marginBottom: 5, fontFamily: F }}>{label}</div>
      <input defaultValue={val} style={{ border: `1.5px solid ${BR}`, borderRadius: 7, padding: "9px 13px", fontSize: 13.5, fontFamily: F, color: TX, width: "100%" }} />
    </div>
  );
  return (
    <div style={{ maxWidth: 520 }}>
      <Card style={{ padding: "24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TX, fontFamily: F, marginBottom: 20 }}>Organisation Details</div>
        {inp("Organisation Name", "Pay The Nanny")}
        {inp("Primary Jurisdiction", "New Zealand")}
        {inp("Business Number (NZBN)", "9429045678901")}
        {inp("Payroll Contact Email", "payroll@paythenanny.co.nz")}
        <div style={{ marginTop: 8 }}><Btn>Save Changes</Btn></div>
      </Card>
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

const SETTINGS_PAGES = {
  "business":    { title: "Business Settings",   tabs: ["Organisation", "Branding", "Billing", "Notifications"] },
  "payroll":     { title: "Payroll Settings",    tabs: ["Pay Schedules", "Default Rules", "Tax Settings"] },
  "engine":      { title: "Pay Engine Settings", tabs: ["Calculation Config", "Rule Versions"] },
  "integration": { title: "Integration",         tabs: ["API Keys", "Webhooks", "Connected Apps"] },
};

export default function SettingsPage() {
  const { section } = useParams();
  const cfg = SETTINGS_PAGES[section] || SETTINGS_PAGES["business"];
  const [tab, setTab] = useState(cfg.tabs[0]);

  useEffect(() => { setTab(cfg.tabs[0]); }, [section]);

  return (
    <div>
      <SectionHead title={cfg.title} />
      <TabBar tabs={cfg.tabs} active={tab} setActive={setTab} />
      {section === "engine"      && tab === "Calculation Config" && <TaxEngineContent />}
      {section === "business"    && tab === "Organisation"       && <OrgContent />}
      {section !== "engine"      && tab !== "Organisation"       && tab !== "Calculation Config" && <PlaceholderTab title={tab} />}
      {section === "engine"      && tab !== "Calculation Config" && <PlaceholderTab title={tab} />}
    </div>
  );
}
