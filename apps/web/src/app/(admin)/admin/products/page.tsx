"use client";

import { Suspense } from "react";
import { ProductsWorkspace } from "./_components/ProductsWorkspace";

export default function AdminProducts() {
  return (
    <Suspense>
      <ProductsWorkspace />
    </Suspense>
  );
}
