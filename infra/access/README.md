# Cloudflare Access

This directory keeps the Access application and policy shape as config without checked-in account IDs.

Apply the JSON payloads with the Cloudflare Zero Trust Access API after replacing every `REPLACE_WITH_*` token. Keep generated IDs and the application AUD in deployment secrets or Wrangler environment variables.

Required runtime values:

- `CLOUDFLARE_ACCESS_AUD`: Access application AUD from Cloudflare.
- `CLOUDFLARE_ACCESS_TEAM_DOMAIN`: team domain only, for example a real `<team>.cloudflareaccess.com` value in secrets.

API hook TODO:

- Add middleware in `apps/api` to verify `CF_Authorization` or `Cf-Access-Jwt-Assertion` against `https://<team-domain>/cdn-cgi/access/certs`.
- Enforce `aud` equals `CLOUDFLARE_ACCESS_AUD`.
- Return `401` before route handlers when the token is absent or invalid.
