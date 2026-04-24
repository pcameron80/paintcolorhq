"use client";

import { useState } from "react";
import Link from "next/link";

interface TagFilterProps {
  tags: string[];
  activeTag?: string;
  initialCount?: number;
}

export function TagFilter({ tags, activeTag, initialCount = 5 }: TagFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleTags = expanded ? tags : tags.slice(0, initialCount);
  const hasMore = tags.length > initialCount;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Link
        href="/blog"
        className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${!activeTag ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
      >
        All
      </Link>
      {visibleTags.map((tag) => (
        <Link
          key={tag}
          href={`/blog?tag=${encodeURIComponent(tag.toLowerCase())}`}
          className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${activeTag?.toLowerCase() === tag.toLowerCase() ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
        >
          {tag}
        </Link>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-full px-4 py-2 text-sm font-headline font-bold text-primary hover:underline underline-offset-4 transition-all"
        >
          {expanded ? "Show less" : `+${tags.length - initialCount} more`}
        </button>
      )}
    </div>
  );
}
