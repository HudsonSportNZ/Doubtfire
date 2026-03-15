export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function apiHeaders() {
  const token = localStorage.getItem("auth_token");
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("T")[0].split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function fmtMoney(n, jur = "NZ") {
  if (n === null || n === undefined) return "—";
  const currency = jur === "AU" ? "AUD" : "NZD";
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

export const REQUIRED_FIELDS = [
  { key: 'title',                      label: 'Title',           tab: 'General'    },
  { key: 'email',                      label: 'Email',           tab: 'General'    },
  { key: 'mobile_phone',               label: 'Mobile phone',    tab: 'General'    },
  { key: 'residential_street_address', label: 'Street address',  tab: 'General'    },
  { key: 'residential_city',           label: 'City',            tab: 'General'    },
  { key: 'residential_region',         label: 'Region',          tab: 'General'    },
  { key: 'residential_post_code',      label: 'Post code',       tab: 'General'    },
  { key: 'residential_country',        label: 'Country',         tab: 'General'    },
  { key: 'employment_type',            label: 'Employment type', tab: 'Employment' },
  { key: 'leave_profile_id',           label: 'Leave template',  tab: 'Employment' },
  { key: 'bank_name',                  label: 'Bank name',       tab: 'Payments'   },
  { key: 'bank_account_number',        label: 'Account number',  tab: 'Payments'   },
  { key: 'bank_account_name',          label: 'Account name',    tab: 'Payments'   },
  { key: 'tax_identifier',             label: 'IRD number',      tab: 'Tax'        },
  { key: 'tax_code',                   label: 'Tax code',        tab: 'Tax'        },
];

export function getMissingFields(emp, hasPaySettings) {
  const missing = REQUIRED_FIELDS.filter(f => !emp[f.key]);
  if (!hasPaySettings) missing.push({ key: 'pay_rate', label: 'Pay rate', tab: 'Pay Settings' });
  return missing;
}
