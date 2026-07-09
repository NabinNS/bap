# Image Group Flow

## Architecture layers

```
HTTP Request
  → FormRequest      (validates input)
  → Controller       (thin — calls action, returns response)
  → Action           (orchestrates — one job per action)
  → Repository       (all DB queries live here)
  → Resource         (formats the output)
```

---

## 1. Fetching images

**Route:** `GET /api/image-groups?imageable_type=product&imageable_ulid=xxx`

```
ListImageGroupsRequest   validates imageable_type and imageable_ulid
ListImageGroupsAction    resolves the product's integer ID from its ulid,
                         then fetches all image groups with their items
ImageGroupResource       formats each group into the JSON shape
ImageItemResource        formats each item inside the group
```

**Response:**
```json
[
  {
    "ulid": "...",
    "slug": "product-photos",
    "name": "Product Photos",
    "items": [
      { "ulid": "...", "url": "...", "path": "...", "sort_order": 0 }
    ]
  }
]
```

---

## 2. Creating a group

**Route:** `POST /api/image-groups`

```
StoreImageGroupRequest   validates + builds ImageGroupData DTO via toDTO()
CreateImageGroupAction   resolves imageable ID, calls repo->firstOrCreate()
                         (safe to call multiple times — won't duplicate)
```

Returns the group `ulid` so the frontend knows where to upload items next.

---

## 3. Uploading images into a group

**Route:** `POST /api/image-groups/{ulid}/items`

> Note: actual file upload to R2 happens on the frontend separately via a
> pre-signed URL. By the time this endpoint is called, the files are already
> in R2. This endpoint just saves the metadata (url + path) to the database.

```
StoreImageItemsRequest   validates items array, builds []ImageItemData via toDTOs()
AddImageItemsAction      finds the group by ulid, calls repo->addItems()
repo->addItems()         inserts one ImageItem row per file
```

---

## 4. Deleting an image item

**Route:** `DELETE /api/image-items/{ulid}`

```
DeleteImageItemAction    finds the ImageItem by ulid + tenant_id, calls delete()
ImageItemObserver        fires automatically on delete — removes the file from R2
```

The observer handles R2 cleanup so the action doesn't need to know about storage.

---

## 5. Renaming a group

**Route:** `PATCH /api/image-groups/{ulid}`

```
UpdateImageGroupRequest  validates name is present
UpdateImageGroupAction   finds group, calls repo->updateName()
```

---

## Repository methods explained (`EloquentImageGroupRepository`)

| Method | What it does |
|--------|-------------|
| `resolveImageableId` | Converts a public ulid (e.g. product ulid) into the internal integer `id` needed for DB queries |
| `listForImageable` | Fetches all groups for a given entity (e.g. a product), with `imageItems` eager loaded to avoid N+1 |
| `findByUlid` | Finds a single group by its public ulid scoped to the tenant |
| `firstOrCreate` | Creates a group only if one with the same `imageable_type + imageable_id + slug` doesn't exist — safe to call repeatedly |
| `updateName` | Updates the group name and returns a fresh copy from DB |
| `addItems` | Inserts multiple `ImageItem` rows into a group in a loop |

---

## What `ImageGroupResource` returns

```php
return [
    'ulid'  => $this->ulid,
    'slug'  => $this->slug,
    'name'  => $this->name,
    'items' => ImageItemResource::collection($this->whenLoaded('imageItems')),
];
```

- `$this->ulid / slug / name` — just the model's column values
- `ImageItemResource::collection(...)` — runs each `ImageItem` through `ImageItemResource::toArray()` to produce a consistent array shape
- `$this->whenLoaded('imageItems')` — only includes `items` in the response if the relation was eager loaded (prevents accidental N+1 queries). If not loaded, the key is omitted entirely from the JSON.
