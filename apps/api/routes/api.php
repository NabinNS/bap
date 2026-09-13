<?php

use App\Http\Controllers\Api\AccVendorController;
use App\Http\Controllers\Api\AccVendorBalanceController;
use App\Http\Controllers\Api\AccVendorTransactionController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\FiscalYearController;
use App\Http\Controllers\Api\TenantSettingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductDiscountController;
use App\Http\Controllers\Api\ImageGroupController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\SliderController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('resolve.tenant')->group(function () {
    Route::get('brands', [BrandController::class, 'index']);
    Route::get('brands/{brand}', [BrandController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/search', [ProductController::class, 'search']);
    Route::get('products/{ulid}', [ProductController::class, 'show']);
    Route::get('sliders', [SliderController::class, 'index']);
    Route::get('sliders/{slider}', [SliderController::class, 'show']);
    Route::get('offers', [OfferController::class, 'index']);
    Route::get('offers/{offer}', [OfferController::class, 'show']);
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
    Route::get('products/{product}/discounts', [ProductDiscountController::class, 'index']);
    Route::post('products/{product}/discounts', [ProductDiscountController::class, 'store']);
    Route::put('products/{product}/discounts/{discount}', [ProductDiscountController::class, 'update']);
    Route::delete('products/{product}/discounts/{discount}', [ProductDiscountController::class, 'destroy']);
    Route::apiResource('sliders', SliderController::class)->except(['index', 'show']);
    Route::apiResource('offers', OfferController::class)->except(['index', 'show']);
    Route::apiResource('acc-vendors', AccVendorController::class);
    Route::post('acc-vendors/{accVendor}/balance', [AccVendorBalanceController::class, 'upsert']);
    Route::get('acc-vendors/{accVendor}/transactions', [AccVendorTransactionController::class, 'index']);
    Route::post('acc-vendors/{accVendor}/transactions', [AccVendorTransactionController::class, 'store']);
    Route::post('acc-vendors/{accVendor}/transactions/{transaction}/items', [AccVendorTransactionController::class, 'storeItem']);
    Route::patch('acc-vendors/{accVendor}/transactions/{transaction}/totals', [AccVendorTransactionController::class, 'updateTotals']);
    Route::patch('acc-vendors/{accVendor}/transactions/{transaction}', [AccVendorTransactionController::class, 'update']);
    Route::delete('acc-vendors/{accVendor}/transactions/{transaction}', [AccVendorTransactionController::class, 'destroy']);
    Route::patch('acc-vendors/{accVendor}/transactions/{transaction}/items/{item}', [AccVendorTransactionController::class, 'updateItem']);
    Route::delete('acc-vendors/{accVendor}/transactions/{transaction}/items/{item}', [AccVendorTransactionController::class, 'destroyItem']);
    Route::get('settings/bootstrap', [TenantSettingController::class, 'bootstrap']);
    Route::get('tenant', [TenantController::class, 'show']);
    Route::put('tenant', [TenantController::class, 'update']);
    Route::get('settings', [TenantSettingController::class, 'show']);
    Route::put('settings', [TenantSettingController::class, 'update']);
    Route::get('fiscal-years', [FiscalYearController::class, 'index']);
});

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('refresh', [AuthController::class, 'refresh']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});
