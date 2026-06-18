# Authentication Flow — Access Token + Refresh Token

## Is this the best practice?

Yes. This is the **industry standard** used by companies like GitHub, Stripe, Google, and most modern SPAs (Single Page Applications). The pattern is called **"Access Token + Rotating Refresh Token"** and it solves two competing problems:

- **Security**: tokens should expire quickly so a stolen token can't be used for long
- **UX**: users should not have to log in every 15 minutes

The solution: two tokens working together.

---

## The Two Tokens

| | Access Token | Refresh Token |
|---|---|---|
| **Lifespan** | 15 minutes | 30 days |
| **Where stored** | JavaScript memory (React context) | `httpOnly` cookie (set by server) |
| **What reads it** | Frontend sends it in `Authorization` header | Browser sends it automatically — JS cannot read it |
| **What it's for** | Authenticating every API request | Getting a new access token when the old one expires |

---

## Why store them this way?

### Access token in memory (not localStorage, not a cookie)

```ts
// lib/api.ts
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
```

- **Not localStorage** — localStorage is readable by any JavaScript on the page. If your app ever has an XSS vulnerability (malicious script injected), the attacker can steal tokens from localStorage. Memory variables cannot be read by injected scripts.
- **Downside** — lost on page refresh. Solved by the refresh token restoring it on load.

### Refresh token in httpOnly cookie (set by Laravel)

```php
// AuthController.php
$refreshCookie = cookie(
    'refresh_token',
    $refreshToken,
    30 * 24 * 60,  // 30 days in minutes
    '/',
    null,
    true,   // secure: HTTPS only
    true,   // httpOnly: JavaScript CANNOT read this
    false,
    'Lax'
);
```

- `httpOnly: true` means even `document.cookie` in the browser console cannot see this cookie. Only the browser kernel can read it and it sends it automatically on requests to your domain.
- `secure: true` means it only travels over HTTPS, never plain HTTP.
- This makes stealing the refresh token nearly impossible from the browser side.

---

## Full Flow Diagram

```
USER LOGS IN
     │
     ▼
POST /api/auth/login  { email, password }
     │
     ▼
Laravel validates credentials
     │
     ├──► Creates access_token  (expires: 15 min) ──► returned in JSON body
     │
     └──► Creates refresh_token (expires: 30 days) ──► set as httpOnly cookie
     │
     ▼
Frontend (AuthProvider):
  - stores access_token in memory
  - stores user in React state
  - schedules a silent refresh 60 seconds before expiry


EVERY API REQUEST
     │
     ▼
apiFetch() adds:  Authorization: Bearer <access_token>
     │
     ▼
Laravel's auth:sanctum middleware validates the token


ACCESS TOKEN EXPIRES (after 15 min)
     │
     ▼
API returns 401 Unauthorized
     │
     ▼
apiFetch() catches the 401 and silently calls POST /api/auth/refresh
(browser auto-sends the httpOnly refresh cookie)
     │
     ▼
Laravel validates refresh token:
  - Checks it exists in personal_access_tokens table
  - Checks it is named 'refresh_token'
  - Checks expires_at is not in the past
  - Checks the token hash matches
     │
     ├──► VALID: deletes old refresh token, issues new pair (rotation)
     │          new access_token returned in JSON
     │          new refresh_token set as httpOnly cookie
     │
     └──► INVALID: returns 401 → user redirected to /login
     │
     ▼
apiFetch() retries the original failed request with the new access token


PAGE REFRESH (memory is cleared)
     │
     ▼
AuthProvider mounts → calls restoreSession()
     │
     ▼
POST /api/auth/refresh (browser sends httpOnly cookie automatically)
     │
     ▼
New access_token returned → stored in memory → user stays logged in
No login prompt needed.


USER LOGS OUT
     │
     ▼
POST /api/auth/logout
     │
     ▼
Laravel:
  - deletes current access token from DB
  - deletes refresh token from DB
  - clears the httpOnly cookie from browser
     │
     ▼
Frontend:
  - clears access token from memory
  - clears the refresh timer
  - sets user to null
  - redirects to /login
```

---

## Code Walkthrough

### 1. Login — `AuthController.php`

```php
public function login(Request $request): JsonResponse
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $this->issueTokens($user); // creates both tokens
}
```

Validates credentials, then delegates to `issueTokens()` which is reused by the refresh endpoint too.

---

### 2. Creating Both Tokens — `issueTokens()` in `AuthController.php`

```php
private function issueTokens(User $user): JsonResponse
{
    // Access token — short lived, returned in JSON
    $accessToken = $user->createToken(
        'access_token',
        ['*'],
        now()->addMinutes(15)
    )->plainTextToken;

    // Refresh token — long lived, sent as httpOnly cookie
    $refreshToken = $user->createToken(
        'refresh_token',
        ['*'],
        now()->addDays(30)
    )->plainTextToken;

    $refreshCookie = cookie(
        'refresh_token',
        $refreshToken,
        30 * 24 * 60, // minutes
        '/',
        null,
        true,  // secure (HTTPS)
        true,  // httpOnly (JS cannot read)
        false,
        'Lax'
    );

    return response()->json([
        'access_token' => $accessToken,
        'expires_in'   => 15 * 60, // 900 seconds — frontend uses this to schedule refresh
        'user'         => [...],
    ])->withCookie($refreshCookie);
}
```

