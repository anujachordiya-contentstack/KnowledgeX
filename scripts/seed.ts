import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

const AuthorSchema = new mongoose.Schema(
  { id: String, name: String, avatarUrl: String },
  { _id: false }
);
const TopicSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: String, summary: String, category: String,
  difficulty: String, tags: [String], readingTime: Number,
  upvoteCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  author: AuthorSchema, publishedAt: Date,
  trendingScore: { type: Number, default: 0 },
  status: { type: String, default: "published" },
  body: { type: mongoose.Schema.Types.Mixed, default: [] },
});

const SEED_TOPICS = [
  {
    slug: "http-caching-explained",
    title: "HTTP Caching Explained",
    summary: "Deep dive into Cache-Control headers, ETags, and how browsers and CDNs decide what to store.",
    category: "Caching", difficulty: "intermediate",
    tags: ["HTTP", "Cache-Control", "CDN", "ETag"],
    readingTime: 8, upvoteCount: 142, viewCount: 1840,
    author: { id: "u1", name: "Priya Sharma", avatarUrl: "" },
    publishedAt: new Date("2026-05-20"), trendingScore: 95, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Every time a browser or CDN serves a cached response instead of hitting your origin server, you save latency, bandwidth, and money. HTTP caching is controlled entirely through response headers — no client-side code required." },
      { type: "text", heading: "Cache-Control Directives", content: "The Cache-Control header is the primary lever. The most important directives are max-age (how long a response is fresh), no-cache (revalidate with the server before serving), no-store (never cache at all), and stale-while-revalidate (serve stale while fetching fresh in the background)." },
      { type: "code", heading: "Setting Cache-Control in Node.js/Express", code: { language: "javascript", snippet: `// Cache a static asset for 1 year (immutable = never revalidate)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// Cache an API response for 60s, allow stale for 30s while revalidating
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');

// Never cache sensitive data (auth pages, dashboards)
res.setHeader('Cache-Control', 'no-store');`, caption: "Express.js — setting cache headers per route" } },
      { type: "text", heading: "ETags and Conditional Requests", content: "An ETag is a fingerprint of the response body (usually a hash). When a cached response expires, the browser sends If-None-Match: <etag> with the request. If the content hasn't changed, the server replies 304 Not Modified with no body — saving bandwidth while still validating freshness." },
      { type: "code", code: { language: "http", snippet: `# First request — server responds with ETag
HTTP/1.1 200 OK
Cache-Control: max-age=300
ETag: "abc123"

# After max-age expires, browser revalidates
GET /api/data HTTP/1.1
If-None-Match: "abc123"

# Content unchanged — server saves bandwidth
HTTP/1.1 304 Not Modified`, caption: "ETag revalidation flow" } },
      { type: "text", heading: "stale-while-revalidate", content: "This is one of the best cache strategies for APIs. It lets you serve a stale (expired) response immediately for a good user experience, while silently fetching a fresh copy in the background. The next request gets the fresh copy." },
      { type: "list", heading: "Common Pitfalls", items: [
        "Using no-cache when you mean no-store — no-cache still caches, it just always revalidates",
        "Caching authenticated responses publicly — always use Cache-Control: private for user-specific data",
        "Not setting Vary: Accept-Encoding — CDNs will serve gzipped content to clients that don't support it",
        "Forgetting to bust cache on deploys — use content hashes in filenames for static assets",
      ]},
      { type: "note", content: "For static assets (JS, CSS, images), use max-age=31536000, immutable combined with content-hashed filenames like main.a3f9c2.js. This gives you permanent caching with instant invalidation on deploy." },
    ],
  },
  {
    slug: "jwt-vs-session-auth",
    title: "JWT vs Session-based Authentication",
    summary: "When should you use JWTs and when are server-side sessions the better choice?",
    category: "Security", difficulty: "intermediate",
    tags: ["JWT", "OAuth", "Sessions", "Auth"],
    readingTime: 10, upvoteCount: 218, viewCount: 3200,
    author: { id: "u2", name: "Arjun Mehta", avatarUrl: "" },
    publishedAt: new Date("2026-05-18"), trendingScore: 88, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Authentication has two dominant patterns: server-side sessions (stateful) and JWTs (stateless). Neither is universally better — the right choice depends on your architecture, scale, and security requirements." },
      { type: "text", heading: "How Session-Based Auth Works", content: "When a user logs in, the server creates a session record in a store (Redis, database) and returns a session ID in a cookie. On every subsequent request, the server looks up the session ID to verify identity. The server holds the truth — revocation is instant." },
      { type: "code", heading: "Session Auth with Express + Redis", code: { language: "javascript", snippet: `import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // not accessible via JS
    secure: true,     // HTTPS only
    sameSite: 'lax',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Login route
app.post('/login', async (req, res) => {
  const user = await verifyCredentials(req.body);
  req.session.userId = user.id;   // stored in Redis
  res.json({ ok: true });
});`, caption: "Server-side sessions with Redis" } },
      { type: "text", heading: "How JWT Auth Works", content: "A JWT is a self-contained token — it carries the user's identity as a signed payload. The server issues it on login and never stores it. Every request includes the JWT; the server only needs to verify the signature. No DB lookup required for auth." },
      { type: "code", heading: "JWT Auth with Node.js", code: { language: "javascript", snippet: `import jwt from 'jsonwebtoken';

// On login — issue access + refresh tokens
app.post('/login', async (req, res) => {
  const user = await verifyCredentials(req.body);

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // short-lived!
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  // Refresh token in HttpOnly cookie, access token in response body
  res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true });
  res.json({ accessToken });
});

// Middleware to verify JWT on protected routes
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.user = payload;
  next();
}`, caption: "JWT with refresh token pattern" } },
      { type: "list", heading: "Sessions vs JWTs — When to Use Each", items: [
        "Use sessions when: you need instant revocation (logout, ban a user), monolith or single server, users store sensitive roles that change frequently",
        "Use JWTs when: microservices where multiple services need to verify identity without a shared session store, mobile apps, third-party API access",
        "Use JWTs with short expiry (15 min) + refresh tokens — never long-lived JWTs",
        "Never store JWTs in localStorage — XSS can steal them. Use HttpOnly cookies for refresh tokens",
      ]},
      { type: "warning", content: "A major JWT gotcha: you cannot revoke a JWT before it expires. If a user changes their password or is banned, the old JWT is still valid until expiry. Mitigate this with short access token TTLs (≤15 min) and a token blocklist in Redis for immediate revocation when needed." },
    ],
  },
  {
    slug: "how-dns-works",
    title: "How DNS Works — From Browser to IP",
    summary: "Walk through what actually happens when you type a URL. Recursive resolvers, authoritative servers, TTLs.",
    category: "Networking", difficulty: "beginner",
    tags: ["DNS", "TCP/IP", "Resolvers", "TTL"],
    readingTime: 6, upvoteCount: 305, viewCount: 4500,
    author: { id: "u3", name: "Lena Fischer", avatarUrl: "" },
    publishedAt: new Date("2026-05-15"), trendingScore: 110, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "DNS (Domain Name System) is the internet's phone book. When you type google.com into a browser, your computer has no idea what IP address that maps to. DNS resolves human-readable names into the IP addresses machines actually route to." },
      { type: "text", heading: "The Resolution Chain", content: "DNS resolution involves four actors: the DNS recursor (usually your ISP or 8.8.8.8), the root nameserver, the TLD nameserver (.com, .org etc.), and the authoritative nameserver for your domain. Think of it as asking progressively more specific librarians." },
      { type: "code", heading: "Step-by-step: resolving api.example.com", code: { language: "bash", snippet: `# 1. Browser checks its own cache first (from previous visits)
# 2. OS checks /etc/hosts and its local DNS cache
# 3. Query goes to your configured recursive resolver (e.g. 8.8.8.8)
# 4. Resolver asks a Root Nameserver: "who handles .com?"
#    Root NS replies: "ask the .com TLD nameserver at 192.5.6.30"
# 5. Resolver asks .com TLD NS: "who handles example.com?"
#    TLD NS replies: "ask ns1.example.com at 205.251.196.1"
# 6. Resolver asks ns1.example.com: "what's the IP for api.example.com?"
#    Authoritative NS replies: "it's 93.184.216.34, TTL=300"
# 7. Resolver caches the result for 300 seconds and returns it

# You can trace this yourself with dig
dig +trace api.example.com`, caption: "DNS resolution chain" } },
      { type: "text", heading: "TTL — Time To Live", content: "Every DNS record has a TTL value in seconds. It tells resolvers how long to cache the answer. A TTL of 300 means \"re-ask the authoritative server every 5 minutes\". Low TTL = faster propagation of changes but more DNS queries. High TTL = faster lookups but slow to update." },
      { type: "code", heading: "Common DNS Record Types", code: { language: "bash", snippet: `# A record — domain to IPv4
example.com.    300  IN  A     93.184.216.34

# AAAA record — domain to IPv6
example.com.    300  IN  AAAA  2606:2800:220:1:248:1893:25c8:1946

# CNAME — alias to another domain (CDN use case)
www.example.com. 300 IN  CNAME example.com.

# MX — mail server
example.com.    300  IN  MX    10 mail.example.com.

# TXT — arbitrary text (used for domain verification, SPF, DKIM)
example.com.    300  IN  TXT   "v=spf1 include:_spf.google.com ~all"

# Dig a specific record type
dig example.com A
dig example.com MX`, caption: "DNS record types" } },
      { type: "list", heading: "Why DNS Propagation Takes Time", items: [
        "When you change a DNS record, you update the authoritative nameserver instantly",
        "But every resolver worldwide caches the OLD record for its remaining TTL",
        "A record with TTL=86400 (24h) takes up to 24h to propagate everywhere",
        "Before changing DNS, lower your TTL to 60–300 seconds 24h in advance, then make the change",
      ]},
      { type: "note", content: "Use dig +trace yourdomain.com to walk the full DNS resolution chain from root servers down. It's the best tool for debugging DNS issues and understanding exactly where a lookup is failing." },
    ],
  },
  {
    slug: "cdn-architecture",
    title: "CDN Architecture & Edge Caching",
    summary: "How CDNs distribute content globally, push vs pull CDNs, and origin shields.",
    category: "Infrastructure", difficulty: "advanced",
    tags: ["CDN", "Edge", "Caching", "Infrastructure"],
    readingTime: 12, upvoteCount: 87, viewCount: 1100,
    author: { id: "u4", name: "Marcus Lee", avatarUrl: "" },
    publishedAt: new Date("2026-05-22"), trendingScore: 60, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "A CDN (Content Delivery Network) is a globally distributed network of servers called Points of Presence (PoPs). When a user requests content, it's served from the PoP geographically closest to them — dramatically reducing latency compared to hitting a single origin server." },
      { type: "text", heading: "Pull CDN vs Push CDN", content: "Pull CDNs (Cloudflare, CloudFront) fetch content from your origin on the first request, then cache it at the edge for subsequent requests. Push CDNs (BunnyCDN Storage, older Akamai) require you to upload content to them proactively. Pull is simpler for dynamic content; push suits large static assets like video files." },
      { type: "code", heading: "Pull CDN — How Edge Caching Works", code: { language: "http", snippet: `# First request to CDN edge (cache MISS)
GET /images/hero.jpg HTTP/1.1
Host: cdn.example.com

# CDN forwards to origin, caches response
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400
CF-Cache-Status: MISS   ← Cloudflare cache miss header

# Second request (cache HIT — served from edge in ~5ms)
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400
CF-Cache-Status: HIT
Age: 3600   ← cached 1 hour ago`, caption: "CDN pull caching flow" } },
      { type: "text", heading: "Origin Shield", content: "Without an origin shield, a cache miss at every PoP worldwide results in N requests hitting your origin (where N = number of PoPs). An origin shield adds a single intermediate caching layer between all PoPs and your origin. Cache misses collapse into one request to the shield, which then queries origin." },
      { type: "code", heading: "CloudFront Origin Shield Configuration", code: { language: "json", snippet: `{
  "Origins": [{
    "DomainName": "api.example.com",
    "OriginShield": {
      "Enabled": true,
      "OriginShieldRegion": "us-east-1"
    }
  }],
  "DefaultCacheBehavior": {
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "ViewerProtocolPolicy": "redirect-to-https"
  }
}`, caption: "CloudFront distribution with origin shield" } },
      { type: "list", heading: "Cache Invalidation Strategies", items: [
        "URL-based invalidation: POST /2020-11-01/distributions/{id}/invalidation with paths — expensive at scale",
        "Versioned URLs: /assets/app.v3.js — deploy new URL, old URL expires naturally via TTL",
        "Surrogate keys (Fastly/Cloudflare): tag responses with Cache-Tag: product-123, invalidate by tag",
        "Soft purge + stale-while-revalidate: mark as stale but keep serving while CDN fetches fresh copy",
      ]},
      { type: "warning", content: "CDN cache invalidation is eventually consistent — it takes seconds to minutes to propagate a purge to all edge nodes. Never rely on instant invalidation for security-sensitive content. Use short TTLs or signed URLs for content that must expire immediately." },
    ],
  },
  {
    slug: "edge-functions-explained",
    title: "Edge Functions: What They Are and When to Use Them",
    summary: "Edge functions run your code at CDN PoPs. Comparing Cloudflare Workers, Vercel Edge, and Deno Deploy.",
    category: "Infrastructure", difficulty: "intermediate",
    tags: ["Edge", "Cloudflare Workers", "Vercel", "Serverless"],
    readingTime: 9, upvoteCount: 134, viewCount: 2100,
    author: { id: "u5", name: "Sofia Rossi", avatarUrl: "" },
    publishedAt: new Date("2026-05-21"), trendingScore: 78, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Edge functions are JavaScript/TypeScript functions that run at CDN PoPs — not in a central data center, but in 200+ locations worldwide. The result: sub-10ms cold starts and response times close to the user's location. They use the V8 isolate model, not full Node.js, which means no filesystem access, limited globals, and different APIs." },
      { type: "text", heading: "V8 Isolates vs Traditional Serverless", content: "Traditional serverless (AWS Lambda) spins up a container — 100ms+ cold start, full Linux environment. Edge functions use V8 isolates, which are lightweight JavaScript contexts that start in under 1ms. The trade-off: no native modules, no fs, no arbitrary npm packages that require Node.js built-ins." },
      { type: "code", heading: "Cloudflare Worker — A/B Testing at the Edge", code: { language: "javascript", snippet: `// Assign users to A/B variants at the edge — no origin roundtrip
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Read or assign variant from cookie
    const cookie = request.headers.get('Cookie') || '';
    let variant = cookie.match(/ab_variant=(\\w+)/)?.[1];

    if (!variant) {
      variant = Math.random() < 0.5 ? 'control' : 'treatment';
    }

    // Rewrite URL based on variant
    if (variant === 'treatment') {
      url.pathname = '/v2' + url.pathname;
    }

    const response = await fetch(url.toString(), request);

    // Set cookie so same user always gets same variant
    const newResponse = new Response(response.body, response);
    newResponse.headers.append('Set-Cookie',
      \`ab_variant=\${variant}; Path=/; Max-Age=86400\`);

    return newResponse;
  },
};`, caption: "Cloudflare Worker — A/B routing at edge" } },
      { type: "code", heading: "Vercel Edge Middleware — Geo-based Redirects", code: { language: "typescript", snippet: `// middleware.ts — runs at edge before every request
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.geo?.country ?? 'US';
  const { pathname } = request.nextUrl;

  // Redirect EU users to GDPR-compliant subdomain
  if (['DE', 'FR', 'IT', 'ES'].includes(country) && !pathname.startsWith('/eu')) {
    return NextResponse.redirect(
      new URL('/eu' + pathname, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};`, caption: "Next.js Edge Middleware — geo routing" } },
      { type: "list", heading: "Good Use Cases vs Bad Use Cases", items: [
        "✅ Good: Auth token validation, A/B testing, geo-based redirects, rate limiting, request/response transformation",
        "✅ Good: Personalised cache keys, bot detection, feature flags",
        "❌ Bad: Database queries (no persistent connections at edge), heavy computation, file uploads",
        "❌ Bad: Anything requiring Node.js built-ins (crypto, fs, child_process) without a polyfill",
      ]},
      { type: "note", content: "Cloudflare Workers offer the most capable edge runtime — full fetch API, KV storage, Durable Objects, R2. Vercel Edge Middleware is simpler but limited to request/response transformation. Choose based on how much logic you need to run." },
    ],
  },
  {
    slug: "sql-vs-nosql",
    title: "SQL vs NoSQL — Choosing the Right Database",
    summary: "A practical guide to picking between relational and document databases.",
    category: "Databases", difficulty: "beginner",
    tags: ["SQL", "MongoDB", "PostgreSQL", "NoSQL"],
    readingTime: 7, upvoteCount: 196, viewCount: 2800,
    author: { id: "u6", name: "Rahul Gupta", avatarUrl: "" },
    publishedAt: new Date("2026-05-12"), trendingScore: 72, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "SQL databases store data in rigid tables with predefined schemas. NoSQL databases store data as documents, key-value pairs, graphs, or wide columns — with flexible schemas. The right choice depends on your data shape, consistency requirements, and query patterns — not on what's trendy." },
      { type: "text", heading: "SQL — Relational Model", content: "In a relational database, data is normalised into tables. Relationships are enforced via foreign keys. ACID transactions guarantee that multi-table writes either all succeed or all fail. This makes SQL ideal for financial data, inventory, anything where consistency is critical." },
      { type: "code", heading: "SQL — E-commerce order with JOIN", code: { language: "sql", snippet: `-- Normalised tables
CREATE TABLE users    (id SERIAL PRIMARY KEY, email TEXT UNIQUE, name TEXT);
CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price NUMERIC, stock INT);
CREATE TABLE orders   (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), created_at TIMESTAMPTZ);
CREATE TABLE order_items (
  order_id   INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity   INT,
  unit_price NUMERIC
);

-- Fetch order with all line items and product names
SELECT o.id, u.name, p.name AS product, oi.quantity, oi.unit_price
FROM orders o
JOIN users u        ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
WHERE o.id = 1001;`, caption: "PostgreSQL — normalised e-commerce schema" } },
      { type: "text", heading: "NoSQL — Document Model", content: "MongoDB stores data as JSON-like documents. Related data is embedded directly in a document rather than spread across tables. This makes reads fast (one document fetch vs multiple JOINs) but updates more complex when embedded data changes." },
      { type: "code", heading: "MongoDB — Same order as a document", code: { language: "javascript", snippet: `// Denormalised — entire order in one document
// One read, no joins
db.orders.insertOne({
  _id: ObjectId("..."),
  user: { id: "u42", name: "Alice", email: "alice@example.com" },
  items: [
    { productId: "p1", name: "Keyboard", quantity: 1, unitPrice: 129.99 },
    { productId: "p2", name: "Mouse",    quantity: 2, unitPrice: 49.99  },
  ],
  total: 229.97,
  status: "shipped",
  createdAt: new Date("2026-05-01"),
});

// Single document fetch — no joins needed
const order = await db.collection('orders').findOne({ _id: orderId });`, caption: "MongoDB — denormalised order document" } },
      { type: "list", heading: "Decision Guide", items: [
        "Use SQL when: data is highly relational, you need multi-table ACID transactions, schema is stable, complex analytical queries (GROUP BY, window functions)",
        "Use MongoDB when: document shape varies per record, you're embedding related data for fast reads, rapid schema iteration during early development",
        "Use both: many production systems use PostgreSQL for transactional data + MongoDB (or Redis) for flexible/fast-read data",
        "Never choose NoSQL just for 'scale' — PostgreSQL scales to hundreds of millions of rows with proper indexing",
      ]},
    ],
  },
  {
    slug: "react-server-components",
    title: "React Server Components — Mental Model",
    summary: "RSCs change how you think about data fetching in React. What runs on the server, what on the client, and why.",
    category: "Frontend", difficulty: "advanced",
    tags: ["React", "RSC", "Next.js", "SSR"],
    readingTime: 14, upvoteCount: 251, viewCount: 3900,
    author: { id: "u7", name: "Yuki Tanaka", avatarUrl: "" },
    publishedAt: new Date("2026-05-10"), trendingScore: 82, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "React Server Components (RSC) let individual components run only on the server — they can fetch data directly, access databases, and use server-only secrets, all without shipping any JavaScript to the browser. This is a fundamentally different mental model from the previous useEffect+fetch pattern." },
      { type: "text", heading: "The Component Tree Model", content: "In Next.js App Router, every component is a Server Component by default. Adding 'use client' at the top of a file marks it and all its imports as client components. The rule: client components cannot import server components. But server components can render client components as children." },
      { type: "code", heading: "Server Component — direct DB fetch", code: { language: "typescript", snippet: `// app/dashboard/page.tsx — Server Component (default)
// No 'use client' directive = runs only on server
// Can use async/await, access DB directly, read env secrets

import { db } from '@/lib/db';

export default async function DashboardPage() {
  // Direct database query — zero client JS, zero loading state
  const stats = await db.collection('stats').findOne({ userId: 'u1' });
  const recentOrders = await db.collection('orders')
    .find({ userId: 'u1' })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return (
    <div>
      <StatsDisplay stats={stats} />       {/* Server Component */}
      <InteractiveChart data={recentOrders} /> {/* Client Component */}
    </div>
  );
}`, caption: "Async Server Component with direct DB access" } },
      { type: "code", heading: "Client Component — interactivity only", code: { language: "typescript", snippet: `// components/InteractiveChart.tsx
'use client'; // marks this + all imports as client-side

import { useState } from 'react';

// Props are serialised from server → client (must be JSON-serialisable)
interface Props {
  data: { date: string; amount: number }[];
}

export function InteractiveChart({ data }: Props) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const filtered = data.filter(d =>
    new Date(d.date) > subDays(new Date(), { '7d': 7, '30d': 30, '90d': 90 }[range])
  );

  return (
    <div>
      <RangePicker value={range} onChange={setRange} />
      <LineChart data={filtered} />
    </div>
  );
}`, caption: "Client Component — receives serialised data from server" } },
      { type: "list", heading: "The Four Rules to Memorise", items: [
        "Server Components can: fetch data, read files, access secrets, import server-only packages",
        "Client Components can: use useState, useEffect, event handlers, browser APIs",
        "Client Components CANNOT import Server Components (but can receive them as children props)",
        "Props crossing the server→client boundary must be JSON-serialisable — no functions, no class instances, no Date objects (use .toISOString())",
      ]},
      { type: "warning", content: "A common mistake: adding 'use client' to a layout or page component to use useState — this forces the entire subtree to the client. Instead, extract only the interactive part into a small Client Component and keep everything else as Server Components." },
    ],
  },
  {
    slug: "oauth2-pkce-flow",
    title: "OAuth 2.0 PKCE Flow for SPAs",
    summary: "Why the implicit grant is dead and how PKCE protects public clients.",
    category: "Security", difficulty: "advanced",
    tags: ["OAuth", "PKCE", "SPA", "Auth"],
    readingTime: 11, upvoteCount: 178, viewCount: 2200,
    author: { id: "u2", name: "Arjun Mehta", avatarUrl: "" },
    publishedAt: new Date("2026-05-08"), trendingScore: 55, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "The OAuth 2.0 implicit grant was designed for SPAs in 2012, but it returns the access token directly in the URL fragment — visible in browser history and server logs. PKCE (Proof Key for Code Exchange, pronounced 'pixie') solves this by replacing the implicit grant with a secure authorisation code flow for public clients." },
      { type: "text", heading: "Why Implicit Grant is Dangerous", content: "In the implicit grant, after the user authorises, the auth server redirects to your app with the access token in the URL: https://app.com/callback#access_token=eyJ... This appears in browser history, server access logs, referrer headers, and can be stolen via open redirectors. RFC 9700 officially deprecated it in 2025." },
      { type: "code", heading: "PKCE Flow — Step by Step", code: { language: "typescript", snippet: `// Step 1: Generate a cryptographically random code_verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

// Step 2: Hash it to create the code_challenge (SHA-256)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

// Step 3: Redirect user to auth server with code_challenge
async function login() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier in sessionStorage (not localStorage)
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'my-spa',
    redirect_uri: 'https://app.com/callback',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: crypto.randomUUID(), // CSRF protection
  });

  window.location.href = \`https://auth.example.com/authorize?\${params}\`;
}

// Step 4: After redirect, exchange code for tokens
async function handleCallback(code: string) {
  const verifier = sessionStorage.getItem('pkce_verifier')!;

  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.com/callback',
      client_id: 'my-spa',
      code_verifier: verifier,  // Auth server verifies this matches challenge
    }),
  });

  const { access_token, refresh_token } = await response.json();
  // Store access_token in memory, refresh_token in HttpOnly cookie via backend
}`, caption: "Full PKCE implementation in TypeScript" } },
      { type: "list", heading: "Security Properties PKCE Provides", items: [
        "Auth code interception is useless — attacker has the code but not the verifier, so the token exchange fails",
        "Works for public clients (SPAs, mobile) with no client_secret — the verifier proves intent",
        "state parameter prevents CSRF — verify it matches what you sent before exchanging the code",
        "Short-lived auth codes (≤ 10 min) limit the window of attack",
      ]},
      { type: "note", content: "For SPAs, never store tokens in localStorage — XSS can read it. Store the access token in memory (a module-level variable) and the refresh token in an HttpOnly cookie managed by your backend. Refresh silently via a /auth/refresh endpoint." },
    ],
  },
  {
    slug: "redis-data-structures",
    title: "Redis Data Structures You Should Actually Use",
    summary: "Sorted Sets for leaderboards, Streams for event logs, HyperLogLog for cardinality estimation.",
    category: "Databases", difficulty: "intermediate",
    tags: ["Redis", "Caching", "Data Structures", "Node.js"],
    readingTime: 10, upvoteCount: 163, viewCount: 2400,
    author: { id: "u8", name: "Camille Dupont", avatarUrl: "" },
    publishedAt: new Date("2026-05-05"), trendingScore: 48, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Most engineers use Redis as a simple key-value cache. But Redis ships with specialised data structures that solve common problems at O(log N) or O(1) complexity — without any application-level sorting, deduplication, or aggregation code." },
      { type: "text", heading: "Sorted Sets — Leaderboards & Rate Limiting", content: "A Sorted Set stores unique members each with a floating-point score. Redis keeps members ordered by score automatically. This is perfect for leaderboards, priority queues, or rate limiting windows. All operations are O(log N)." },
      { type: "code", heading: "Leaderboard with Sorted Sets", code: { language: "javascript", snippet: `import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });

// Add or update a user's score (atomically increments)
await redis.zIncrBy('leaderboard:global', 50, 'user:alice');
await redis.zIncrBy('leaderboard:global', 120, 'user:bob');
await redis.zIncrBy('leaderboard:global', 80, 'user:carol');

// Get top 10 with scores (highest first)
const top10 = await redis.zRangeWithScores('leaderboard:global', 0, 9, {
  REV: true,
});
// [{ value: 'user:bob', score: 120 }, { value: 'user:carol', score: 80 }, ...]

// Get a user's rank (0-indexed)
const rank = await redis.zRevRank('leaderboard:global', 'user:alice');
// → 2 (3rd place)`, caption: "Real-time leaderboard with ZADD/ZRANGE" } },
      { type: "code", heading: "HyperLogLog — Count Unique Visitors", code: { language: "javascript", snippet: `// HyperLogLog gives approximate unique counts using fixed ~12KB memory
// regardless of how many unique items you add. Error rate: ~0.81%

const today = new Date().toISOString().split('T')[0]; // "2026-05-26"

// On each page view — add the user ID or fingerprint
await redis.pfAdd(\`visitors:\${today}\`, userId);

// Get approximate unique visitor count
const uniqueVisitors = await redis.pfCount(\`visitors:\${today}\`);
// → ~10000 (even if you have 10M entries, uses only 12KB)

// Merge multiple days for weekly uniques
const weeklyUnique = await redis.pfCount(
  'visitors:2026-05-20', 'visitors:2026-05-21', 'visitors:2026-05-22',
  'visitors:2026-05-23', 'visitors:2026-05-24', 'visitors:2026-05-25', 'visitors:2026-05-26'
);`, caption: "HyperLogLog for memory-efficient unique counts" } },
      { type: "list", heading: "Quick Reference — When to Use Each Structure", items: [
        "String: simple cache, counters (INCR), distributed locks (SET NX PX)",
        "Hash: store an object's fields (user profile) — more memory-efficient than JSON string",
        "List: message queues (LPUSH/BRPOP), activity feeds, capped log buffers (LTRIM)",
        "Sorted Set: leaderboards, rate limiting (sliding window), priority queues, range queries",
        "Set: unique tag lists, online user tracking, set operations (union, intersection)",
        "HyperLogLog: unique visitor counts, distinct event tracking at massive scale",
        "Stream: event sourcing, activity logs, real-time message processing (like Kafka lite)",
      ]},
    ],
  },
  {
    slug: "tcp-handshake-tls",
    title: "TCP Handshake & TLS — What Happens Before Your Request",
    summary: "The 3-way TCP handshake, TLS 1.3, and 0-RTT resumption with timing diagrams.",
    category: "Networking", difficulty: "advanced",
    tags: ["TCP", "TLS", "Networking", "Latency"],
    readingTime: 13, upvoteCount: 99, viewCount: 1500,
    author: { id: "u3", name: "Lena Fischer", avatarUrl: "" },
    publishedAt: new Date("2026-05-01"), trendingScore: 40, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Before a single byte of HTTP data is exchanged, the client and server spend multiple round trips just establishing a connection. Understanding this overhead is crucial for diagnosing latency and justifying optimisations like HTTP/2, HTTP/3, and connection pooling." },
      { type: "text", heading: "TCP 3-Way Handshake", content: "TCP is connection-oriented — before data flows, both sides must agree to communicate. The handshake takes exactly one round-trip time (RTT). For a server in a different continent, one RTT can be 150ms+ — and that's before any TLS or HTTP." },
      { type: "code", heading: "TCP Handshake Timing Diagram", code: { language: "text", snippet: `Client                    Server
  |                          |
  |-------- SYN ----------->|   Client says: "I want to connect, seq=100"
  |                          |
  |<------- SYN+ACK --------|   Server says: "OK, seq=200, ack=101"
  |                          |
  |-------- ACK ----------->|   Client says: "Got it, ack=201"
  |                          |
  |  [Connection Established] |   1 RTT spent before any data
  |                          |
  |-------- HTTP GET ------->|   Request can now be sent

# With a 100ms RTT server (e.g. cross-continent):
# TCP handshake alone = 100ms
# + TLS 1.2 handshake = 200ms more (2 RTTs)
# + HTTP request/response = 100ms
# Total time to first byte: ~400ms before content starts`, caption: "TCP 3-way handshake timing" } },
      { type: "text", heading: "TLS 1.3 — Down to 1 RTT", content: "TLS 1.2 required 2 extra round trips after TCP — a massive overhead. TLS 1.3 reduced this to a single round trip by combining the key exchange in the first message. TLS 1.3 also supports 0-RTT resumption for returning clients, where encrypted data is sent with the very first packet." },
      { type: "code", heading: "TLS 1.3 Handshake", code: { language: "text", snippet: `Client                         Server
  |                               |
  |------ TCP SYN -------------->|
  |<----- TCP SYN+ACK -----------|   1 RTT: TCP
  |------ TCP ACK -------------->|
  |                               |
  |------ ClientHello            |   Client sends supported ciphers
  |       + key_share ---------->|   AND its Diffie-Hellman key share
  |                               |
  |<----- ServerHello            |   Server picks cipher
  |       + key_share            |   Sends its DH key share
  |       + Certificate          |   Both sides can now derive keys!
  |       + Finished ------------|   1 RTT: TLS
  |                               |
  |------ Finished              |
  |------ HTTP GET (encrypted) ->|   Application data in same flight
  |                               |
  |<----- HTTP Response ---------|   1 RTT: application

# TLS 1.3 total: 2 RTT (vs TLS 1.2's 3 RTT)
# With 0-RTT resumption: 1 RTT total for returning clients`, caption: "TLS 1.3 — 1-RTT handshake" } },
      { type: "list", heading: "Practical Latency Optimisations", items: [
        "Use HTTP/2 — multiplexes multiple requests over a single TCP+TLS connection, amortising handshake cost",
        "Use HTTP/3 (QUIC) — combines transport + TLS in one handshake over UDP, 0 RTT for new connections",
        "Enable TLS session resumption — returning clients skip the full handshake using a session ticket",
        "Deploy servers closer to users (CDN/edge) — every 1000km ≈ 10ms of RTT reduction",
        "Use connection pooling in your backend — avoid opening new TCP connections per request",
      ]},
    ],
  },
  {
    slug: "css-container-queries",
    title: "CSS Container Queries — Component-Driven Responsive Design",
    summary: "Container queries let components respond to their own size, not the viewport.",
    category: "Frontend", difficulty: "beginner",
    tags: ["CSS", "Responsive", "Container Queries"],
    readingTime: 5, upvoteCount: 122, viewCount: 1700,
    author: { id: "u9", name: "Aiko Yamamoto", avatarUrl: "" },
    publishedAt: new Date("2026-05-24"), trendingScore: 91, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "Media queries respond to the viewport width — which works fine for page-level layouts but breaks for reusable components. A card component in a 400px sidebar behaves differently from the same card in an 1100px main area, even at the same viewport size. Container queries solve this by letting components respond to their own container's size." },
      { type: "code", heading: "The Problem Media Queries Can't Solve", code: { language: "css", snippet: `/* Media query — responds to viewport, not the card's actual space */
@media (max-width: 600px) {
  .card { flex-direction: column; }
}
/* ❌ Problem: same card in a narrow sidebar at 1200px viewport
   still shows horizontal layout because viewport > 600px */`, caption: "The viewport-vs-container mismatch problem" } },
      { type: "code", heading: "Container Queries — The Fix", code: { language: "css", snippet: `/* Step 1: Mark the parent as a container */
.card-wrapper {
  container-type: inline-size;  /* enables width-based queries */
  container-name: card;         /* optional name for specificity */
}

/* Step 2: Query the container's size, not the viewport */
.card {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

@container card (max-width: 400px) {
  .card {
    flex-direction: column;  /* stacks when container is narrow */
  }

  .card__image {
    width: 100%;
    height: 200px;
  }
}

@container card (min-width: 401px) {
  .card__image {
    width: 120px;
    flex-shrink: 0;
  }
}`, caption: "Container queries — component responds to its own width" } },
      { type: "code", heading: "Practical Example — Responsive Product Card", code: { language: "html", snippet: `<!-- Same component, used in two different layouts -->
<div class="sidebar">     <!-- 280px wide -->
  <div class="card-wrapper">
    <div class="card">   <!-- queries see 280px → stacks vertically -->
      <img class="card__image" src="..." />
      <div class="card__content">...</div>
    </div>
  </div>
</div>

<main class="content">   <!-- 900px wide -->
  <div class="card-wrapper">
    <div class="card">   <!-- queries see 900px → shows side-by-side -->
      <img class="card__image" src="..." />
      <div class="card__content">...</div>
    </div>
  </div>
</main>`, caption: "One component, two contexts — both render correctly" } },
      { type: "list", heading: "Browser Support & Progressive Enhancement", items: [
        "Container queries are supported in Chrome 105+, Safari 16+, Firefox 110+ — all modern browsers",
        "Use @supports (container-type: inline-size) { ... } for graceful degradation",
        "container-type: size enables both width AND height queries; inline-size is width-only (more common)",
        "Container query units: cqw (1% of container width), cqh (1% of container height) — like vw/vh but for the container",
      ]},
    ],
  },
  {
    slug: "database-indexing-strategies",
    title: "Database Indexing Strategies That Actually Scale",
    summary: "Composite indexes, partial indexes, covering indexes — with EXPLAIN output analysis.",
    category: "Databases", difficulty: "advanced",
    tags: ["Indexing", "PostgreSQL", "MongoDB", "Performance"],
    readingTime: 15, upvoteCount: 204, viewCount: 2900,
    author: { id: "u6", name: "Rahul Gupta", avatarUrl: "" },
    publishedAt: new Date("2026-05-17"), trendingScore: 67, status: "published",
    body: [
      { type: "text", heading: "Overview", content: "A missing index turns a query that should take 1ms into one that takes 30 seconds as your table grows. A wrong index wastes write performance and storage without helping any query. Understanding how indexes work — not just adding them blindly — is what separates a performant database from a slow one." },
      { type: "text", heading: "How a B-Tree Index Works", content: "Most database indexes (PostgreSQL, MySQL, MongoDB) use a B-tree — a balanced tree where every leaf node points to actual table rows. A query using an indexed column traverses the tree in O(log N) instead of scanning all N rows. The index is a separate data structure maintained on every write." },
      { type: "code", heading: "EXPLAIN ANALYZE — Reading the Query Plan", code: { language: "sql", snippet: `-- Without index: sequential scan on 1M row table
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;

-- Output:
-- Seq Scan on orders  (cost=0.00..28450.00 rows=1 width=80)
--                      actual time=234.112..234.115 rows=3 loops=1
-- Planning Time: 0.8 ms,  Execution Time: 234.2 ms  ← 234ms!

-- Add the index
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- Now re-run EXPLAIN ANALYZE
-- Index Scan using idx_orders_user_id on orders
--   (cost=0.43..12.47 rows=3 width=80)
--   actual time=0.042..0.051 rows=3 loops=1
-- Execution Time: 0.1 ms  ← 2340x faster`, caption: "Before and after — sequential scan vs index scan" } },
      { type: "text", heading: "Composite Indexes — Column Order Matters", content: "A composite index on (a, b, c) can serve queries filtering on a, on (a, b), or on (a, b, c). It cannot efficiently serve queries filtering only on b or only on c. The leftmost prefix rule: put the most selective column that appears in your WHERE clauses first." },
      { type: "code", heading: "Composite Index Example", code: { language: "sql", snippet: `-- Query pattern: filter by status AND sort by created_at
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

-- Naive index on just status — has to sort 50k pending rows
CREATE INDEX idx_orders_status ON orders (status);

-- Better: composite index matching the query shape exactly
-- status first (equality filter), then created_at (range/sort)
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);

-- Now the DB can jump straight to pending+recent rows
-- No sort step needed — index is already in the right order

-- MongoDB equivalent
db.orders.createIndex({ status: 1, createdAt: -1 });`, caption: "Composite index matching query shape" } },
      { type: "code", heading: "Partial Indexes — Index Only What You Query", code: { language: "sql", snippet: `-- Only 0.1% of orders are 'pending' — no need to index all statuses
-- A partial index covers only the rows matching the WHERE clause

CREATE INDEX idx_pending_orders
ON orders (created_at DESC)
WHERE status = 'pending';

-- This index is tiny (0.1% of table size) but lightning-fast
-- for the most common ops dashboard query:
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC;

-- MongoDB partial index equivalent
db.orders.createIndex(
  { createdAt: -1 },
  { partialFilterExpression: { status: "pending" } }
);`, caption: "Partial indexes — small, fast, targeted" } },
      { type: "list", heading: "Indexing Rules of Thumb", items: [
        "Index columns in WHERE, JOIN ON, and ORDER BY clauses — in that priority order",
        "Composite index column order: equality filters first, range filters last, sort columns at the end",
        "Partial indexes for low-cardinality filtered queries (status = 'active' on a table where 95% are inactive)",
        "Covering index: include all columns the query needs in the index itself to avoid a table lookup entirely",
        "Every index slows writes by ~10-30% — don't add indexes speculatively, measure with EXPLAIN first",
        "Use pg_stat_user_indexes to find unused indexes — they cost writes but help nothing",
      ]},
      { type: "warning", content: "Adding an index on a production table with millions of rows will lock the table in PostgreSQL. Always use CREATE INDEX CONCURRENTLY to build the index in the background without blocking reads or writes." },
    ],
  },
];

async function seed() {
  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI!);

  const Topic = mongoose.models.Topic ?? mongoose.model("Topic", TopicSchema);

  console.log("🗑️   Clearing existing topics…");
  await Topic.deleteMany({});

  console.log(`🌱  Inserting ${SEED_TOPICS.length} topics with full content…`);
  await Topic.insertMany(SEED_TOPICS);

  console.log("✅  Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
