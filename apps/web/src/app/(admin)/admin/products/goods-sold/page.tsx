"use client";

import { Suspense } from "react";
import { ProductGoodsEntry } from "../_components/ProductGoodsEntry";

export default function GoodsSold() {
  return (
    <Suspense>
      <ProductGoodsEntry type="sale" />
    </Suspense>
  );
}
