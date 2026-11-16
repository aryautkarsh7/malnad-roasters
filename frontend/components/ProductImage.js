"use client";
import { useState } from "react";

export default function ProductImage({ src, alt, className = "thumb", eager = false }) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={failed || !src ? "/products/placeholder.svg" : src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
