CREATE TABLE IF NOT EXISTS managed_sites (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	domain TEXT NOT NULL,
	description TEXT,
	status TEXT NOT NULL DEFAULT 'active',
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_credentials (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	auth_kind TEXT NOT NULL,
	label TEXT NOT NULL,
	encrypted_secret_ref TEXT,
	masked_preview TEXT,
	status TEXT NOT NULL DEFAULT 'active',
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (site_id) REFERENCES managed_sites(id)
);

CREATE TABLE IF NOT EXISTS site_access_grants (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	credential_id TEXT,
	scope TEXT NOT NULL,
	permission TEXT NOT NULL,
	resource TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (site_id) REFERENCES managed_sites(id),
	FOREIGN KEY (credential_id) REFERENCES site_credentials(id)
);

CREATE TABLE IF NOT EXISTS site_endpoints (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	label TEXT NOT NULL,
	method TEXT NOT NULL,
	path TEXT NOT NULL,
	purpose TEXT NOT NULL,
	requires_auth INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (site_id) REFERENCES managed_sites(id)
);

CREATE TABLE IF NOT EXISTS site_admin_links (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	label TEXT NOT NULL,
	url TEXT NOT NULL,
	category TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (site_id) REFERENCES managed_sites(id)
);

CREATE TABLE IF NOT EXISTS site_capabilities (
	id TEXT PRIMARY KEY,
	site_id TEXT NOT NULL,
	capability TEXT NOT NULL,
	enabled INTEGER NOT NULL DEFAULT 1,
	metadata_json TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (site_id) REFERENCES managed_sites(id)
);

ALTER TABLE connectors ADD COLUMN managed_site_id TEXT;

CREATE INDEX IF NOT EXISTS idx_site_credentials_site_id ON site_credentials(site_id);
CREATE INDEX IF NOT EXISTS idx_site_access_grants_site_id ON site_access_grants(site_id);
CREATE INDEX IF NOT EXISTS idx_site_endpoints_site_id ON site_endpoints(site_id);
CREATE INDEX IF NOT EXISTS idx_site_admin_links_site_id ON site_admin_links(site_id);
CREATE INDEX IF NOT EXISTS idx_site_capabilities_site_id ON site_capabilities(site_id);
