const SESSION_COOKIE = "kinetix_admin";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const PERMISSIONS = [
  "admin.export_backup_snapshot", "user.manage_admin_users", "user.grant_permission", "audit.view_log", "settings.edit_app_settings",
  "site.edit_content", "site.upload_media", "activity.view", "activity.edit", "activity.delete", "activity.export",
  "product.view", "product.edit", "product.delete", "product.upload_image", "product.export", "registration.view", "registration.export",
  "booking.view", "booking.export"
];
const ADMIN_RESOURCES = [
  { key: "overview", href: "overview", label: "Overview", navGroup: "home", kind: "dashboard", searchKeywords: ["dashboard", "status", "warnings"] },
  { key: "activities", href: "activities", label: "Activities", navGroup: "operations", kind: "collection", permission: "activity.view", searchKeywords: ["events", "sessions"], actions: [{ key: "new-activity", label: "New activity", href: "activities", permission: "activity.edit" }] },
  { key: "registrations", href: "registrations", label: "Registrations", navGroup: "operations", kind: "collection", permission: "registration.view", searchKeywords: ["participants", "activity database"], actions: [{ key: "export-registrations", label: "Export registrations", href: "registrations", permission: "registration.export" }] },
  { key: "products", href: "products", label: "Products", navGroup: "catalog", kind: "collection", permission: "product.view", searchKeywords: ["merch", "catalog", "images"], actions: [{ key: "new-product", label: "New product", href: "products", permission: "product.edit" }] },
  { key: "bookings", href: "bookings", label: "Bookings", navGroup: "operations", kind: "collection", permission: "booking.view", searchKeywords: ["coaching", "requests"], actions: [{ key: "export-bookings", label: "Export bookings", href: "bookings", permission: "booking.export" }] },
  { key: "audit", href: "audit", label: "Audit log", navGroup: "security", kind: "report", permission: "audit.view_log", searchKeywords: ["history", "security", "changes"] },
  { key: "backup", href: "backup", label: "Backup", navGroup: "security", kind: "workflow", permission: "admin.export_backup_snapshot", searchKeywords: ["snapshot", "export", "backup"] },
  { key: "settings", href: "settings", label: "Settings", navGroup: "settings", kind: "settings", permission: "settings.edit_app_settings", searchKeywords: ["permissions", "integrations", "configuration"] }
];
const BACKUP_TABLES = [
  { table: "activities", domain: "operations", note: "Public activity catalog" },
  { table: "products", domain: "catalog", note: "Merch catalog, image keys only" },
  { table: "registrations", domain: "operations", note: "Activity registrations" },
  { table: "bookings", domain: "operations", note: "Coaching booking requests" },
  { table: "app_settings", domain: "settings", note: "Secrets redacted by key name" },
  { table: "audit_logs", domain: "security", note: "Admin action history" }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
      if (url.pathname.startsWith("/media/")) return serveMedia(url, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error.status) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ message: "Unhandled Worker error", error: String(error) }));
      return json({ error: "Something went wrong." }, 500);
    }
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname;
  if (request.method === "GET" && path === "/api/activities") return json(await listActivities(env, false));
  if (request.method === "GET" && path === "/api/products") return json(await listProducts(env, false));
  if (request.method === "POST" && path === "/api/registrations") return createRegistration(request, env);
  if (request.method === "POST" && path === "/api/bookings") return createBooking(request, env);
  if (request.method === "POST" && path === "/api/admin/login") return adminLogin(request, env);
  if (request.method === "POST" && path === "/api/admin/logout") return json({ ok: true }, 200, clearCookie());
  if (!path.startsWith("/api/admin/")) return json({ error: "Not found." }, 404);

  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  if (request.method === "GET" && path === "/api/admin/me") return json(adminMe(env, admin));
  if (request.method === "GET" && path === "/api/admin/summary") return withPermission(env, admin, "activity.view", () => adminSummary(env));
  if (request.method === "GET" && path === "/api/admin/activities") return withPermission(env, admin, "activity.view", async () => json(await listActivities(env, true)));
  if (request.method === "POST" && path === "/api/admin/activities") return withPermission(env, admin, "activity.edit", () => upsertActivity(request, env, admin));
  if (request.method === "DELETE" && path.startsWith("/api/admin/activities/")) return withPermission(env, admin, "activity.delete", () => deleteActivity(env, admin, path.split("/").pop()));
  if (request.method === "GET" && path === "/api/admin/products") return withPermission(env, admin, "product.view", async () => json(await listProducts(env, true)));
  if (request.method === "POST" && path === "/api/admin/products") return withPermission(env, admin, "product.edit", () => upsertProduct(request, env, admin));
  if (request.method === "DELETE" && path.startsWith("/api/admin/products/")) return withPermission(env, admin, "product.delete", () => deleteProduct(env, admin, path.split("/").pop()));
  if (request.method === "POST" && path === "/api/admin/products/image") return withPermission(env, admin, "product.upload_image", () => uploadProductImage(request, env, admin));
  if (request.method === "GET" && path === "/api/admin/registrations") return withPermission(env, admin, "registration.view", () => listRegistrations(env, url));
  if (request.method === "GET" && path === "/api/admin/bookings") return withPermission(env, admin, "booking.view", () => listBookings(env, url));
  if (request.method === "GET" && path === "/api/admin/audit-logs") return withPermission(env, admin, "audit.view_log", () => listAuditLogs(env, url));
  if (request.method === "GET" && path === "/api/admin/registrations/export") return withPermission(env, admin, "registration.export", () => exportRows(env, admin, "registrations", url));
  if (request.method === "GET" && path === "/api/admin/bookings/export") return withPermission(env, admin, "booking.export", () => exportRows(env, admin, "bookings", url));
  if (request.method === "GET" && path === "/api/admin/audit-logs/export") return withPermission(env, admin, "audit.view_log", () => exportRows(env, admin, "audit_logs", url));
  if (request.method === "GET" && path === "/api/admin/backup/manifest") return withPermission(env, admin, "admin.export_backup_snapshot", () => json({ tables: BACKUP_TABLES }));
  if (request.method === "GET" && path === "/api/admin/backup/export") return withPermission(env, admin, "admin.export_backup_snapshot", () => exportBackup(env, admin));
  return json({ error: "Not found." }, 404);
}

