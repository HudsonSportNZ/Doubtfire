-- Migration: Tenant Pay Items (NEW v0.3)
-- Tenant-level customisation of platform pay items.
-- Tenants can rename pay items (custom_name appears on payslips),
-- set a default_amount, and activate/deactivate items for their context.
-- Cannot create new item types — only customise existing platform types.
-- New types require a platform admin to add to pay_item_types first.

CREATE TABLE tenant_pay_items (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id),
  pay_item_type_id UUID         NOT NULL REFERENCES pay_item_types(id),
  custom_name      TEXT,                    -- overrides pay_item_types.name on payslips
  default_amount   DECIMAL(12,4),           -- pre-filled amount for this tenant (optional)
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, pay_item_type_id)
);

CREATE INDEX ON tenant_pay_items(tenant_id, is_active);
