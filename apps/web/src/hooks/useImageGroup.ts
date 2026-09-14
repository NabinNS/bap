"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { uploadImages, type FileUploadState } from "@/lib/upload";
import type { SavedImage } from "@/components/ui/form/MultiImageUpload";

/**
 * Attaches a single generic "image group" (the polymorphic imageable_type/imageable_ulid
 * mechanism already used for brand logos, category images, etc.) to any record — no schema
 * change needed on the record's own table. Pass the result straight to <MultiImageUpload>.
 */
export function useImageGroup(imageableType: string, folder: string, defaultGroupName: string) {
  const [images, setImages] = useState<File[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [savedGroupUlid, setSavedGroupUlid] = useState<string | null>(null);
  const [groupName, setGroupName] = useState(defaultGroupName);
  const [saving, setSaving] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);

  function reset() {
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName(defaultGroupName);
    setUploadStates([]);
  }

  // Call when the owning record is selected/loaded, to show whatever image is already attached.
  async function load(imageableUlid: string) {
    reset();
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
        `/image-groups?imageable_type=${imageableType}&imageable_ulid=${imageableUlid}`
      );
      const items = res.data.flatMap((g) => g.items);
      setSavedImages(items);
      if (res.data[0]) {
        setSavedGroupUlid(res.data[0].ulid);
        setGroupName(res.data[0].name);
      }
    } catch {
      // non-critical — form still works without a photo
    }
  }

  async function updateGroupName() {
    if (!savedGroupUlid || !groupName.trim()) return;
    try {
      await apiFetch(`/image-groups/${savedGroupUlid}`, {
        method: "PATCH",
        body: JSON.stringify({ name: groupName }),
      });
    } catch {
      // non-critical
    }
  }

  async function save(imageableUlid: string) {
    if (images.length === 0) return;
    setSaving(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(images, folder, setUploadStates);
      const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
        method: "POST",
        body: JSON.stringify({
          imageable_type: imageableType,
          imageable_ulid: imageableUlid,
          slug: imageableType,
          name: groupName || defaultGroupName,
        }),
      });
      await apiFetch(`/image-groups/${group.data.ulid}/items`, {
        method: "POST",
        body: JSON.stringify({
          items: uploaded.map((img, i) => ({ url: img.url, path: img.path, sort_order: i })),
        }),
      });
      setSavedGroupUlid(group.data.ulid);
      setSavedImages((prev) => [
        ...prev,
        ...uploaded.map((img, i) => ({ ulid: `temp-${Date.now()}-${i}`, url: img.url, path: img.path })),
      ]);
      setImages([]);
    } finally {
      setSaving(false);
    }
  }

  async function removeSaved(ulid: string) {
    await apiFetch(`/image-items/${ulid}`, { method: "DELETE" });
    setSavedImages((prev) => prev.filter((img) => img.ulid !== ulid));
  }

  return {
    images, setImages,
    savedImages,
    groupName, setGroupName,
    saving,
    uploadStates,
    load,
    reset,
    save,
    updateGroupName,
    removeSaved,
  };
}
