-- Migration: Tenant Jurisdictions
-- A tenant may operate in one or both jurisdictions (NZ and/or AU).
-- Stores the legal entity details per jurisdiction.

CREATE TABLE tenant_jurisdictions (
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  jurisdiction      TEXT NOT NULL REFERENCES jurisdictions(code),
  legal_entity_name TEXT,
  tax_id            TEXT,                       -- NZBN (NZ) or ABN (AU) — encrypted at app layer
  PRIMARY KEY (tenant_id, jurisdiction)
);
