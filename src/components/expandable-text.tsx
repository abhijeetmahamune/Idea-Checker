'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  content: string;
  label?: string;
}

/**
 * Shows a truncated 3-line preview of text with a "Read full solution" toggle.
 * Used in the evaluation-view's Problem & Solution context card.
 */
export function ExpandableText({ content, label = 'solution' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show toggle if content is long enough to be truncated
  const isLong = content.length > 200;

  return (
    <div>
      <p
        className={`text-foreground/80 leading-relaxed mt-0.5 text-sm transition-all duration-300 ${
          !expanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {content}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          aria-label={expanded ? `Collapse ${label}` : `Read full ${label}`}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Read full {label} ↓
            </>
          )}
        </button>
      )}
    </div>
  );
}
