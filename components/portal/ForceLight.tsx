"use client";
import { useEffect } from "react";

export function ForceLight() {
  useEffect(() => {
    document.documentElement.dataset.portalMode = "light";
    return () => {
      delete document.documentElement.dataset.portalMode;
    };
  }, []);
  return null;
}
