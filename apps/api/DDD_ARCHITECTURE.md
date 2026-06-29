# DDD Architecture — BAP Laravel API

This document explains the full DDD (Domain-Driven Design) structure of the Laravel backend — what each folder contains, why it exists, and exactly how a request travels through every layer from the browser to the database and back.

---

## Table of Contents

1. [Folder Structure Overview](#1-folder-structure-overview)
2. [Where the First Request Lands](#2-where-the-first-request-lands)
3. [Layer 1 — HTTP (Controllers, Requests, Resources)](#3-layer-1--http-controllers-requests-resources)
4. [Layer 2 — Application (Actions, Services)](#4-layer-2--application-actions-services)
5. [Layer 3 — Domain (DTOs, Repositories Interface, Services)](#5-layer-3--domain-dtos-repository-interface-services)
6. [Layer 4 — Infrastructure (Repositories, Storage)](#6-layer-4--infrastructure-repositories-storage)
7. [Layer 5 — Models](#7-layer-5--models)
8. [The Glue — AppServiceProvider](#8-the-glue--appserviceprovider)
9. [How Every Layer Links Together](#9-how-every-layer-links-together)
10. [Full Request Traces](#10-full-request-traces)
    - [CREATE — POST /api/categories](#create--post-apicategories)
    - [LIST — GET /api/categories](#list--get-apicategories)
    - [UPDATE — PUT /api/categories/{ulid}](#update--put-apicategoriesulid)
    - [DELETE — DELETE /api/categories/{ulid}](#delete--delete-apicategoriesulid)
11. [Dependency Flow Diagram](#11-dependency-flow-diagram)
12. [Rule — What Each Layer Is Allowed to Know](#12-rule--what-each-layer-is-allowed-to-know)

---

## 1. Folder Structure Overview

```
apps/api/app/
│
├── Http/                          ← Layer 1: HTTP boundary (entry point)
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   └── UploadController.php
│   ├── Requests/Catalog/
│   │   ├── StoreCategoryRequest.php
│   │   └── UpdateCategoryRequest.php
│   └── Resources/
│       └── ApiResponse.php
│
├── Application/                   ← Layer 2: Use cases (what the app can do)
│   ├── Catalog/Actions/
│   │   ├── ListCategoriesAction.php
│   │   ├── CreateCategoryAction.php
│   │   ├── UpdateCategoryAction.php
│   │   └── DeleteCategoryAction.php
│   └── Auth/
│       └── IssueTokensService.php
│
├── Domain/                        ← Layer 3: Core business rules (pure logic)
│   └── Catalog/
│       ├── DTOs/
│       │   └── CategoryData.php
│       ├── Repositories/
│       │   └── CategoryRepositoryInterface.php
│       └── Services/
│           └── SlugService.php
│
├── Infrastructure/                ← Layer 4: External systems (DB, storage)
│   ├── Repositories/
│   │   └── EloquentCategoryRepository.php
│   └── Storage/
│       └── R2ImageUploader.php
│
├── Models/                        ← Layer 5: Eloquent entities
│   ├── Category.php
│   ├── Tenant.php
│   ├── User.php
│   └── Concerns/
│       └── HasPublicUlid.php
│
└── Providers/
    └── AppServiceProvider.php     ← The glue: wires interfaces to implementations
```

---

## 2. Where the First Request Lands

Every HTTP request first hits the **router**, then the **FormRequest** (for validation), then the **Controller**.

### The Router — `routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('categories', CategoryController::class);
});
```

`Route::apiResource` expands into 5 routes automatically:

| HTTP Method | URL | Controller Method | What it does |
|-------------|-----|-------------------|--------------|
| `GET` | `/api/categories` | `index` | List all (paginated) |
| `POST` | `/api/categories` | `store` | Create new |
| `GET` | `/api/categories/{category}` | `show` | Get one |
| `PUT` | `/api/categories/{category}` | `update` | Edit one |
| `DELETE` | `/api/categories/{category}` | `destroy` | Delete one |

**Before** any controller method runs, `auth:sanctum` middleware verifies the Bearer token. If the token is missing or invalid, Laravel returns `401 Unauthorized` immediately — the controller is never touched.

For `PUT` and `DELETE`, Laravel also automatically resolves the `{category}` URL segment into a `Category` model instance using **route model binding** — it runs `SELECT * FROM categories WHERE ulid = ? LIMIT 1` behind the scenes (because `HasPublicUlid` sets `getRouteKeyName()` to `'ulid'`).

---

## 3. Layer 1 — HTTP (Controllers, Requests, Resources)

**Location:** `app/Http/`

**Rule:** This layer is only allowed to handle HTTP concerns — reading from the request, delegating work, and returning a response. No business logic, no database queries.

---

### `Http/Requests/Catalog/StoreCategoryRequest.php`

**What it does:** Validates incoming POST data and converts it into a typed `CategoryData` DTO.

```php
class StoreCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function toDTO(): CategoryData
    {
        $v = $this->validated();
        return new CategoryData(
            name:        $v['name'],
            slug:        $v['slug'] ?? null,
            description: $v['description'] ?? null,
            image:       $v['image'] ?? null,
            isActive:    $v['is_active'] ?? true,
            sortOrder:   $v['sort_order'] ?? 0,
        );
    }
}
```

**How it links:** Laravel automatically resolves and runs this before `CategoryController::store()` is called. If validation fails, a `422` is returned and the controller never runs. If it passes, the controller receives `$request` which already has `toDTO()` available.

---

### `Http/Requests/Catalog/UpdateCategoryRequest.php`

Same structure as `StoreCategoryRequest` with two differences:
- `name` uses `'sometimes'` instead of `'required'` — you can update just `is_active` without sending `name`
- `toDTO()` falls back to the existing model's values for fields that weren't sent:

```php
public function toDTO(): CategoryData
{
    $v = $this->validated();
    return new CategoryData(
        name:     $v['name'] ?? $this->route('category')->name,      // ← existing value fallback
        slug:     $v['slug'] ?? null,
        isActive: $v['is_active'] ?? $this->route('category')->is_active,
        sortOrder: $v['sort_order'] ?? $this->route('category')->sort_order,
        ...
    );
}
```

`$this->route('category')` gives access to the already-resolved `Category` model from route model binding.

---

### `Http/Controllers/Api/CategoryController.php`

**What it does:** Receives the validated request, reads the tenant ID, calls the correct Action, returns the JSON response.

```php
class CategoryController extends Controller
{
    public function store(StoreCategoryRequest $request, CreateCategoryAction $action): JsonResponse
    {
        return ApiResponse::created(
            $action->execute($request->user()->currentTenantId(), $request->toDTO()),
            'Category created successfully'
        );
    }
}
```

**How Laravel injects the Action:** When Laravel sees `CreateCategoryAction $action` in the method signature, it asks its service container to build one. The container sees `CreateCategoryAction` needs a `CategoryRepositoryInterface` and a `SlugService`, checks the bindings in `AppServiceProvider`, and injects `EloquentCategoryRepository` for the interface. All of this happens automatically — you never call `new CreateCategoryAction()`.

**Three jobs only:**
1. Get tenant ID from authenticated user: `$request->user()->currentTenantId()`
2. Convert request to DTO: `$request->toDTO()`
3. Return the JSON response: `ApiResponse::created(...)`

---

### `Http/Controllers/Api/AuthController.php`

**What it does:** Handles login, refresh, logout, and me. Delegates token creation to `IssueTokensService`.

```php
class AuthController extends Controller
{
    public function __construct(private IssueTokensService $issueTokensService) {}

    public function login(Request $request): JsonResponse
    {
        // 1. validate credentials
        // 2. find user
        // 3. verify password
        return $this->issueTokensService->issue($user);  // ← delegate token creation
    }
}
```

Before DDD, `issueTokens()` was a private method in this controller. Now it lives in its own service, making it testable and reusable.

---

### `Http/Controllers/Api/UploadController.php`

**What it does:** Validates the uploaded file, delegates the actual upload to `R2ImageUploader`.

```php
class UploadController extends Controller
{
    public function __construct(private R2ImageUploader $uploader) {}

    public function image(Request $request, string $folder)
    {
        $request->validate(['image' => ['required', 'image', 'max:...']]);
        abort_unless(in_array($folder, config('upload.allowed_folders')), 422);

        return response()->json(
            $this->uploader->upload($request->file('image'), $folder)
        );
    }
}
```

---

### `Http/Resources/ApiResponse.php`

**What it does:** Ensures every API response has the same JSON shape. Every controller method returns through this.

```php
// Success shapes:
ApiResponse::success($data, 'message')    // 200 → { success, message, data }
ApiResponse::created($data, 'message')    // 201 → { success, message, data }
ApiResponse::noContent('message')         // 200 → { success, message, data: null }
ApiResponse::paginated($paginator, 'msg') // 200 → { success, message, data[], meta{} }

// Error shapes:
ApiResponse::error('message', 400)        // 4xx → { success: false, message }
ApiResponse::notFound()                   // 404
ApiResponse::unauthorized()               // 401
ApiResponse::forbidden()                  // 403
```

---

## 4. Layer 2 — Application (Actions, Services)

**Location:** `app/Application/`

**Rule:** This layer orchestrates use cases. It calls Domain services and Repositories. It knows nothing about HTTP — no `$request`, no `response()`, no `abort()`.

One class = one operation. If you need to know what the app can do, read the Actions folder — it is the list of every operation.

---

### `Application/Catalog/Actions/ListCategoriesAction.php`

```php
class ListCategoriesAction
{
    public function __construct(private CategoryRepositoryInterface $categories) {}

    public function execute(int $tenantId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->categories->paginate($tenantId, $perPage);
    }
}
```

**Links to:** `CategoryRepositoryInterface` (Domain) → resolved to `EloquentCategoryRepository` (Infrastructure) by the container.

---

### `Application/Catalog/Actions/CreateCategoryAction.php`

```php
class CreateCategoryAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
        private SlugService $slugService,
    ) {}

    public function execute(int $tenantId, CategoryData $data): Category
    {
        $resolved = new CategoryData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        return $this->categories->create($tenantId, $resolved);
    }
}
```

**Links to:**
- `SlugService` (Domain) — applies the "derive slug from name" rule
- `CategoryRepositoryInterface` (Domain) — resolved to `EloquentCategoryRepository` for the INSERT

---

### `Application/Catalog/Actions/UpdateCategoryAction.php`

```php
class UpdateCategoryAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
        private SlugService $slugService,
    ) {}

    public function execute(Category $category, CategoryData $data): Category
    {
        $resolved = new CategoryData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        return $this->categories->update($category, $resolved);
    }
}
```

**Note:** Receives the already-resolved `Category` model from the controller (from route model binding). The action does not look up the category itself — that is the HTTP layer's job.

---

### `Application/Catalog/Actions/DeleteCategoryAction.php`

```php
class DeleteCategoryAction
{
    public function __construct(private CategoryRepositoryInterface $categories) {}

    public function execute(Category $category): void
    {
        $this->categories->delete($category);
    }
}
```

Smallest action — one method call. Still worth isolating because it is a distinct operation with its own testability and future extensibility (e.g. firing a `CategoryDeleted` event later).

---

### `Application/Auth/IssueTokensService.php`

**What it does:** Creates the access token + refresh token pair, builds the httpOnly cookie, and returns the JSON response with both.

```php
class IssueTokensService
{
    private const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
    private const REFRESH_TOKEN_EXPIRY_DAYS   = 30;
    private const REFRESH_COOKIE              = 'refresh_token';

    public function issue(User $user): JsonResponse { ... }
    public function cookieName(): string { return self::REFRESH_COOKIE; }
}
```

**Links to:** `AuthController` which calls `$this->issueTokensService->issue($user)` in both `login()` and `refresh()`. Extracted here because both methods needed the exact same token-creation logic — one place, not duplicated.

---

## 5. Layer 3 — Domain (DTOs, Repository Interface, Services)

**Location:** `app/Domain/`

**Rule:** This is the purest layer. No Laravel HTTP facades, no Eloquent queries, no external services. Just PHP classes that define what data looks like and what rules exist.

---

### `Domain/Catalog/DTOs/CategoryData.php`

**What it does:** A typed data carrier. Replaces passing raw `array` between layers.

```php
readonly class CategoryData
{
    public function __construct(
        public string  $name,
        public ?string $slug,
        public ?string $description,
        public ?string $image,
        public bool    $isActive,
        public int     $sortOrder,
    ) {}
}
```

**`readonly`** means once created, the properties cannot be changed — the data is immutable. If you need a modified version (like with slug resolved), you create a new `CategoryData` instance.

**Why it replaces arrays:**

```php
// Old way — array, no type safety, typos not caught until runtime
$data = ['name' => 'Brakes', 'is_active' => true, 'isActive' => true]; // which is it?

// New way — typed, IDE autocomplete, typos caught at compile time
$data->isActive   // always correct
$data->is_active  // PHP error immediately
```

**Links to:** `StoreCategoryRequest::toDTO()` creates it. `CreateCategoryAction` reads it. `EloquentCategoryRepository` maps it to Eloquent column names.

---

### `Domain/Catalog/Repositories/CategoryRepositoryInterface.php`

**What it does:** Defines the *contract* for how categories are stored and retrieved. Does not implement anything — just declares what methods must exist.

```php
interface CategoryRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;
    public function create(int $tenantId, CategoryData $data): Category;
    public function update(Category $category, CategoryData $data): Category;
    public function delete(Category $category): void;
}
```

**Why an interface and not a class?**

The Domain layer should not know or care that you are using PostgreSQL, Eloquent, or any specific database. It just says: *"I need something that can paginate, create, update, and delete categories."*

Tomorrow, if you switch from Eloquent to a raw PDO implementation or a different ORM, you only write a new class that implements this interface. Zero changes in the Domain, Application, or HTTP layers.

The binding in `AppServiceProvider` is the only line that decides which concrete implementation is used.

---

### `Domain/Catalog/Services/SlugService.php`

**What it does:** Holds the single business rule: *"if no slug is provided, derive it from the name."*

```php
class SlugService
{
    public function resolve(?string $slug, string $name): string
    {
        return $slug ?? Str::slug($name);
    }
}
```

**Why isolate this one line?** Because both `CreateCategoryAction` and `UpdateCategoryAction` need it. Before DDD, this rule was copy-pasted in two controller methods. Now there is exactly one place. If the rule changes (e.g. prefix with tenant slug), you change one file.

---

## 6. Layer 4 — Infrastructure (Repositories, Storage)

**Location:** `app/Infrastructure/`

**Rule:** This layer contains all code that talks to external systems — the database, cloud storage, third-party APIs. It implements the interfaces defined in the Domain layer.

---

### `Infrastructure/Repositories/EloquentCategoryRepository.php`

**What it does:** Implements `CategoryRepositoryInterface` using Laravel's Eloquent ORM. All database queries for categories live here and only here.

```php
class EloquentCategoryRepository implements CategoryRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator
    {
        return Category::where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function create(int $tenantId, CategoryData $data): Category
    {
        return Category::create([
            'tenant_id'   => $tenantId,
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'image'       => $data->image,
            'is_active'   => $data->isActive,  // ← maps camelCase DTO to snake_case DB column
            'sort_order'  => $data->sortOrder,
        ]);
    }

    public function update(Category $category, CategoryData $data): Category
    {
        $category->update([...]);
        return $category->fresh();  // ← re-fetches from DB to get updated timestamps
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}
```

**Key responsibility here:** mapping `CategoryData` (camelCase) to the database column names (snake_case). `$data->isActive` → `'is_active'`. This mapping lives in one place — the repository.

**Links to:** Implements `CategoryRepositoryInterface`. Uses `Category` Eloquent model. Bound in `AppServiceProvider`.

---

### `Infrastructure/Storage/R2ImageUploader.php`

**What it does:** Contains the Cloudflare R2 upload logic — previously buried in `UploadController`.

```php
class R2ImageUploader
{
    public function upload(UploadedFile $file, string $folder): array
    {
        $path   = $folder . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('r2')->writeStream($path, $stream, ['visibility' => 'public']);
        fclose($stream);

        return ['url' => Storage::disk('r2')->url($path), 'path' => $path];
    }
}
```

**Links to:** Injected into `UploadController` via constructor. Returns an array with `url` and `path`.

---

## 7. Layer 5 — Models

**Location:** `app/Models/`

**Rule:** Eloquent models represent database tables and their relationships. They stay here — they are not split into the Domain layer because Eloquent is too tightly coupled to Laravel to treat as "pure domain objects."

---

### `Models/Category.php`

```php
class Category extends Model
{
    use HasPublicUlid;

    protected $fillable = ['tenant_id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];
}
```

`$fillable` — the only columns that `Category::create()` and `$category->update()` are allowed to mass-assign.
`$casts` — automatically converts `is_active` between database `0/1` and PHP `true/false`.

---

### `Models/Concerns/HasPublicUlid.php`

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

    public function getRouteKeyName(): string { return 'ulid'; }

    public function initializeHasPublicUlid(): void { $this->hidden[] = 'id'; }
}
```

Used by `Category`, `User`, and `Tenant`. Three jobs:
- Auto-generate a ULID when a model is first created
- Tell Laravel to bind routes by `ulid` not `id`
- Hide the raw numeric `id` from all JSON responses

---

## 8. The Glue — AppServiceProvider

**Location:** `app/Providers/AppServiceProvider.php`

```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            CategoryRepositoryInterface::class,   // when anyone asks for this...
            EloquentCategoryRepository::class,    // ...give them this
        );
    }
}
```

This is the **only place in the entire codebase** that knows `EloquentCategoryRepository` exists. Every other class — Actions, Controllers — only knows about the interface. This single line is what makes the whole system swappable.

If you wanted to switch to a different database or add a caching layer, you would write a new class implementing `CategoryRepositoryInterface` and change this one line.

---

## 9. How Every Layer Links Together

```
routes/api.php
    │
    │  declares 5 routes, protects with auth:sanctum
    ▼
StoreCategoryRequest / UpdateCategoryRequest        [Http/Requests]
    │
    │  validates fields, returns 422 if invalid
    │  calls toDTO() → creates CategoryData
    ▼
CategoryController                                  [Http/Controllers]
    │
    │  reads tenant ID from authenticated user
    │  receives Action via constructor injection
    │  calls $action->execute(tenantId, dto)
    │  returns ApiResponse::created/success/etc
    ▼
CreateCategoryAction / UpdateCategoryAction / etc   [Application/Actions]
    │
    │  receives CategoryData DTO
    │  calls SlugService to resolve the slug
    │  calls repository->create() or ->update()
    ▼
SlugService                                         [Domain/Services]
    │
    │  applies "use slug or derive from name" rule
    │  returns resolved slug string
    ▼
CategoryRepositoryInterface                         [Domain/Repositories]
    │
    │  the contract — just an interface
    │  AppServiceProvider resolves this to:
    ▼
EloquentCategoryRepository                          [Infrastructure/Repositories]
    │
    │  maps CategoryData (camelCase) to DB columns (snake_case)
    │  runs Eloquent query: Category::create(), ->update(), ->delete()
    ▼
Category (Eloquent Model)                           [Models]
    │
    │  HasPublicUlid generates ulid on creating event
    │  $fillable protects mass-assignment
    │  $casts converts is_active 0/1 ↔ true/false
    ▼
PostgreSQL database
    │
    │  INSERT / SELECT / UPDATE / DELETE
    │  returns result back up the chain
    ▼
EloquentCategoryRepository returns Category model
    ▼
Action returns Category model to Controller
    ▼
Controller wraps it: ApiResponse::created($category)
    ▼
JSON response sent to frontend
```

---

## 10. Full Request Traces

### CREATE — POST /api/categories

```
Browser sends:
POST /api/categories
Authorization: Bearer <token>
{ "name": "Brake Parts", "is_active": true }

─────────────────────────────────────────────────
1. auth:sanctum middleware
   → verifies Bearer token
   → if invalid: return 401, stop here

2. Laravel resolves StoreCategoryRequest
   → runs rules(): name required ✓, is_active boolean ✓
   → if fails: return 422 with errors{}, stop here
   → calls toDTO(): creates CategoryData(name:"Brake Parts", slug:null, isActive:true, ...)

3. CategoryController::store($request, $action)
   → $request->user()->currentTenantId() = 7
   → $request->toDTO() = CategoryData{...}
   → calls $action->execute(7, CategoryData{...})

4. CreateCategoryAction::execute(7, CategoryData{...})
   → calls SlugService->resolve(null, "Brake Parts")
        → returns "brake-parts"
   → creates new CategoryData with slug:"brake-parts"
   → calls $categories->create(7, resolved CategoryData)

5. EloquentCategoryRepository::create(7, CategoryData{...})
   → Category::create([
         'tenant_id'  => 7,
         'name'       => 'Brake Parts',
         'slug'       => 'brake-parts',
         'is_active'  => true,
         'sort_order' => 0,
      ])
   → HasPublicUlid::bootHasPublicUlid fires
        → generates ulid = "01J3XYZ..."
   → SQL: INSERT INTO categories (ulid, tenant_id, name, slug, is_active, ...)
          VALUES ('01J3XYZ...', 7, 'Brake Parts', 'brake-parts', true, ...)
   → returns Category model

6. Action returns Category model to Controller
7. Controller: return ApiResponse::created($category, 'Category created successfully')
8. JSON sent to browser:
   {
     "success": true,
     "message": "Category created successfully",
     "data": { "ulid": "01J3XYZ...", "name": "Brake Parts", "slug": "brake-parts", ... }
   }
   HTTP 201 Created
```

---

### LIST — GET /api/categories

```
Browser sends:
GET /api/categories?page=2&per_page=15
Authorization: Bearer <token>

─────────────────────────────────────────────────
1. auth:sanctum → verifies token

2. CategoryController::index($request, $action)
   → $request->user()->currentTenantId() = 7
   → $request->integer('per_page', 15) = 15
   → calls $action->execute(7, 15)

3. ListCategoriesAction::execute(7, 15)
   → calls $categories->paginate(7, 15)

4. EloquentCategoryRepository::paginate(7, 15)
   → SQL: SELECT COUNT(*) FROM categories WHERE tenant_id = 7   → 42 total
   → SQL: SELECT * FROM categories WHERE tenant_id = 7
          ORDER BY sort_order, name
          LIMIT 15 OFFSET 15    ← page 2 = skip first 15
   → returns LengthAwarePaginator with 15 rows + meta

5. Controller: return ApiResponse::paginated($paginator)
6. JSON sent:
   {
     "success": true,
     "data": [ ...15 categories... ],
     "meta": { "total": 42, "per_page": 15, "current_page": 2, "last_page": 3, "from": 16, "to": 30 }
   }
```

---

### UPDATE — PUT /api/categories/{ulid}

```
Browser sends:
PUT /api/categories/01J3XYZ...
Authorization: Bearer <token>
{ "name": "Brake Components", "is_active": false }

─────────────────────────────────────────────────
1. auth:sanctum → verifies token

2. Route model binding
   → sees {category} in URL = "01J3XYZ..."
   → HasPublicUlid::getRouteKeyName() returns 'ulid'
   → SQL: SELECT * FROM categories WHERE ulid = '01J3XYZ...' LIMIT 1
   → if not found: return 404 automatically

3. UpdateCategoryRequest validation
   → name: 'sometimes' ✓ (sent), string ✓
   → is_active: boolean ✓
   → toDTO():
       name:     "Brake Components"
       slug:     null                      ← not sent, will be re-derived
       isActive: false
       sortOrder: $this->route('category')->sort_order  ← fallback to existing value = 0

4. CategoryController::update($request, $category, $action)
   → abort_if($category->tenant_id !== 7, 403)   ← tenant ownership check
   → calls $action->execute($category, $request->toDTO())

5. UpdateCategoryAction::execute($category, CategoryData{...})
   → SlugService->resolve(null, "Brake Components") = "brake-components"
   → creates resolved CategoryData with slug:"brake-components"
   → calls $categories->update($category, resolved CategoryData)

6. EloquentCategoryRepository::update($category, CategoryData{...})
   → SQL: UPDATE categories
          SET name='Brake Components', slug='brake-components', is_active=false, updated_at=NOW()
          WHERE id = 1
   → $category->fresh() → re-fetches updated row from DB
   → returns updated Category model

7. Controller: return ApiResponse::success($category, 'Category updated successfully')
8. JSON sent:
   {
     "success": true,
     "message": "Category updated successfully",
     "data": { "ulid": "01J3XYZ...", "name": "Brake Components", "slug": "brake-components", "is_active": false, ... }
   }
```

---

### DELETE — DELETE /api/categories/{ulid}

```
Browser sends:
DELETE /api/categories/01J3XYZ...
Authorization: Bearer <token>

─────────────────────────────────────────────────
1. auth:sanctum → verifies token
2. Route model binding → finds Category by ulid, or 404
3. No FormRequest needed — no body to validate

4. CategoryController::destroy($request, $category, $action)
   → abort_if($category->tenant_id !== 7, 403)
   → calls $action->execute($category)

5. DeleteCategoryAction::execute($category)
   → calls $categories->delete($category)

6. EloquentCategoryRepository::delete($category)
   → SQL: DELETE FROM categories WHERE id = 1

7. Controller: return ApiResponse::noContent('Category deleted successfully')
8. JSON sent:
   { "success": true, "message": "Category deleted successfully", "data": null }
```

---

## 11. Dependency Flow Diagram

Arrows show which layer depends on which. Dependencies always point inward — outer layers know about inner layers, never the reverse.

```
┌─────────────────────────────────────────────────────────────┐
│  HTTP Layer                                                 │
│  Controllers / FormRequests / ApiResponse                   │
│                                                             │
│  knows about: Application, Domain (DTOs), Models           │
└────────────────────────────┬────────────────────────────────┘
                             │ calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Application Layer                                          │
│  Actions / IssueTokensService                               │
│                                                             │
│  knows about: Domain (interface + DTOs + services), Models  │
└────────────────────────────┬────────────────────────────────┘
                             │ calls interface
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer                                               │
│  CategoryRepositoryInterface / CategoryData / SlugService   │
│                                                             │
│  knows about: nothing outside itself                        │
└────────────────────────────┬────────────────────────────────┘
                             │ implemented by
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                       │
│  EloquentCategoryRepository / R2ImageUploader               │
│                                                             │
│  knows about: Domain (implements interface), Models         │
└────────────────────────────┬────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Models                                                     │
│  Category / User / Tenant                                   │
│                                                             │
│  knows about: Laravel Eloquent, HasPublicUlid trait         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                      PostgreSQL Database
```

---

## 12. Rule — What Each Layer Is Allowed to Know

| Layer | Can use | Cannot use |
|-------|---------|------------|
| **HTTP** | FormRequest, Controller, ApiResponse, Actions, DTOs | Raw Eloquent queries, business logic |
| **Application** | Domain interfaces, DTOs, Domain services, Models | `$request`, `response()`, `abort()` |
| **Domain** | Pure PHP, `Str::slug()` | Eloquent, HTTP, external APIs |
| **Infrastructure** | Eloquent, Storage facades, Domain interfaces | HTTP layer, Application layer |
| **Models** | Eloquent, traits | Business logic, HTTP, Repositories |

This boundary is what makes each layer independently testable and replaceable.
