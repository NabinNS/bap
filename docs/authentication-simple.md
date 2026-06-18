# Authentication — Simple Explanation

---

## Why Token-Based and NOT Cookie-Based?

Imagine two restaurants:

**Cookie-based (SPA session):** You show your ID once at the door, they stamp your hand. Every time you go to the counter, they just check your hand stamp. The stamp is managed by the restaurant (server).

**Token-based:** You show your ID once, they give you a **ticket**. Every time you go to the counter, you show that ticket. You hold the ticket, not them.

**We use token-based because:**
- Laravel and Next.js are on **different origins** (`localhost:8000` vs `localhost:3000`). Cookies are painful to share across origins — you need extra CORS setup, `SameSite=None; Secure`, HTTPS even in dev, CSRF tokens, etc.
- Tokens are simple — frontend just sends `Authorization: Bearer <token>` in every request header. No cookie sharing headaches.
- Cookie-based in Sanctum is designed for when your frontend and backend are on the **same domain** (like `app.com` and `api.app.com`). Here they're completely separate.

---

## The Laravel Code — Step by Step

### Step 1: Tell Laravel "this User can have tokens"

**`app/Models/User.php`**

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;   // this one line is the key
}
```

`HasApiTokens` adds a superpower to the User model: the ability to **create, list, and delete tokens**. Without this, Sanctum does not know this model should have tokens at all.

```php
#[Fillable(['name', 'email', 'password'])]   // only these fields can be mass-assigned
#[Hidden(['password', 'remember_token'])]    // these NEVER appear in JSON responses
```

`password` is also auto-hashed — if you do `$user->password = 'hello'`, Laravel stores `$2y$10$...` (bcrypt hash), never plain text.

---

### Step 2: The login / me / logout logic

**`app/Http/Controllers/Api/AuthController.php`** — think of it as a bouncer + receptionist.

#### `login()`

```
User sends: email + password
  ↓
Validate: are both fields present and correctly formatted?
  ↓
Find user by email in DB
  ↓
Check password: does Hash::check(input, stored_hash) pass?
  ↓ (if anything fails → 422 error "credentials are incorrect")
Generate token: $user->createToken('auth_token')->plainTextToken
  ↓
Return: { token: "1|abc123...", user: { id, name, email } }
```

That token `"1|abc123..."` — the `1` is the token's database ID, `abc123...` is the actual secret. Laravel stores only a **hash** of the secret in the DB (like passwords), never the plain text.

#### `me()`

```
User sends: Authorization: Bearer 1|abc123...
  ↓
Sanctum middleware looks up token in DB, hashes it, finds the user
  ↓
$request->user() is now the logged-in user
  ↓
Return: { id, name, email }
```

This is how the frontend checks "am I still logged in?"

#### `logout()`

```
User sends: Authorization: Bearer 1|abc123...
  ↓
Sanctum finds the token in DB
  ↓
$request->user()->currentAccessToken()->delete()  ← deletes THAT specific token row
  ↓
Token is dead. Even if someone still has it, it won't work anymore.
```

---

### Step 3: Which routes are public vs protected

**`routes/api.php`**

```php
Route::prefix('auth')->group(function () {

    Route::post('login', ...);           // PUBLIC — no token needed

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', ...);           // PROTECTED — must send Bearer token
        Route::post('logout', ...);      // PROTECTED — must send Bearer token
    });

});
```

`auth:sanctum` is the gatekeeper. If the Bearer token is missing or invalid → automatic 401 response. Your controller code never even runs.

Final URLs (Laravel auto-adds `/api` prefix):

| What     | URL                      | Token needed? |
|----------|--------------------------|---------------|
| Login    | `POST /api/auth/login`   | No            |
| Who am I | `GET /api/auth/me`       | Yes           |
| Logout   | `POST /api/auth/logout`  | Yes           |

---

### Step 4: CORS — letting the frontend talk to the backend

**`config/cors.php`** — without this, the browser blocks all frontend → backend requests.

```php
'paths'                => ['api/*'],                   // only apply CORS to API routes
'allowed_origins'      => ['http://localhost:3000'],   // only Next.js dev server allowed
'allowed_methods'      => ['*'],                       // GET, POST, etc. all fine
'allowed_headers'      => ['*'],                       // Authorization, Content-Type, etc.
'supports_credentials' => false,                       // no cookies shared, so false is correct
```

Think of it as the API saying: "I will only respond to requests coming from `localhost:3000`." A random website trying to call your API gets blocked by the browser.

---

### Step 5: Sanctum config

**`config/sanctum.php`** — mostly future setup. The only thing active right now:

```php
'expiration' => null,   // tokens live forever until manually deleted via logout
```

The `stateful` domains and `middleware` block in this file are for **cookie-based SPA auth** — which is not wired up yet. They are harmless but unused.

---

### Step 6: How Laravel knows to return JSON errors (not HTML)

**`bootstrap/app.php`**

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->use([HandleCors::class]);   // CORS on every request
})
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->shouldRenderJsonWhen(
        fn($request) => $request->is('api/*')   // if URL starts with api/ → return JSON
    );
})
```

