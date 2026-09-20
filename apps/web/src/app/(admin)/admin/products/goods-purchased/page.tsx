"use client";

import { Suspense } from "react";
import { ProductGoodsEntry } from "../_components/ProductGoodsEntry";

export default function GoodsPurchased() {
  return (
    <Suspense>
      <ProductGoodsEntry type="purchase" />
    </Suspense>
  );
}
