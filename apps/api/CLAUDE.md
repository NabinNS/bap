# API architecture — follow this for every CRUD, no matter how small

This Laravel app uses a strict layered pattern. Every new endpoint — even a tiny one-field
upsert — must follow the same shape. Don't shortcut it for "simple" CRUDs; the AccVendor
balance/transaction flow (`app/**/AccVendors/**`) is the reference implementation to copy from.

## The layers, in request order

```
routes/api.php
  → FormRequest        (validation + ->toDTO())
  → Controller          (auth check, one-line hand-off, wraps response)
  → Action               (business logic, orchestration, DB::transaction if multi-step)
  → Repository interface  (the only thing an Action is allowed to depend on for persistence)
  → Eloquent repository    (the ONLY place Eloquent models/query builders are touched)
  → Resource                 (shapes the response JSON)
```

## Rules

1. **Controllers stay thin.** Authorize, call one Action, wrap the result in `ApiResponse` +
   a Resource. No validation, no business logic, no array building in a controller.

2. **Validation lives in a `FormRequest`**, never inline `$request->validate([...])` in a
   controller. Add a `toDTO()` method on the request that returns a typed, `readonly` DTO —
   controllers pass `$request->toDTO()` to the Action, never `$request->validated()` (a raw
   array) unless the Action genuinely takes no structured input.

   ```php
   // Domain/{Area}/DTOs/XData.php
   readonly class XData
   {
       public function __construct(
           public string $name,
           public ?int   $fooId,
       ) {}
   }

   // Http/Requests/{Area}/StoreXRequest.php
   public function toDTO(): XData
   {
       $v = $this->validated();
       return new XData(name: $v['name'], fooId: $v['foo_id'] ?? null);
   }
   ```

3. **Actions never touch Eloquent directly.** No `Model::where(...)`, no `$model->relation()`,
   no `$model->update([...])`. An Action only calls methods on a `*RepositoryInterface`
   (constructor-injected) and other Actions. If an Action needs the database, add a method
   to the relevant repository interface instead of reaching for the model.

   Exception: reading a scalar attribute already on a model instance you already have in hand
   (e.g. `$balance->opening_balance`) is fine — that's not a new query. Building a new query,
   loading a relation, or writing to the DB is not.

4. **Repositories own persistence mapping, not business decisions.** A repository method takes
   a DTO (or explicit typed params for something with 1-2 fields) and maps it to columns. Simple
   value derivation that's really just "how does this DTO become a row" (e.g. `credit = 0 when
   items are present` on transaction creation) belongs in the repository. Genuine business
   *decisions* (e.g. "which fiscal year applies," "should this fail validation") belong in the
   Action.

   ```php
   // Domain/{Area}/Repositories/XRepositoryInterface.php
   interface XRepositoryInterface
   {
       public function create(int $tenantId, XData $data): X;
   }

   // Infrastructure/Repositories/{Area}/EloquentXRepository.php
   class EloquentXRepository implements XRepositoryInterface
   {
       public function create(int $tenantId, XData $data): X
       {
           return X::create([
               'tenant_id' => $tenantId,
               'name'      => $data->name,
           ]);
       }
   }
   ```

   Bind it in `AppServiceProvider::register()`:
   ```php
   $this->app->bind(XRepositoryInterface::class, EloquentXRepository::class);
   ```

5. **One Action per use case**, named for what it does (`CreateXAction`, `UpsertXAction`,
   `RecalculateXAction`), not generic CRUD verbs on a god-class. An Action can call other
   Actions (e.g. a create Action calling a recalculate Action) — that's the normal way logic
   gets reused across endpoints instead of duplicated.

6. **Multi-step writes are wrapped in `DB::transaction(...)`** inside the Action, so partial
   failures can't leave inconsistent rows. Locking (`->lockForUpdate()`) for anything that gets
   concurrently recalculated lives inside the repository method, not the Action.

7. **Responses are shaped by a `JsonResource`**, never a hand-built array in the controller.
   `whenLoaded(...)` for relationships that aren't always eager-loaded.

8. **Every response goes through `ApiResponse`** (`success`/`created`/`paginated`/`noContent`/
   `error`/etc.) for a consistent envelope — never a raw `response()->json([...])` in a
   controller.

9. **Avoid loose arrays crossing a layer boundary.** If you're about to pass
   `['some_field' => $x, 'other_field' => $y]` from a Controller into an Action, or from an
   Action into a Repository, stop — that data almost certainly deserves a DTO. The only arrays
   that should cross boundaries are things that are genuinely list-shaped (e.g. `items[]`), and
   even those should be arrays of DTOs, not arrays of arrays.

## Reference files to copy the shape from

- DTO: `app/Domain/AccVendors/DTOs/AccVendorTransactionData.php`
- FormRequest + `toDTO()`: `app/Http/Requests/AccVendors/StoreAccVendorTransactionRequest.php`
- Thin controller: `app/Http/Controllers/Api/AccVendorController.php`
- Action with real logic + repository-only deps: `app/Application/AccVendors/Actions/UpsertAccVendorBalanceAction.php`
- Repository interface + Eloquent impl pair: `app/Domain/AccVendors/Repositories/AccVendorBalanceRepositoryInterface.php` / `app/Infrastructure/Repositories/AccVendors/EloquentAccVendorBalanceRepository.php`
- Resource: `app/Http/Resources/AccVendors/AccVendorBalanceResource.php`

## Local dev notes

- `apps/api` runs in Docker (`bap_api`) with the repo **volume-mounted** — PHP changes are live
  immediately, no rebuild needed.
- `apps/web` runs in Docker (`bap_web`) via `docker-compose.override.yml`, which targets the
  Dockerfile's `dev` stage and bind-mounts the source — `next dev --turbopack` runs inside the
  container with hot reload, no rebuild needed for frontend changes either. The override is
  auto-merged by plain `docker compose ...` commands; a real production build (the `runner`
  stage, no source mount) only happens when the override is excluded, e.g.
  `docker compose -f docker-compose.yml build web`.
- Sanity-check a change with `docker exec bap_api php -l <file>` (syntax) and
  `docker exec bap_api php artisan route:list` (routes/DI still resolve).
