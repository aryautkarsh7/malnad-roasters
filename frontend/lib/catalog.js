"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { idbDel, idbGet, idbSet } from "./idb";

/*
  Catalog cache strategy (stale-while-revalidate):
  - On mount the saved catalog from IndexedDB is shown immediately.
  - A request to the API always runs in the background; when it succeeds the
    screen and the cache are replaced with the fresh data.
  - If the request fails, the cached catalog stays on screen with a notice.
  - The refresh button calls the same loader, and admin edits clear the cache.
*/
const KEY = "catalog:v1";

export const clearCatalogCache = () => idbDel(KEY);

export function useCatalog() {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [slow, setSlow] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const gotFresh = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    const timer = setTimeout(() => setSlow(true), 4000);
    try {
      const fresh = await api("/products");
      const now = Date.now();
      gotFresh.current = true;
      await idbSet(KEY, { products: fresh, savedAt: now });
      setProducts(fresh);
      setSavedAt(now);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(timer);
      setSlow(false);
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    idbGet(KEY).then((cached) => {
      if (alive && !gotFresh.current && cached?.products) {
        setProducts(cached.products);
        setSavedAt(cached.savedAt);
        setLoading(false);
      }
    });
    load();
    return () => {
      alive = false;
    };
  }, [load]);

  return { products, loading, refreshing, error, slow, savedAt, refresh: load };
}
