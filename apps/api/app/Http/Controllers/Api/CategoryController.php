<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::where('tenant_id', $request->user()->currentTenantId())
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

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

        return response()->json($category, 201);
    }

    public function show(Request $request, Category $category)
    {
        abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403);

        return response()->json($category);
    }

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

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category)
    {
        abort_if($category->tenant_id !== $request->user()->currentTenantId(), 403);

        $category->delete();

        return response()->json(null, 204);
    }
}
