# Categories — Complete Data Flow Documentation

This document explains exactly how data is **fetched**, **created**, **updated**, and **deleted** for the Categories module — tracing every step from the browser through the frontend code, over HTTP, through the Laravel API, and into the PostgreSQL database.

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Backend Model](#2-backend-model---categoryph)
3. [ULID Trait](#3-ulid-trait---haspubliculidphp)
4. [API Routes](#4-api-routes---apiphp)
5. [API Response Formatter](#5-api-response-formatter---apiresponsephp)
6. [Backend Controller](#6-backend-controller---categorycontrollerphp)
7. [Frontend API Client](#7-frontend-api-client---apits)
8. [Toast Notifications](#8-toast-notifications---toastts)
9. [The Page Component](#9-the-page-component---pagetsx)
10. [FETCH — Loading Categories](#10-fetch--loading-categories)
11. [CREATE — Saving a New Category](#11-create--saving-a-new-category)
12. [UPDATE — Editing a Category](#12-update--editing-a-category)
13. [DELETE — Removing a Category](#13-delete--removing-a-category)
14. [Authentication & Tenant Isolation](#14-authentication--tenant-isolation)
15. [Complete Data Flow Diagram](#15-complete-data-flow-diagram)

---

## 1. Database Schema

**File:** `apps/api/database/migrations/2026_06_20_000001_create_categories_table.php`

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->ulid('ulid')->unique();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->string('image')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->unique(['tenant_id', 'slug']);
});
```

### Column Breakdown

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint, auto-increment | Internal primary key — **never exposed to the API** |
| `ulid` | char(26), unique | Public identifier shown in URLs and API responses (e.g. `01J3XYZABC...`) |
| `tenant_id` | bigint, foreign key | Links the category to a tenant. If the tenant is deleted, all its categories are deleted too (`cascadeOnDelete`) |
| `name` | string(255) | Display name of the category |
| `slug` | string(255) | URL-friendly identifier (e.g. `brake-parts`) |
| `description` | text, nullable | Optional longer description |
| `image` | string, nullable | File path to the category image |
| `is_active` | boolean, default `true` | Whether the category is published |
| `sort_order` | integer, default `0` | Controls display order — lower numbers appear first |
| `created_at` / `updated_at` | timestamps | Auto-managed by Laravel |

### Key Constraints

- `ulid` is globally unique across all tenants.
- `(tenant_id, slug)` is unique — two tenants can both have a `brake-parts` slug, but one tenant cannot have two categories with the same slug.
- Deleting a tenant cascades and removes all its categories from the database.

---

## 2. Backend Model — `Category.php`

**File:** `apps/api/app/Models/Category.php`

```php
class Category extends Model
{
    use HasPublicUlid;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'image',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
```

### What each section does

**`use HasPublicUlid`**
Pulls in the `HasPublicUlid` trait (covered in detail in section 3). This gives the model:
- Automatic ULID generation on create.
- ULID-based route model binding (so `/categories/{ulid}` works).
- Hides the numeric `id` from all API responses.

**`$fillable`**
Defines which columns can be mass-assigned via `Category::create($data)` or `$category->update($data)`. Any column not in this list is silently ignored, which prevents accidental overwriting of sensitive fields.

**`$casts`**
Tells Eloquent to automatically convert `is_active` between a PHP `bool` and the database integer `0`/`1`. This means you always work with `true`/`false` in PHP code and the API response, never raw integers.

---

## 3. ULID Trait — `HasPublicUlid.php`

**File:** `apps/api/app/Models/Concerns/HasPublicUlid.php`

```php
trait HasPublicUlid
{
    public static function bootHasPublicUlid(): void
    {
        static::creating(function ($model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function initializeHasPublicUlid(): void
    {
        $this->hidden[] = 'id';
    }
}
```

### What each method does

**`bootHasPublicUlid()`**
Laravel automatically calls any method named `boot{TraitName}()` when the model class boots. The `creating` event fires just before a new row is inserted into the database. If `ulid` is not already set, it generates a new ULID using `Str::ulid()`.

A ULID (Universally Unique Lexicographically Sortable Identifier) looks like `01J3XYZABC...`. It is:
- 26 characters long
- Sortable — newer ULIDs are alphabetically greater than older ones
- Safe to expose publicly (no sequential guessing like auto-increment IDs)

**`getRouteKeyName()`**
Overrides Laravel's default route model binding key from `id` to `ulid`. When a route is defined as `/categories/{category}`, Laravel looks up the `Category` where `ulid = {category}` instead of `id = {category}`.

**`initializeHasPublicUlid()`**
Laravel calls `initialize{TraitName}()` once per model instance. This adds `'id'` to the model's `$hidden` array, so the raw numeric primary key is never included in JSON responses. The API only ever exposes the `ulid`.

---

## 4. API Routes — `api.php`

**File:** `apps/api/routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('categories', CategoryController::class);
});
```

`Route::apiResource` is a Laravel shortcut that registers five standard routes at once:

| Method | URL | Controller Method | Purpose |
|--------|-----|-------------------|---------|
| `GET` | `/api/categories` | `index` | List all (paginated) |
| `POST` | `/api/categories` | `store` | Create new |
| `GET` | `/api/categories/{category}` | `show` | Get one by ULID |
| `PUT/PATCH` | `/api/categories/{category}` | `update` | Update by ULID |
| `DELETE` | `/api/categories/{category}` | `destroy` | Delete by ULID |

**`middleware('auth:sanctum')`** wraps all five routes. Every request must carry a valid Bearer token. If the token is missing or expired, Laravel returns a `401 Unauthorized` before the controller is ever reached.

---

## 5. API Response Formatter — `ApiResponse.php`

**File:** `apps/api/app/Http/Resources/ApiResponse.php`

This is a static helper class that standardises every JSON response the API sends. Every controller method returns through one of these methods to guarantee consistent response shapes.

```php
// 200 — general success
ApiResponse::success($data, 'message')
// → { success: true, message: "...", data: {...} }

// 201 — resource created
ApiResponse::created($data, 'message')
// → { success: true, message: "...", data: {...} }   (status 201)

// 200 — deleted (no body data)
ApiResponse::noContent('message')
// → { success: true, message: "...", data: null }

// 200 — paginated list
ApiResponse::paginated($paginator, 'message')
// → { success: true, message: "...", data: [...], meta: { total, per_page, current_page, last_page, from, to } }

// 4xx — error
ApiResponse::error('message', 400, $errors)
// → { success: false, message: "...", errors: {...} }

// 404 shortcut
ApiResponse::notFound()

// 401 shortcut
ApiResponse::unauthorized()

// 403 shortcut
ApiResponse::forbidden()
```

### Paginated response shape (used by the list endpoint)

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    { "ulid": "01J3XYZ...", "name": "Brake Parts", "slug": "brake-parts", ... },
    { "ulid": "01J3XYA...", "name": "Filters", "slug": "filters", ... }
  ],
  "meta": {
    "total": 42,
    "per_page": 15,
    "current_page": 1,
    "last_page": 3,
    "from": 1,
    "to": 15
  }
}
```

The frontend uses `data` to populate the table rows and `meta` to render the pagination controls.

---

## 6. Backend Controller — `CategoryController.php`

**File:** `apps/api/app/Http/Controllers/Api/CategoryController.php`

### `index()` — list categories

```php
public function index(Request $request)
{
    $categories = Category::where('tenant_id', $request->user()->currentTenantId())
        ->orderBy('sort_order')
        ->orderBy('name')
        ->paginate($request->integer('per_page', 15));

    return ApiResponse::paginated($categories, 'Categories retrieved successfully');
}
```

1. `$request->user()` — retrieves the authenticated user from the Sanctum token.
2. `currentTenantId()` — resolves which tenant this user belongs to.
3. `where('tenant_id', ...)` — scopes the query so the user only sees their own tenant's categories.
4. `orderBy('sort_order')->orderBy('name')` — sorts by sort order first, then alphabetically by name as a tiebreaker.
5. `->paginate(15)` — returns a `LengthAwarePaginator` with 15 items per page (overridable via `?per_page=` query param).
6. `ApiResponse::paginated(...)` — wraps the paginator into the standard JSON response with `data` and `meta`.

### `store()` — create a category

```php
public function store(Request $request)
{
    $data = $request->validate([
        'name'        => ['required', 'string', 'max:255'],
        'slug'        => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'image'       => ['nullable', 'string'],
        'is_active'   => ['boolean'],
        'sort_order'  => ['integer'],
    ]);

    $data['tenant_id'] = $request->user()->currentTenantId();
    $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

    $category = Category::create($data);

    return ApiResponse::created($category, 'Category created successfully');
}
```

1. `$request->validate(...)` — runs Laravel's validation. If any rule fails, Laravel automatically returns a `422 Unprocessable Entity` with an `errors` object — the controller code below never runs.
2. `$data['tenant_id'] = ...` — stamps the tenant ID from the authenticated user. The client never sends this — it is always resolved server-side, which prevents cross-tenant data injection.
3. `$data['slug'] = $data['slug'] ?? Str::slug($data['name'])` — if the frontend sent a slug, use it; otherwise auto-generate one from the name (e.g. `"Brake Parts"` → `"brake-parts"`).
4. `Category::create($data)` — inserts a new row. The `creating` event from `HasPublicUlid` fires and generates the `ulid` before the INSERT happens.
5. Returns `201 Created` with the newly created category object.

### `show()` — get one category

```php
public function show(Request $request, Category $category)
{
    abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403);

    return ApiResponse::success($category, 'Category retrieved successfully');
}
```

1. Laravel's route model binding automatically looks up the `Category` where `ulid = {category}` (because `getRouteKeyName()` returns `'ulid'`). If no category with that ULID exists, Laravel returns `404` automatically.
2. `abort_if(...)` — even though model binding found the record, we verify that the record belongs to the requesting user's tenant. This prevents a user from accessing another tenant's category by guessing its ULID.

### `update()` — edit a category

```php
public function update(Request $request, Category $category)
{
    abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403);

    $data = $request->validate([
        'name'        => ['sometimes', 'string', 'max:255'],
        'slug'        => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'image'       => ['nullable', 'string'],
        'is_active'   => ['boolean'],
        'sort_order'  => ['integer'],
    ]);

    if (isset($data['name']) && !isset($data['slug'])) {
        $data['slug'] = Str::slug($data['name']);
    }

    $category->update($data);

    return ApiResponse::success($category, 'Category updated successfully');
}
```

1. Tenant ownership is verified before any changes are made.
2. `'sometimes'` on `name` means "only validate this field if it is present in the request." This allows partial updates — you can send only `{ is_active: false }` without sending `name`.
3. Slug is regenerated from name only if `name` was sent but `slug` was not — this means you can also send an explicit custom slug and it will be respected.
4. `$category->update($data)` — Eloquent runs an `UPDATE` SQL statement with only the fields present in `$data`. It also automatically updates the `updated_at` timestamp.

### `destroy()` — delete a category

```php
public function destroy(Request $request, Category $category)
{
    abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403);

    $category->delete();

    return ApiResponse::noContent('Category deleted successfully');
}
```

1. Tenant ownership verified.
2. `$category->delete()` — runs a `DELETE FROM categories WHERE id = ?` SQL statement.
3. Returns a `200` response with `data: null` (no body to return since the record is gone).

---

## 7. Frontend API Client — `api.ts`

**File:** `apps/web/src/lib/api.ts`

This is the single file that handles all HTTP communication with the Laravel API.

### Token storage

```ts
let accessToken: string | null = null;
```

The access token lives **only in memory** (a module-level variable). It is never written to `localStorage` or a readable cookie. This protects against XSS attacks reading the token.

### The `request()` function

```ts
async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    clearAccessToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw error;
  }

  return res.json();
}
```

Step by step:

1. Builds the full URL: `http://localhost:8000/api/categories`.
2. `credentials: "include"` — tells the browser to include the `httpOnly` refresh token cookie on every request (needed for the token refresh flow).
3. Attaches the `Authorization: Bearer <token>` header if a token is in memory.
4. **On `401`:** tries to silently refresh the access token by calling `/auth/refresh`. If refresh succeeds, it replays the original request with the new token. If refresh also fails, it clears the token and redirects to `/login`.
5. **On any other non-OK status:** parses the error JSON from Laravel (which includes the `errors` object from validation failures) and throws it so the caller can catch it.
6. On success, parses and returns the JSON body.

### Token refresh scheduling

```ts
export function scheduleRefresh(expiresInSeconds: number) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max((expiresInSeconds - 60) * 1000, 0);
  refreshTimer = setTimeout(async () => {
    await tryRefresh();
  }, delay);
}
```

After login or a refresh, the app schedules a proactive token refresh 60 seconds before the token expires. This means API calls almost never hit a `401` — the token is always fresh.

### `apiFetch()` — the public API

```ts
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}
```

A thin wrapper around `request()`. Every fetch call in `page.tsx` goes through this.

### `restoreSession()` — boot-time session restoration

```ts
export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    const data = await request<AuthResponse>("/auth/refresh", { method: "POST" }, true);
    setAccessToken(data.access_token);
    scheduleRefresh(data.expires_in);
    return data;
  } catch {
    return null;
  }
}
```

Called once when the app loads. Uses the `httpOnly` refresh cookie (which persists across browser sessions) to silently log the user back in — this is why refreshing the page doesn't log you out.

---

## 8. Toast Notifications — `toast.ts`

**File:** `apps/web/src/lib/toast.ts`

```ts
export const toast = {
  success: (message: string, description?: string) =>
    sonner.success(message, { description, duration: 4000 }),

  error: (message: string, description?: string) =>
    sonner.error(message, { description, duration: 4000 }),

  warning: (message: string, description?: string) =>
    sonner.warning(message, { description, duration: 4000 }),
  // ...
};
```

A thin wrapper around the [Sonner](https://sonner.emilkowal.ski/) toast library. All toasts auto-dismiss after 4 seconds. The page uses `toast.success(...)`, `toast.error(...)`, and `toast.warning(...)` after each API operation to give the user immediate visual feedback.

---

## 9. The Page Component — `page.tsx`

**File:** `apps/web/src/app/(admin)/admin/categories/page.tsx`

### State variables

```ts
const [categories, setCategories] = useState<Category[]>([]);   // rows shown in the table
const [meta, setMeta] = useState<Meta | null>(null);            // pagination info from API
const [page, setPage] = useState(1);                            // current page number
const [loading, setLoading] = useState(true);                   // shows skeleton loader

const [drawerOpen, setDrawerOpen] = useState(false);            // controls the slide panel
const [editingCategory, setEditingCategory] = useState<Category | null>(null); // null = create mode
const [form, setForm] = useState<FormState>(INITIAL_FORM);      // form field values
const [errors, setErrors] = useState<FormErrors>({});           // per-field validation errors
const [submitting, setSubmitting] = useState(false);            // disables Save button during request
```

### The `Category` type

```ts
type Category = {
  ulid: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};
```

This matches the shape that `ApiResponse::success($category)` returns — the `id` field is hidden by `HasPublicUlid`, so only `ulid` is present.

### Slug auto-generation

```ts
function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // replace any non-alphanumeric run with a hyphen
    .replace(/(^-|-$)/g, "");     // strip leading/trailing hyphens
}

function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
  const name = e.target.value;
  setForm((f) => ({ ...f, name, slug: toSlug(name) }));
}
```

When the user types in the Name field, the slug field is automatically populated. The user can then manually override the slug if needed. The slug field is also auto-populated on blur if the user pastes a name.

### Client-side validation

```ts
function validate(): boolean {
  const errs: FormErrors = {};
  if (!form.name.trim()) errs.name = "Name is required.";
  if (!form.slug.trim()) errs.slug = "Slug is required.";
  setErrors(errs);
  return Object.keys(errs).length === 0;
}
```

Runs before the API call. If there are errors, they appear below the relevant fields and the API is never called. This avoids unnecessary network requests for obviously invalid input.

---

## 10. FETCH — Loading Categories

### Trigger

The page loads → React renders → `useEffect` runs.

```ts
const fetchCategories = useCallback(async (p: number) => {
  setLoading(true);
  try {
    const res = await apiFetch<{ data: Category[]; meta: Meta }>(
      `/categories?page=${p}&per_page=15`
    );
    setCategories(res.data);
    setMeta(res.meta);
  } catch {
    toast.error("Failed to load categories");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchCategories(page);
}, [page, fetchCategories]);
```

`page` starts at `1`. When the user clicks a pagination button, `setPage(newPage)` is called, which triggers the effect again with the new page number.

### Full chain

```
useEffect (page changes)
  └─→ fetchCategories(1)
        └─→ apiFetch("/categories?page=1&per_page=15")
              └─→ request() in api.ts
                    └─→ GET http://localhost:8000/api/categories?page=1&per_page=15
                          └─→ Sanctum verifies Bearer token
                                └─→ CategoryController::index()
                                      └─→ Category::where('tenant_id', ...).paginate(15)
                                            └─→ SELECT * FROM categories
                                                 WHERE tenant_id = ?
                                                 ORDER BY sort_order, name
                                                 LIMIT 15 OFFSET 0
                                      └─→ ApiResponse::paginated(...)
                                └─→ JSON response
              └─→ res.data → setCategories(...)
              └─→ res.meta → setMeta(...)
  └─→ DataTable renders with new rows
```

While loading, `setLoading(true)` causes the `DataTable` to render a skeleton loader. When the data arrives, `setLoading(false)` replaces the skeleton with real rows.

---

## 11. CREATE — Saving a New Category

### Trigger

User clicks **"Add Category"** → `openCreate()` runs → `SlidePanel` slides in.

```ts
function openCreate() {
  setEditingCategory(null);    // null signals "create mode"
  setForm(INITIAL_FORM);       // reset all fields
  setErrors({});               // clear any old errors
  setDrawerOpen(true);
}
```

User fills in the form and clicks **"Save Category"** → `handleSubmit()` runs.

```ts
async function handleSubmit() {
  if (!validate()) return;    // stop if client validation fails
  setSubmitting(true);

  const payload = {
    name: form.name,
    slug: form.slug,
    description: form.description,
    is_active: form.status === "active",   // convert "active"/"inactive" string to boolean
  };

  try {
    // editingCategory is null here (create mode)
    await apiFetch("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    toast.success("Category created", `"${form.name}" has been added.`);
    closeDrawer();
    fetchCategories(page);    // re-fetch to show the new item
  } catch (err: any) {
    if (err?.errors) {
      setErrors(err.errors);   // show Laravel validation errors on the form fields
      toast.warning("Please fix the errors", "Check the highlighted fields.");
    } else {
      toast.error("Failed to create category", err?.message ?? "Something went wrong.");
    }
  } finally {
    setSubmitting(false);
  }
}
```

### What the payload looks like

```json
{
  "name": "Brake Parts",
  "slug": "brake-parts",
  "description": "All brake-related components",
  "is_active": true
}
```

### Full chain

```
handleSubmit()
  └─→ validate() passes
        └─→ apiFetch("POST /categories", { body: payload })
              └─→ POST http://localhost:8000/api/categories
                    └─→ Sanctum verifies token
                          └─→ CategoryController::store()
                                └─→ $request->validate([...])
                                      ✓ name: required ✓
                                      ✓ slug: nullable (provided) ✓
                                └─→ $data['tenant_id'] = currentTenantId()
                                └─→ $data['slug'] = "brake-parts" (already set)
                                └─→ Category::create($data)
                                      └─→ bootHasPublicUlid: creates ulid = "01J3XYZ..."
                                      └─→ INSERT INTO categories (ulid, tenant_id, name, slug, ...)
                                            VALUES ('01J3XYZ...', 7, 'Brake Parts', 'brake-parts', ...)
                                └─→ ApiResponse::created($category)  → 201
  └─→ toast.success("Category created")
  └─→ closeDrawer()
  └─→ fetchCategories(page)    → re-fetches and refreshes the table
```

If Laravel's validation fails (e.g. the slug already exists for this tenant), the API returns:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "slug": ["The slug has already been taken."]
  }
}
```

The `catch` block detects `err.errors`, writes them into `setErrors(err.errors)`, and the `InputField` component reads `error={errors.slug}` to show the message under the slug field.

---

## 12. UPDATE — Editing a Category

### Trigger

User clicks the **"Edit"** dropdown item on a row → `openEdit(category)` runs.

```ts
function openEdit(category: Category) {
  setEditingCategory(category);     // save the category being edited
  setForm({
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    status: category.is_active ? "active" : "inactive",
  });
  setErrors({});
  setDrawerOpen(true);
}
```

The `SlidePanel` opens with all fields pre-populated. The title changes to **"Edit Category"** and the button label to **"Update Category"** because `editingCategory` is now non-null.

User changes fields and clicks **"Update Category"** → `handleSubmit()` runs (same function as create).

```ts
// editingCategory is non-null here (edit mode)
await apiFetch(`/categories/${editingCategory.ulid}`, {
  method: "PUT",
  body: JSON.stringify(payload),
});
toast.success("Category updated", `"${form.name}" has been updated.`);
```

### Full chain

```
handleSubmit()
  └─→ validate() passes
        └─→ apiFetch("PUT /categories/01J3XYZ...", { body: payload })
              └─→ PUT http://localhost:8000/api/categories/01J3XYZ...
                    └─→ Sanctum verifies token
                          └─→ Route model binding:
                                SELECT * FROM categories WHERE ulid = '01J3XYZ...' LIMIT 1
                          └─→ CategoryController::update($request, $category)
                                └─→ abort_if(category.tenant_id !== user.tenant_id, 403)
                                └─→ $request->validate([...])
                                └─→ if name sent & no slug: regenerate slug
                                └─→ $category->update($data)
                                      └─→ UPDATE categories
                                           SET name = ?, slug = ?, is_active = ?, updated_at = NOW()
                                           WHERE id = ?
                                └─→ ApiResponse::success($category)  → 200
  └─→ toast.success("Category updated")
  └─→ closeDrawer()
  └─→ fetchCategories(page)    → re-fetches to show updated data
```

### Security note

`abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403)` is checked **before** any update happens. Even if an attacker guesses another tenant's ULID and sends a PUT request with a valid token, they get a `403 Forbidden` and nothing is changed.

---

## 13. DELETE — Removing a Category

### Current implementation

In the current code, the **"Delete"** dropdown item exists in the UI but does not yet call the API — it is a placeholder. A full implementation would look like this:

```ts
async function handleDelete(ulid: string) {
  try {
    await apiFetch(`/categories/${ulid}`, { method: "DELETE" });
    setCategories(prev => prev.filter(c => c.ulid !== ulid));
    toast.success("Category deleted");
  } catch (err: any) {
    toast.error("Failed to delete category", err?.message);
  }
}
```

### Full chain (backend already implemented)

```
handleDelete(ulid)
  └─→ apiFetch("DELETE /categories/01J3XYZ...")
        └─→ DELETE http://localhost:8000/api/categories/01J3XYZ...
              └─→ Sanctum verifies token
                    └─→ Route model binding: finds category by ulid
                    └─→ CategoryController::destroy($request, $category)
                          └─→ abort_if(category.tenant_id !== user.tenant_id, 403)
                          └─→ $category->delete()
                                └─→ DELETE FROM categories WHERE id = ?
                          └─→ ApiResponse::noContent()  → 200, data: null
  └─→ setCategories(prev => prev.filter(c => c.ulid !== ulid))
  └─→ toast.success("Category deleted")
```

The row disappears from the table immediately via local state mutation — no re-fetch required.

---

## 14. Authentication & Tenant Isolation

### How authentication works end-to-end

```
1. User logs in via POST /api/auth/login
   └─→ Laravel returns:
         - access_token (short-lived JWT, e.g. 60 minutes)
         - httpOnly refresh_token cookie (long-lived, e.g. 7 days)

2. Frontend stores access_token in memory only (never localStorage)
   └─→ scheduleRefresh() sets a timer to refresh 60 seconds before expiry

3. Every API request includes:
   └─→ Authorization: Bearer <access_token>   (in the header)
   └─→ refresh_token cookie                   (browser sends automatically)

4. On 401 (token expired):
   └─→ request() calls POST /api/auth/refresh
         └─→ Laravel reads the httpOnly cookie, issues a new access_token
         └─→ Original request is replayed with new token

5. On page refresh:
   └─→ restoreSession() calls POST /api/auth/refresh
         └─→ Uses the httpOnly cookie to restore the session silently
         └─→ User stays logged in across browser sessions
```

### How tenant isolation works

Every controller action resolves the tenant from the authenticated user:

```php
$tenantId = $request->user()->currentTenantId();
```

This tenant ID is **never accepted from the client** — the frontend sends only the data (name, slug, etc.) and the server stamps the correct tenant ID. This means:

- A user cannot create data in another tenant's namespace.
- A user cannot read, update, or delete another tenant's records (verified by `abort_if` in each controller method).
- Even if a ULID is guessed, the tenant check prevents unauthorized access.

---

## 15. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React)                          │
│                                                             │
│  categories[]  ←─── setCategories()                        │
│  meta          ←─── setMeta()                               │
│  page          ──→  triggers useEffect                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ DataTable                                          │     │
│  │  - renders rows from categories[]                 │     │
│  │  - pagination via meta + onPageChange(setPage)    │     │
│  │  - skeleton loader when loading === true           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ SlidePanel (form)                                  │     │
│  │  - openCreate() → editingCategory = null           │     │
│  │  - openEdit(c)  → editingCategory = c              │     │
│  │  - handleSubmit() → POST or PUT                    │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    apiFetch() in api.ts
                    Authorization: Bearer <token>
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Laravel API (port 8000)                     │
│                                                             │
│  Sanctum middleware: validates Bearer token                 │
│           │                                                 │
│           ▼                                                 │
│  CategoryController                                         │
│    index()   → SELECT ... WHERE tenant_id=? LIMIT 15       │
│    store()   → INSERT INTO categories (...)                 │
│    update()  → UPDATE categories SET ... WHERE id=?        │
│    destroy() → DELETE FROM categories WHERE id=?           │
│           │                                                 │
│           ▼                                                 │
│  ApiResponse::paginated() / success() / created()          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (port 5434)                         │
│                                                             │
│  categories table                                           │
│  ┌──────┬──────────────┬───────────┬────────┬─────────┐    │
│  │  id  │     ulid     │ tenant_id │  name  │  slug   │    │
│  ├──────┼──────────────┼───────────┼────────┼─────────┤    │
│  │   1  │ 01J3XYZ...   │     7     │ Brakes │ brakes  │    │
│  │   2  │ 01J3XYA...   │     7     │ Filters│ filters │    │
│  └──────┴──────────────┴───────────┴────────┴─────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Operation summary

| Operation | HTTP | URL | DB Query | Response |
|-----------|------|-----|----------|----------|
| List | `GET` | `/api/categories?page=1` | `SELECT ... LIMIT 15` | `200` + data + meta |
| Create | `POST` | `/api/categories` | `INSERT INTO categories` | `201` + new record |
| Show | `GET` | `/api/categories/{ulid}` | `SELECT ... WHERE ulid=?` | `200` + record |
| Update | `PUT` | `/api/categories/{ulid}` | `UPDATE categories SET ...` | `200` + updated record |
| Delete | `DELETE` | `/api/categories/{ulid}` | `DELETE FROM categories` | `200` + null |