function adminMe(env, admin) {
  const permissions = [...admin.permissions];
  const resources = filterResources(permissions);
  const warnings = [];
  if (!env.DB) warnings.push({ title: "D1 database missing", body: "Bind DB to enable live admin data, audit logs, exports, and backups." });
  if (!env.PRODUCT_IMAGES) warnings.push({ title: "R2 product images missing", body: "Bind PRODUCT_IMAGES to upload and serve product images." });
  if (!env.ADMIN_SESSION_SECRET) warnings.push({ title: "Session secret fallback", body: "Set ADMIN_SESSION_SECRET so sessions are signed separately from the login password." });
  return {
    user: { id: admin.actor, displayName: "Owner", role: "owner" },
    permissions,
    resources,
    warnings,
    integrations: [
      { label: "D1 database", status: env.DB ? "Connected" : "Missing DB binding" },
      { label: "R2 media bucket", status: env.PRODUCT_IMAGES ? "Connected" : "Missing PRODUCT_IMAGES binding" },
      { label: "Audit logging", status: env.DB ? "Enabled after migration" : "Waiting for D1" }
    ]
  };
}

function filterResources(permissions) {
  return ADMIN_RESOURCES.filter((resource) => !resource.permission || permissions.includes(resource.permission)).map((resource) => ({ ...resource, actions: (resource.actions || []).filter((action) => !action.permission || permissions.includes(action.permission)) }));
}

async function withPermission(env, admin, permission, run) {
  if (!admin.permissions.has(permission)) return json({ error: `Permission denied: ${permission}` }, 403);
  return run();
}

async function listActivities(env, includeHidden) {
  assertDb(env);
  const where = includeHidden ? "" : "WHERE is_active = 1";
  const rows = await env.DB.prepare(`SELECT id,title,activity_date AS date,activity_time AS time,location,age_group AS ageGroup,description,is_active AS isActive FROM activities ${where} ORDER BY activity_date, activity_time`).all();
  return rows.results || [];
}

