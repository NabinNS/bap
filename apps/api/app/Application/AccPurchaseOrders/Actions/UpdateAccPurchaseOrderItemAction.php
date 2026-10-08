<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use Illuminate\Support\Facades\DB;

class UpdateAccPurchaseOrderItemAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId, AccPurchaseOrder $purchaseOrder, AccPurchaseOrderItem $item, AccPurchaseOrderItemData $data): AccPurchaseOrderItem
    {
        return DB::transaction(function () use ($tenantId, $item, $data) {
            $item = $this->purchaseOrders->lockItemForUpdate($item);

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            return $this->purchaseOrders->updateItem($item, $product, $data);
        });
    }
}
