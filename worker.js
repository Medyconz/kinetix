const SESSION_COOKIE = "kinetix_admin";
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
      if (url.pathname.startsWith("/media/")) return serveMedia(url, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error.status) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ error: String(error) }));
      return json({ error: "Something went wrong." }, 500);
    }
  },
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
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  if (request.method === "GET" && path === "/api/admin/summary") return adminSummary(env);
  if (request.method === "GET" && path === "/api/admin/activities") return json(await listActivities(env, true));
  if (request.method === "POST" && path === "/api/admin/activities") return upsertActivity(request, env);
  if (request.method === "DELETE" && path.startsWith("/api/admin/activities/")) return deleteRow(env, "activities", path.split("/").pop());
  if (request.method === "GET" && path === "/api/admin/products") return json(await listProducts(env, true));
  if (request.method === "POST" && path === "/api/admin/products") return upsertProduct(request, env);
  if (request.method === "DELETE" && path.startsWith("/api/admin/products/")) return deleteProduct(env, path.split("/").pop());
  if (request.method === "POST" && path === "/api/admin/products/image") return uploadProductImage(request, env);
  if (request.method === "GET" && path === "/api/admin/registrations") return json(await listRegistrations(env));
  if (request.method === "GET" && path === "/api/admin/bookings") return json(await listBookings(env));
  return json({ error: "Not found." }, 404);
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

async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD secret is not configured." }, 503);
  const body = await request.json();
  if (!(await secureCompare(String(body.password || ""), env.ADMIN_PASSWORD))) return json({ error: "Invalid password." }, 401);
  const ttl = parseInt(env.SESSION_TTL_SECONDS || "86400", 10);
  const payload = `admin.${Math.floor(Date.now() / 1000) + ttl}.${crypto.randomUUID()}`;
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
  return await secureCompare(signature, await sign(payload, env)) ? null : json({ error: "Invalid session." }, 401, clearCookie());
}

async function adminSummary(env) {
  assertDb(env);
  const [activities, products, registrations, bookings] = await Promise.all(["activities", "products", "registrations", "bookings"].map((table) => env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()));
  return json({ activities: activities.count, products: products.count, registrations: registrations.count, bookings: bookings.count });
}

async function upsertActivity(request, env) {
  assertDb(env);
  const b = await request.json();
  const id = clean(b.id, 80) || crypto.randomUUID();
  await env.DB.prepare("INSERT INTO activities (id,title,activity_date,activity_time,location,age_group,description,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title,activity_date=excluded.activity_date,activity_time=excluded.activity_time,location=excluded.location,age_group=excluded.age_group,description=excluded.description,is_active=excluded.is_active,updated_at=datetime('now')")
    .bind(id, required(b.title, "Title"), required(b.date, "Date"), required(b.time, "Time"), required(b.location, "Location"), required(b.ageGroup, "Age group"), clean(b.description, 1000), b.isActive === false ? 0 : 1).run();
  return json({ ok: true, id });
}

async function upsertProduct(request, env) {
  assertDb(env);
  const b = await request.json();
  const id = clean(b.id, 80) || crypto.randomUUID();
  const options = Array.isArray(b.options) ? b.options.map((x) => clean(x, 80)).filter(Boolean) : parseOptions(b.options);
  await env.DB.prepare("INSERT INTO products (id,name,description,price_label,option_label,options,image_key,sort_order,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,price_label=excluded.price_label,option_label=excluded.option_label,options=excluded.options,image_key=excluded.image_key,sort_order=excluded.sort_order,is_active=excluded.is_active,updated_at=datetime('now')")
    .bind(id, required(b.name, "Name"), clean(b.description, 1000), clean(b.priceLabel, 80) || "Price: TBA", clean(b.optionLabel, 80) || "Size / color", JSON.stringify(options), clean(b.imageKey, 300), parseInt(b.sortOrder || "0", 10) || 0, b.isActive === false ? 0 : 1).run();
  return json({ ok: true, id });
}

async function deleteRow(env, table, id) { assertDb(env); await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(required(id, "ID")).run(); return json({ ok: true }); }
async function deleteProduct(env, id) { return deleteRow(env, "products", id); }

async function uploadProductImage(request, env) {
  if (!env.PRODUCT_IMAGES) return json({ error: "PRODUCT_IMAGES R2 bucket is not configured." }, 503);
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !file.size) return json({ error: "Image file is required." }, 400);
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[file.type];
  if (!ext) return json({ error: "Upload a JPG, PNG, WebP, or GIF image." }, 400);
  const key = `products/${crypto.randomUUID()}.${ext}`;
  await env.PRODUCT_IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
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

async function listRegistrations(env) { assertDb(env); return (await env.DB.prepare("SELECT id,name,phone,activity_choice AS activityChoice,participants,notes,created_at AS createdAt FROM registrations ORDER BY created_at DESC").all()).results || []; }
async function listBookings(env) { assertDb(env); return (await env.DB.prepare("SELECT id,name,phone,session_type AS sessionType,preferred_date AS preferredDate,notes,created_at AS createdAt FROM bookings ORDER BY created_at DESC").all()).results || []; }
function assertDb(env) { if (!env.DB) throw Object.assign(new Error("D1 database binding DB is not configured."), { status: 503 }); }
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function required(value, label) { const text = clean(value, 300); if (!text) throw Object.assign(new Error(`${label} is required.`), { status: 400 }); return text; }
function parseOptions(value) { try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function getCookie(header, name) { return header.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`))?.slice(name.length + 1) || ""; }
function clearCookie() { return { "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }; }
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...extra } }); }
async function sign(payload, env) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))); }
async function secureCompare(a, b) { const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(a))), crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(b)))]); const xa = new Uint8Array(ha), xb = new Uint8Array(hb); let diff = xa.length ^ xb.length; for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ xb[i]; return diff === 0; }
function b64(buffer) { return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