async function listProducts(env, includeHidden) {
  assertDb(env);
  const where = includeHidden ? "" : "WHERE is_active = 1";
  const rows = await env.DB.prepare(`SELECT id,name,description,price_label AS priceLabel,option_label AS optionLabel,options,image_key AS imageKey,CASE WHEN image_key!='' THEN '/media/'||image_key ELSE '' END AS imageUrl,sort_order AS sortOrder,is_active AS isActive FROM products ${where} ORDER BY sort_order, created_at DESC`).all();
  return (rows.results || []).map((row) => ({ ...row, options: parseOptions(row.options) }));
}

async function createRegistration(request, env) {
  assertDb(env);
  const body = await request.json();
  await env.DB.prepare("INSERT INTO registrations (id,name,phone,activity_choice,participants,notes,created_at) VALUES (?,?,?,?,?,?,datetime('now'))")
    .bind(crypto.randomUUID(), required(body.name, "Name"), required(body.phone, "Phone"), required(body.activityChoice, "Activity choice"), Math.max(1, parseInt(body.participants || "1", 10) || 1), clean(body.notes, 1000)).run();
  return json({ ok: true, message: "Registration received." }, 201);
}

async function createBooking(request, env) {
  assertDb(env);
  const body = await request.json();
  await env.DB.prepare("INSERT INTO bookings (id,name,phone,session_type,preferred_date,notes,created_at) VALUES (?,?,?,?,?,?,datetime('now'))")
    .bind(crypto.randomUUID(), required(body.name, "Name"), required(body.phone, "Phone"), required(body.sessionType, "Session type"), required(body.preferredDate, "Preferred date"), clean(body.notes, 1000)).run();
  return json({ ok: true, message: "Booking request received." }, 201);
}

async function upsertActivity(request, env, admin) {
  assertDb(env);
  const b = await request.json();
  const id = clean(b.id, 80) || crypto.randomUUID();
  const before = await env.DB.prepare("SELECT * FROM activities WHERE id=?").bind(id).first();
  const after = { title: required(b.title, "Title"), activity_date: required(b.date, "Date"), activity_time: required(b.time, "Time"), location: required(b.location, "Location"), age_group: required(b.ageGroup, "Age group"), description: clean(b.description, 1000), is_active: b.isActive === false ? 0 : 1 };
  await env.DB.prepare("INSERT INTO activities (id,title,activity_date,activity_time,location,age_group,description,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title,activity_date=excluded.activity_date,activity_time=excluded.activity_time,location=excluded.location,age_group=excluded.age_group,description=excluded.description,is_active=excluded.is_active,updated_at=datetime('now')")
    .bind(id, after.title, after.activity_date, after.activity_time, after.location, after.age_group, after.description, after.is_active).run();
  await writeAudit(env, admin, before ? "activity.edit" : "activity.create", "activity", id, before, after, clean(b.reason, 300));
  return json({ ok: true, id });
}

async function upsertProduct(request, env, admin) {
  assertDb(env);
  const b = await request.json();
  const id = clean(b.id, 80) || crypto.randomUUID();
  const before = await env.DB.prepare("SELECT * FROM products WHERE id=?").bind(id).first();
  const options = Array.isArray(b.options) ? b.options.map((x) => clean(x, 80)).filter(Boolean) : parseOptions(b.options);
  const after = { name: required(b.name, "Name"), description: clean(b.description, 1000), price_label: clean(b.priceLabel, 80) || "Contact for pricing", option_label: clean(b.optionLabel, 80) || "Size / color", options: JSON.stringify(options), image_key: clean(b.imageKey, 300), sort_order: parseInt(b.sortOrder || "0", 10) || 0, is_active: b.isActive === false ? 0 : 1 };
  await env.DB.prepare("INSERT INTO products (id,name,description,price_label,option_label,options,image_key,sort_order,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,price_label=excluded.price_label,option_label=excluded.option_label,options=excluded.options,image_key=excluded.image_key,sort_order=excluded.sort_order,is_active=excluded.is_active,updated_at=datetime('now')")
    .bind(id, after.name, after.description, after.price_label, after.option_label, after.options, after.image_key, after.sort_order, after.is_active).run();
  await writeAudit(env, admin, before ? "product.edit" : "product.create", "product", id, before, after, clean(b.reason, 300));
  return json({ ok: true, id });
}