Without the `shouldRenderJsonWhen` part, if a 404 or 500 happened on an API route, Laravel would return an HTML error page. This forces it to always return `{ "message": "..." }` JSON on API routes.

---

## The Full Picture in One Diagram

```
Browser
  |
  | POST /api/auth/login  { email, password }
  |──────────────────────────────────────────────► Laravel
  |                                                   |
  |                                         cors.php: is origin allowed? ✓
  |                                         AuthController.login()
  |                                         Hash::check(password) ✓
  |                                         createToken() → writes to DB
  |                                                   |
  | ◄─────────────── { token: "1|abc..." } ───────────|
  |
  | [frontend saves token in cookie]
  |
  | GET /api/auth/me   Authorization: Bearer 1|abc...
  |──────────────────────────────────────────────► Laravel
  |                                                   |
  |                                         auth:sanctum middleware
  |                                         looks up token in DB ✓
  |                                         AuthController.me()
  |                                                   |
  | ◄──────────── { id: 1, name: "Alice" } ───────────|
```

Laravel mints and validates tokens. The frontend stores the token in a cookie and sends it as a Bearer header on every request.

---

## The Next.js Frontend Side

### `src/lib/api.ts` — the API helper

All API calls go through this one file.

**`getToken()`** — reads the `auth_token` cookie from the browser:
```ts
const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
```
Returns `null` on the server (SSR) because `document` does not exist there.

**`saveToken(token)`** — writes the token to a cookie after login:
```ts
document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
```
- 7-day expiry
- `SameSite=Lax` — protects against CSRF attacks
- Not `httpOnly` — intentionally readable by JavaScript so middleware can check it

**`clearToken()`** — deletes the cookie on logout:
```ts
document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
```
Setting a past expiry date tells the browser to delete it immediately.

**`apiFetch<T>(path, options)`** — wraps every API call:
- Auto-attaches `Authorization: Bearer <token>` if a token exists
- Throws a structured error object on non-2xx responses
- Prepends `/api` so callers just write `/auth/me` not `/api/auth/me`

---

### `src/hooks/useUser.ts` — who is logged in?

```
Component mounts
  ↓
Call GET /api/auth/me with Bearer token
  ↓ success             ↓ fail (401 / network error)
setUser(data)         clearToken() + setUser(null)
  ↓                     ↓
loading = false       loading = false
```

Handles the case where a token exists in the cookie but has been deleted from the DB (e.g., logged out from another device). The 401 from the API triggers `clearToken()`, cleaning up the stale cookie automatically.

---

### `src/middleware.ts` — route protection

Runs on the **Edge** before any page renders. Checks the cookie and redirects:

```
Visiting /login or /register with a token?
  → Redirect to /   (already logged in)

Visiting /account, /orders, /checkout without a token?
  → Redirect to /login?next=/account   (must log in first)

Everything else?
  → Allow through
```

The `?next=` param lets the login page send the user back to where they were trying to go after they log in.

> **Important:** The middleware only checks if the cookie **exists**, not if the token is still valid in the DB. A user with a revoked token passes the middleware but gets a 401 when the page loads data. The `useUser` hook catches that and clears the cookie.
