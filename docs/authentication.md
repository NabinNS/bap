# Authentication — How It Works (End to End)

This document explains every layer of the BAP authentication system: the Laravel API (Sanctum token-based), the Next.js frontend (cookie storage + middleware), and how the two sides talk to each other.

---

## Strategy: Token-Based (not SPA cookie-based)

Even though Laravel Sanctum supports two modes — **SPA cookie sessions** and **API tokens** — this project uses **API tokens**.

> The CLAUDE.md describes a cookie-based SPA plan, but the actual code issues a Bearer token that the frontend stores in a JavaScript-accessible cookie. This document describes what is actually implemented.

Flow overview:

```
Browser                     Next.js (middleware)         Laravel API
  |                               |                           |
  |-- POST /api/auth/login -------|-------------------------> |
  |                               |                    validate credentials
  |                               |                    create Sanctum token
  |<-- { token, user } -----------|---------------------------|
  | save token in cookie          |                           |
  |                               |                           |
  |-- GET /account -------------> |                           |
  |                       read auth_token cookie              |
  |                       cookie present? allow               |
  |                       cookie missing? redirect /login     |
  |                               |                           |
  |-- GET /api/auth/me ---------- | ------------------------> |
  |                               |           read Bearer token
  |                               |           verify with Sanctum
  |<-- { id, name, email } ------ | --------------------------|
```

---

## 1. Laravel API Side

### `apps/api/app/Models/User.php`

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
    ...
}
```

- **`HasApiTokens`** is the Sanctum trait. It adds three methods to the model:
  - `createToken(name)` — mints a new personal access token, stores a hashed copy in `personal_access_tokens`, returns the plain-text token once.
  - `tokens()` — relation to all tokens this user owns.
  - `currentAccessToken()` — the token object that authenticated the current request.
- **`#[Fillable]`** attribute lists mass-assignable fields: `name`, `email`, `password`.
- **`#[Hidden]`** hides `password` and `remember_token` from JSON serialization so they never leak in responses.
- **`casts()`** — `password` is automatically hashed on assignment (no manual `Hash::make()` needed when creating users). `email_verified_at` is cast to a Carbon datetime.

---

### `apps/api/app/Http/Controllers/Api/AuthController.php`

Three actions — login, me, logout.

#### `login(Request $request)`

1. Validates that `email` (required, valid email) and `password` (required, string) are present.
2. Looks up the user by email with `User::where('email', ...)->first()`.
3. Checks the password against the stored bcrypt hash with `Hash::check()`.
4. If either check fails → throws `ValidationException` with an `email` field error (HTTP 422).
5. If credentials are valid → calls `$user->createToken('auth_token')->plainTextToken` to mint a token. The name `'auth_token'` is just a label stored in the DB; it does not affect functionality.
6. Returns JSON:
   ```json
   {
     "token": "1|abcdef...",
     "user": { "id": 1, "name": "Alice", "email": "alice@example.com" }
   }
   ```

#### `me(Request $request)`

- Protected by `auth:sanctum` middleware (see routes below).
- Sanctum has already authenticated the user from the Bearer token before this runs.
- Returns the currently authenticated user's `id`, `name`, `email`.

#### `logout(Request $request)`

- Protected by `auth:sanctum`.
- Calls `$request->user()->currentAccessToken()->delete()` — deletes the specific token that was used for this request from the DB. The token is immediately invalidated.
- Returns `{ "message": "Logged out successfully." }`.

---

### `apps/api/routes/api.php`

```php
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);        // Public

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);           // Protected
        Route::post('logout', [AuthController::class, 'logout']);  // Protected
    });
});
```

- All routes under `/api/auth/` because Laravel auto-prefixes with `/api`.
- `login` is public — no auth required.
- `me` and `logout` require a valid Sanctum token via the `auth:sanctum` middleware. A missing or invalid token returns HTTP 401 automatically.

Full resolved paths:

| Method | URL               | Auth required |
|--------|-------------------|---------------|
| POST   | /api/auth/login   | No            |
| GET    | /api/auth/me      | Yes           |
| POST   | /api/auth/logout  | Yes           |

---

### `apps/api/bootstrap/app.php`

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',   // <-- registers api.php
        ...
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,  // <-- CORS on every request
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),  // JSON errors on api/*
        );
    })->create();