async function deleteActivity(env, admin, id) { return deleteRow(env, admin, "activities", "activity.delete", "activity", id); }
async function deleteProduct(env, admin, id) { return deleteRow(env, admin, "products", "product.delete", "product", id); }
async function deleteRow(env, admin, table, action, entityType, id) {
  assertDb(env);
  const before = await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(required(id, "ID")).first();
  await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
  await writeAudit(env, admin, action, entityType, id, before, null, "Deleted from admin UI");
  return json({ ok: true });
}

async function listRegistrations(env, url) { return listPaged(env, "registrations", "SELECT id,name,phone,activity_choice AS activityChoice,participants,notes,created_at AS createdAt FROM registrations", "name || ' ' || phone || ' ' || activity_choice || ' ' || ifnull(notes,'')", url); }
async function listBookings(env, url) { return listPaged(env, "bookings", "SELECT id,name,phone,session_type AS sessionType,preferred_date AS preferredDate,notes,created_at AS createdAt FROM bookings", "name || ' ' || phone || ' ' || session_type || ' ' || ifnull(notes,'')", url); }
async function listAuditLogs(env, url) { return listPaged(env, "audit_logs", "SELECT id,action,actor,entity_type AS entityType,entity_id AS entityId,reason,created_at AS createdAt FROM audit_logs", "action || ' ' || entity_type || ' ' || entity_id || ' ' || ifnull(reason,'')", url); }

async function listPaged(env, table, selectSql, searchExpr, url) {
  assertDb(env);
  const q = clean(url.searchParams.get("q"), 200);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const perPage = Math.min(200, Math.max(1, parseInt(url.searchParams.get("perPage") || "25", 10) || 25));
  const where = q ? `WHERE ${searchExpr} LIKE ?` : "";
  const like = `%${q.replace(/[%_]/g, "")} %`.replace(" ", "");
  const countStmt = env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table} ${where}`);
  const rowsStmt = env.DB.prepare(`${selectSql} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
  const count = q ? await countStmt.bind(like).first() : await countStmt.first();
  const rows = q ? await rowsStmt.bind(like, perPage, (page - 1) * perPage).all() : await rowsStmt.bind(perPage, (page - 1) * perPage).all();
  return json({ rows: rows.results || [], total: count?.count || 0, page, perPage });
}

async function exportRows(env, admin, table, url) {
  assertDb(env);
  const map = {
    registrations: { permission: "registration.export", action: "registration.export", sql: "SELECT name,phone,activity_choice AS activity,participants,notes,created_at AS created FROM registrations ORDER BY created_at DESC" },
    bookings: { permission: "booking.export", action: "booking.export", sql: "SELECT name,phone,session_type AS session,preferred_date AS preferred_date,notes,created_at AS created FROM bookings ORDER BY created_at DESC" },
    audit_logs: { permission: "audit.view_log", action: "audit.export", sql: "SELECT action,actor,entity_type,entity_id,reason,created_at AS created FROM audit_logs ORDER BY created_at DESC" }
  };
  const spec = map[table];
  const rows = (await env.DB.prepare(spec.sql).all()).results || [];
  await writeAudit(env, admin, spec.action, table, "export", null, { rows: rows.length }, clean(url.searchParams.get("reason"), 300));
  return csvResponse(rows, `${table}.csv`);
}

