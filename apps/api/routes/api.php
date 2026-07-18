<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ImageGroupController;
use App\Http\Controllers\Api\SliderController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('resolve.tenant')->group(function () {
    Route::get('brands', [BrandController::class, 'index']);
    Route::get('brands/{ulid}', [BrandController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{ulid}', [CategoryController::class, 'show']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{ulid}', [ProductController::class, 'show']);
    Route::get('sliders', [SliderController::class, 'index']);
    Route::get('sliders/{ulid}', [SliderController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('upload/{folder}', [UploadController::class, 'image']);
    Route::get('image-groups', [ImageGroupController::class, 'index']);
    Route::post('image-groups', [ImageGroupController::class, 'store']);
    Route::patch('image-groups/{ulid}', [ImageGroupController::class, 'update']);
    Route::post('image-groups/{ulid}/items', [ImageGroupController::class, 'storeItems']);
    Route::delete('image-items/{ulid}', [ImageGroupController::class, 'destroyItem']);
    Route::apiResource('brands', BrandController::class)->except(['index', 'show']);
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::apiResource('sliders', SliderController::class)->except(['index', 'show']);
});

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('refresh', [AuthController::class, 'refresh']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});