```

- **`api: __DIR__.'/../routes/api.php'`** — registers the API route file. Laravel automatically wraps these in the `api` middleware group (rate limiting, JSON responses).
- **`HandleCors::class`** added globally — every request goes through CORS handling. The actual CORS rules come from `config/cors.php`.
- **`shouldRenderJsonWhen`** — if an unhandled exception is thrown on any `api/*` route (401, 404, 500, validation errors), Laravel returns JSON instead of an HTML error page.

---

### `apps/api/config/cors.php`

```php
return [
    'paths'               => ['api/*'],
    'allowed_methods'     => ['*'],
    'allowed_origins'     => ['http://localhost:3000', 'http://localhost:3001'],
    'allowed_headers'     => ['*'],
    'supports_credentials' => false,
];
```

- **`paths`** — CORS headers are only applied to `api/*` requests. Static files and the web routes are unaffected.
- **`allowed_origins`** — only the Next.js dev server origins are allowed. Requests from any other origin are rejected at the browser level (the API still responds, but the browser blocks the response).
- **`supports_credentials: false`** — cookies and `Authorization` headers from cross-origin requests are still sent because the frontend uses `Authorization: Bearer <token>`, not session cookies. Credential sharing (for cookie-based sessions) is explicitly disabled.
- **`allowed_headers: ['*']`** — the `Authorization`, `Content-Type`, and `Accept` headers the frontend sends are all permitted.

> **Important:** If you switch to SPA cookie-based auth, `supports_credentials` must become `true` and `allowed_origins` cannot use wildcards — it must list explicit origins.

---

### `apps/api/config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,...')),
'guard'    => ['web'],
'expiration' => null,
'middleware' => [
    'authenticate_session' => AuthenticateSession::class,
    'encrypt_cookies'      => EncryptCookies::class,
    'validate_csrf_token'  => ValidateCsrfToken::class,
],
```

- **`stateful`** — lists domains whose requests get SPA cookie authentication. Since the current implementation uses tokens (not cookies), this config has no active effect. It would matter if `EnsureFrontendRequestsAreStateful` middleware were added.
- **`guard: ['web']`** — when authenticating via SPA cookies, Sanctum checks the `web` guard (the standard Laravel session guard).
- **`expiration: null`** — tokens never expire automatically. Logout is the only way to invalidate a token.
- **`middleware`** — defines the middleware stack for SPA cookie authentication. Currently unused since `EnsureFrontendRequestsAreStateful` is not wired in.

> **Note:** The `sanctum.php` config is mostly future infrastructure for switching to SPA session-based auth. The active auth mechanism is the Bearer token in `AuthController`.

---

## 2. Next.js Frontend Side

### `apps/web/src/lib/api.ts`

The single source of truth for all API communication.

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

Falls back to the local Laravel server if the env var is not set.

#### `getToken(): string | null`

```ts
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? match[1] : null;
}
```

- Returns `null` on the server (SSR/middleware context) because `document` doesn't exist there.
- Parses the raw `document.cookie` string with a regex to find `auth_token`. This keeps the cookie readable by JavaScript (not `httpOnly`) so the middleware can also read it.

#### `saveToken(token: string)`

```ts
export function saveToken(token: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
}
```

- Writes the token to a cookie with a **7-day expiry**.
- `path=/` — cookie is sent on every request to this origin.
- `SameSite=Lax` — cookie is sent on top-level navigations and same-site requests; blocked on cross-site POSTs (CSRF protection).
- **Not `httpOnly`** — by design, because `middleware.ts` reads cookies at the Edge where you can access them via the `NextRequest.cookies` API, and because `getToken()` reads it in the browser too.

#### `clearToken()`

```ts
export function clearToken() {
  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
```

- Overwrites the cookie with a past expiry date, which causes the browser to delete it immediately.

#### `apiFetch<T>(path, options)`

```ts
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw error;
  }

  return res.json();
}
```

- Prepends `/api` to every path (so callers write `/auth/me`, not `/api/auth/me`).
- If a token exists in the cookie, attaches it as `Authorization: Bearer <token>`. This is what Sanctum reads on the API side.
- On non-2xx responses, parses the JSON error body and throws it (so callers can `catch` structured error objects).
- Returns parsed JSON typed as `T`.

---

### `apps/web/src/hooks/useUser.ts`

```ts
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
```

- A React hook for components that need to know who is logged in.
- On mount, calls `GET /api/auth/me` with the Bearer token from the cookie.
- If the request succeeds → sets `user` to the returned profile object.
- If the request fails (401 invalid/expired token, network error) → calls `clearToken()` to remove the stale cookie and sets `user` to `null`. This handles the case where a token exists in the cookie but has been deleted from the DB (e.g., logout from another tab, manual DB wipe).
- `loading` starts as `true` and becomes `false` after the check, so components can show a skeleton before the auth state is known.

---

### `apps/web/src/middleware.ts`

```ts
const PROTECTED_ROUTES = ["/account", "/orders", "/checkout"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  if (token && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
```

- Runs on the **Edge** (before the page renders) on every matched request.
- Reads `auth_token` from the request's cookies — this is possible because the cookie is not `httpOnly`.
- **Rule 1:** If a token exists and the user navigates to `/login` or `/register`, redirect to `/` (they're already logged in).
- **Rule 2:** If no token exists and the user navigates to a protected route (`/account`, `/orders`, `/checkout`), redirect to `/login?next=<original-path>`. The `next` param lets the login page redirect back after success.
- **`matcher`** — excludes Next.js internals (`_next/static`, `_next/image`), the favicon, and any `/images/` paths so the middleware doesn't run on static assets.

> **Important caveat:** The middleware only checks whether the cookie *exists*, not whether the token is valid. A user with an expired or revoked token in their cookie will pass the middleware check but then receive a 401 from the API when they actually load data. The `useUser` hook handles that case by calling `clearToken()` on a 401.

---

## 3. Login Flow — Step by Step

```
1. User submits the login form (email + password)

2. Frontend POSTs to POST /api/auth/login (no token needed — public route)
   Body: { "email": "...", "password": "..." }

3. Laravel AuthController.login():
   a. Validates input (422 if missing/invalid)
   b. Looks up User by email
   c. Hash::check(password, user.password) (422 if wrong)
   d. user.createToken('auth_token') → writes to personal_access_tokens table
   e. Returns { token: "1|xyz...", user: { id, name, email } }

4. Frontend receives the token:
   a. Calls saveToken(token) → writes auth_token cookie (7-day, SameSite=Lax)
   b. Optionally stores user info in React state

5. On next request to a protected route:
   a. middleware.ts reads auth_token cookie → present → allows navigation
   b. apiFetch() reads auth_token cookie → attaches Authorization: Bearer 1|xyz...
   c. Sanctum middleware verifies token against personal_access_tokens table
   d. Request proceeds; $request->user() is available in controllers
```

---

## 4. Logout Flow — Step by Step

```
1. User clicks Logout

2. Frontend POSTs to POST /api/auth/logout with Authorization: Bearer <token>

3. Laravel AuthController.logout():
   a. auth:sanctum middleware authenticates the request
   b. currentAccessToken().delete() removes that token row from personal_access_tokens

4. Frontend calls clearToken() → sets cookie expiry to the past → browser deletes it

5. middleware.ts: next navigation to /account → no cookie → redirect to /login
```

---

## 5. Known Gaps and What to Watch Out For

| Issue | Detail |
|-------|--------|
| Token not validated in middleware | `middleware.ts` only checks cookie presence, not token validity. A revoked token passes the middleware guard. |
| `supports_credentials: false` in CORS | Fine for Bearer tokens, but must be `true` if you switch to SPA cookie sessions. |
| `SameSite=Lax` cookie | Protects against CSRF for cookie-based attacks, but since the token is in a non-httpOnly cookie it is readable by any JS on the same origin. |
| No HTTPS flag | `saveToken()` does not set the `Secure` flag. In production add `; Secure` so the cookie is only sent over HTTPS. |
| Tokens never expire | `sanctum.php` has `expiration: null`. Consider setting a value for production. |
| `EnsureFrontendRequestsAreStateful` not wired | The Sanctum middleware is configured but not active. If SPA sessions are ever needed, add it to the `api` middleware group in `bootstrap/app.php`. |