async function exportBackup(env, admin) {
  assertDb(env);
  const manifest = [];
  const data = {};
  for (const item of BACKUP_TABLES) {
    const rows = (await env.DB.prepare(`SELECT * FROM ${item.table} LIMIT 5000`).all()).results || [];
    data[item.table] = rows.map((row) => redactRow(item.table, row));
    manifest.push({ ...item, rowCount: rows.length, exportedRowCount: rows.length, truncated: rows.length >= 5000 });
  }
  await writeAudit(env, admin, "admin.export_backup_snapshot", "backup", "snapshot", null, { tables: manifest.length, rows: manifest.reduce((sum, row) => sum + row.exportedRowCount, 0) }, "Owner backup export");
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), manifest, data }, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="kinetix-backup-${dateStamp()}.json"`, "cache-control": "no-store" } });
}

async function uploadProductImage(request, env, admin) {
  if (!env.PRODUCT_IMAGES) return json({ error: "PRODUCT_IMAGES R2 bucket is not configured." }, 503);
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !file.size) return json({ error: "Image file is required." }, 400);
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[file.type];
  if (!ext) return json({ error: "Upload a JPG, PNG, WebP, or GIF image." }, 400);
  const key = `products/${crypto.randomUUID()}.${ext}`;
  await env.PRODUCT_IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await writeAudit(env, admin, "product.upload_image", "product_image", key, null, { contentType: file.type, size: file.size }, "Uploaded product image");
  return json({ ok: true, imageKey: key, imageUrl: `/media/${key}` }, 201);
}

async function serveMedia(url, env) {
  if (!env.PRODUCT_IMAGES) return new Response("Media storage not configured.", { status: 503 });
  const key = decodeURIComponent(url.pathname.replace(/^\/media\//, ""));
  const object = await env.PRODUCT_IMAGES.get(key);
  if (!object) return new Response("Not found.", { status: 404 });
  const headers = new Headers({ "cache-control": "public, max-age=31536000, immutable" });
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}

async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD secret is not configured." }, 503);
  const body = await request.json();
  if (!(await secureCompare(String(body.password || ""), env.ADMIN_PASSWORD))) return json({ error: "Invalid password." }, 401);
  const ttl = parseInt(env.SESSION_TTL_SECONDS || "86400", 10);
  const payload = `owner.${Math.floor(Date.now() / 1000) + ttl}.${crypto.randomUUID()}`;
  const cookie = `${SESSION_COOKIE}=${payload}.${await sign(payload, env)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
  return json({ ok: true }, 200, { "set-cookie": cookie });
}

async function requireAdmin(request, env) {
  const cookie = getCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!cookie) return json({ error: "Admin login required." }, 401);
  const parts = cookie.split(".");
  const signature = parts.pop();
  const payload = parts.join(".");
  if (Number(parts[1]) < Math.floor(Date.now() / 1000)) return json({ error: "Session expired." }, 401, clearCookie());
  if (!(await secureCompare(signature, await sign(payload, env)))) return json({ error: "Invalid session." }, 401, clearCookie());
  return { actor: parts[0] || "owner", permissions: new Set(PERMISSIONS) };
}

async function adminSummary(env) {
  assertDb(env);
  const tables = ["activities", "products", "registrations", "bookings"];
  const counts = await Promise.all(tables.map((table) => env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()));
  return json(Object.fromEntries(tables.map((table, index) => [table, counts[index].count])));
}

async function writeAudit(env, admin, action, entityType, entityId, beforeState, afterState, reason) {
  if (!env.DB) return;
  try {
    await env.DB.prepare("INSERT INTO audit_logs (id,action,actor,entity_type,entity_id,before_state,after_state,reason,created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))")
      .bind(crypto.randomUUID(), action, admin.actor, entityType, entityId, jsonString(beforeState), jsonString(afterState), clean(reason, 500)).run();
  } catch (error) {
    console.error(JSON.stringify({ message: "Audit write failed", error: String(error) }));
  }
}

function csvResponse(rows, filename) {
  const keys = Object.keys(rows[0] || { empty: "" });
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" } });
}
function redactRow(table, row) { const out = { ...row }; if (table === "app_settings" && /secret|token|password|key/i.test(String(out.key))) out.value = "[redacted]"; return out; }
function assertDb(env) { if (!env.DB) throw Object.assign(new Error("D1 database binding DB is not configured."), { status: 503 }); }
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function required(value, label) { const text = clean(value, 300); if (!text) throw Object.assign(new Error(`${label} is required.`), { status: 400 }); return text; }
function parseOptions(value) { try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function jsonString(value) { return value == null ? "" : JSON.stringify(value); }
function getCookie(header, name) { return header.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`))?.slice(name.length + 1) || ""; }
function clearCookie() { return { "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }; }
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } }); }
function dateStamp() { return new Date().toISOString().slice(0, 10); }
async function sign(payload, env) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))); }
async function secureCompare(a, b) { const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(a))), crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(b)))]); const xa = new Uint8Array(ha), xb = new Uint8Array(hb); let diff = xa.length ^ xb.length; for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ xb[i]; return diff === 0; }
function b64(buffer) { return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