Both tokens are stored in the `personal_access_tokens` table (Sanctum's table). They are distinguished by the `name` column: `'access_token'` vs `'refresh_token'`.

---

### 3. Refresh — `AuthController.php`

```php
public function refresh(Request $request): JsonResponse
{
    $rawRefreshToken = $request->cookie('refresh_token');

    if (! $rawRefreshToken) {
        return response()->json(['message' => 'Refresh token missing.'], 401);
    }

    // Sanctum stores tokens as "id|plaintext"
    [$id, $plain] = explode('|', $rawRefreshToken, 2);

    $tokenRecord = PersonalAccessToken::find($id);

    if (
        ! $tokenRecord
        || $tokenRecord->name !== 'refresh_token'         // must be a refresh token
        || ! hash_equals($tokenRecord->token, hash('sha256', $plain))  // hash must match
        || ($tokenRecord->expires_at && $tokenRecord->expires_at->isPast()) // must not be expired
    ) {
        return response()->json(['message' => 'Invalid or expired refresh token.'], 401);
    }

    $user = $tokenRecord->tokenable; // get the User from the token

    // ROTATION: delete the old refresh token so it can never be used again
    $tokenRecord->delete();

    // Issue a brand new access token + refresh token pair
    return $this->issueTokens($user);
}
```

**Token rotation** is the key security feature here. Every time you refresh, the old refresh token is deleted and a new one is issued. If an attacker steals your refresh token and tries to use it after you've already refreshed, it will be gone from the database and they'll get a 401.

---

### 4. The API Fetch with Auto-Retry — `lib/api.ts`

```ts
async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include", // tells browser to send the httpOnly cookie
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  // 401 = access token expired. Try refreshing once.
  if (res.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true); // retry with new token
    }
    // Refresh failed — session is truly over
    clearAccessToken();
    window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw error;
  }

  return res.json();
}
```

The `isRetry` flag prevents an infinite loop — if the retry itself returns 401, we give up and redirect to login instead of refreshing again.

---

### 5. Proactive Refresh Timer — `lib/api.ts`

```ts
export function scheduleRefresh(expiresInSeconds: number) {
  if (refreshTimer) clearTimeout(refreshTimer);

  // Refresh 60 seconds BEFORE expiry so requests never actually hit a 401
  const delay = Math.max((expiresInSeconds - 60) * 1000, 0);

  refreshTimer = setTimeout(async () => {
    await tryRefresh();
  }, delay);
}
```

Instead of waiting for a request to fail with 401, this timer proactively refreshes the access token 60 seconds before it expires. The user never experiences a failed request due to token expiry.

---

### 6. Restoring Session on Page Refresh — `lib/auth.tsx`

```tsx
useEffect(() => {
  restoreSession()
    .then((data) => {
      if (data) setUser(data.user);
    })
    .finally(() => setLoading(false));
}, []);
```

When the app loads (or the user refreshes the page), the access token is gone from memory. `restoreSession()` calls `POST /auth/refresh` — the browser automatically attaches the httpOnly cookie — and if valid, the user gets a new access token without ever seeing a login screen.

---

### 7. Auth Context — `lib/auth.tsx`

```tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ...restore session on mount...

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/auth/login", { ... });
    setAccessToken(data.access_token);      // store in memory
    scheduleRefresh(data.expires_in);       // start the proactive timer
    setUser(data.user);                     // update React state
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" }); // revoke on server
    } finally {
      clearAccessToken();    // clear memory
      cancelRefreshTimer();  // stop the timer
      setUser(null);         // update React state
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

This is the single source of truth for auth state in the entire frontend. Any component can call `useAuth()` to get the current user or trigger login/logout.

---

## What about the `loading` state?

```tsx
const { user, loading } = useAuth();

if (loading) return <Spinner />;
if (!user)   return <Redirect to="/login" />;
```

On page load, `loading` is `true` while `restoreSession()` runs. Without this, the app would flash the login page for a split second on every page refresh even for logged-in users. Always check `loading` before checking `user`.

---

## Comparison with other approaches

| Approach | XSS Risk | CSRF Risk | Expires | Notes |
|---|---|---|---|---|
| Token in localStorage | ❌ High | ✅ None | Manual | Stolen by any JS on the page |
| Token in readable cookie | ❌ High | ⚠️ Medium | Auto | Same XSS risk, plus CSRF possible |
| Token in memory + httpOnly refresh cookie | ✅ Low | ✅ None (SameSite=Lax) | Auto | **This implementation** |
| Cookie-based sessions (Sanctum SPA) | ✅ Low | ⚠️ Needs CSRF token | Server-managed | Good for same-domain only |

---

## Things to add in the future

1. **Revoke all sessions** — add a "Log out of all devices" button that deletes all tokens for a user from `personal_access_tokens` where `tokenable_id = user.id`
2. **Token family detection** — if a refresh token is used twice (possible theft), revoke all tokens for that user immediately
3. **Role-based redirects** — after login, check `user.role` and redirect to `/admin/dashboard` or `/customer/dashboard` accordingly
4. **Edge middleware auth** — once you move to a JWT-based access token (instead of Sanctum's DB lookup), the Next.js middleware can verify the token at the edge without a DB call
