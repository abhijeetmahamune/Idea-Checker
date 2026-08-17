'use client';

/**
 * CaseFilePanel.tsx
 *
 * The interactive report experience. Designed as a confidential
 * investigation file, not a dashboard.
 *
 * Features:
 *   - Left sidebar  — "THE CASE" navigation with section items
 *   - Right area    — Progressive content disclosure (click to reveal)
 *   - Bottom area   — "Challenge the Advocate" report-grounded AI discussion
 *
 * Polish & Accessibility:
 *   - Keyboard navigation: Escape key closes report (returns to chamber)
 *   - Arrow keys navigate between section items
 *   - Focus indicators and aria labels
 *   - Glassmorphic panels on dark ambient background
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MOCK_DEVIL_REPORT, type DevilReport, type FailureSeverity } from '@/lib/mock-devil-report';
import { ChallengeTheAdvocate } from './ChallengeTheAdvocate';

// ── Section IDs ─────────────────────────────────────────────────────────

type SectionId = 'verdict' | 'weaknesses' | 'competitors' | 'traps' | 'reconsideration';

interface NavSection {
  id: SectionId;
  label: string;
  sublabel?: string;
}

function buildNavSections(report: DevilReport): NavSection[] {
  return [
    { id: 'verdict',         label: 'Verdict' },
    { id: 'weaknesses',      label: 'Fatal Weaknesses',
      sublabel: `${report.charges?.length ?? report.failureReasons.length} charge${(report.charges?.length ?? report.failureReasons.length) !== 1 ? 's' : ''}` },
    { id: 'competitors',     label: 'Ignored Competitors',
      sublabel: `${report.ignoredCompetitors.length} threat${report.ignoredCompetitors.length !== 1 ? 's' : ''}` },
    { id: 'traps',           label: 'Founder Traps',
      sublabel: `${report.founderTraps.length} identified` },
    { id: 'reconsideration', label: 'Reconsideration' },
  ];
}

interface CaseFilePanelProps {
  /** Called when user clicks "Return to Chamber" or presses Escape */
  onClose: () => void;
  /** The report data */
  report?: DevilReport;
  /** Optional Solution UUID for real API chat */
  solutionId?: string;
}

// ── Severity Badge ───────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: FailureSeverity }) {
  const classMap: Record<FailureSeverity, string> = {
    Fatal:    'severity-badge severity-badge--fatal',
    Severe:   'severity-badge severity-badge--severe',
    Moderate: 'severity-badge severity-badge--moderate',
  };
  return <span className={classMap[severity]}>{severity}</span>;
}

// ── Section Content Renderers ────────────────────────────────────────────

function VerdictSection({ report }: { report: DevilReport }) {
  return (
    <div className="case-section-content animate-fade-slide-up" id="section-verdict">
      <div className="case-section-header">
        <span className="case-section-eyebrow">Prosecution Statement</span>
        <h2 className="case-section-title">Verdict</h2>
        {report.overallRiskLevel && (
          <span className="case-section-risk-tag">{report.overallRiskLevel}</span>
        )}
        <div className="case-section-rule" />
      </div>
      <p className="case-verdict-text">{report.verdict}</p>
    </div>
  );
}

function WeaknessesSection({ report }: { report: DevilReport }) {
  const items = report.charges && report.charges.length > 0
    ? report.charges
    : report.failureReasons.map((f, i) => ({
        title: `Charge #${i + 1}`,
        severity: f.severity,
        reasoning: f.reason,
        evidence: '',
        businessImpact: '',
        founderAssumption: '',
        suggestedValidation: '',
        counterEvidence: '',
      }));

  return (
    <div className="case-section-content animate-fade-slide-up" id="section-weaknesses">
      <div className="case-section-header">
        <span className="case-section-eyebrow">Prosecution Evidence</span>
        <h2 className="case-section-title">Fatal Weaknesses & Charges</h2>
        <div className="case-section-rule" />
      </div>
      <div className="case-failures-list">
        {items.map((item, i) => (
          <div key={i} className="case-failure-item">
            <div className="case-failure-meta">
              <SeverityBadge severity={item.severity} />
              <span className="case-failure-number">#{String(i + 1).padStart(2, '0')}</span>
              <h3 className="case-failure-title">{item.title}</h3>
            </div>
            <p className="case-failure-reason">{item.reasoning}</p>

            {item.evidence && (
              <div className="case-charge-detail">
                <span className="case-charge-detail__label">Evidence:</span>
                <span className="case-charge-detail__value">{item.evidence}</span>
              </div>
            )}

            {item.counterEvidence && (
              <div className="case-charge-detail case-charge-detail--counter">
                <span className="case-charge-detail__label">Proof Required for Withdrawal:</span>
                <span className="case-charge-detail__value">{item.counterEvidence}</span>
              </div>
            )}

            {i < items.length - 1 && (
              <div className="case-item-separator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorsSection({ report }: { report: DevilReport }) {
  return (
    <div className="case-section-content animate-fade-slide-up" id="section-competitors">
      <div className="case-section-header">
        <span className="case-section-eyebrow">Blind Spots</span>
        <h2 className="case-section-title">Ignored Competitors</h2>
        <div className="case-section-rule" />
      </div>
      <div className="case-competitors-list">
        {report.ignoredCompetitors.map((comp, i) => (
          <div key={i} className="case-competitor-item">
            <h3 className="case-competitor-name">{comp.name}</h3>
            <p className="case-competitor-threat">{comp.threat || comp.why_threat}</p>
            {comp.whyCustomerChooses && (
              <p className="case-competitor-subdetail">
                <strong>Why customers choose them:</strong> {comp.whyCustomerChooses}
              </p>
            )}
            {comp.missingDifferentiation && (
              <p className="case-competitor-subdetail">
                <strong>Missing differentiation:</strong> {comp.missingDifferentiation}
              </p>
            )}
            {i < report.ignoredCompetitors.length - 1 && (
              <div className="case-item-separator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrapsSection({ report }: { report: DevilReport }) {
  return (
    <div className="case-section-content animate-fade-slide-up" id="section-traps">
      <div className="case-section-header">
        <span className="case-section-eyebrow">Psychological Profile</span>
        <h2 className="case-section-title">Founder Traps</h2>
        <div className="case-section-rule" />
      </div>
      <ol className="case-traps-list">
        {report.founderTraps.map((trap, i) => (
          <li key={i} className="case-trap-item">
            <span className="case-trap-number">{String(i + 1).padStart(2, '0')}</span>
            <p className="case-trap-text">{trap}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReconsiderationSection({ report }: { report: DevilReport }) {
  return (
    <div className="case-section-content animate-fade-slide-up" id="section-reconsideration">
      <div className="case-section-header">
        <span className="case-section-eyebrow">Conditions for Acquittal</span>
        <h2 className="case-section-title">Reconsideration</h2>
        <div className="case-section-rule" />
      </div>
      <blockquote className="case-reconsider-quote">
        <p className="case-reconsider-text">{report.conditionToReconsider}</p>
      </blockquote>
    </div>
  );
}



// ── Main Panel ───────────────────────────────────────────────────────────

export function CaseFilePanel({ onClose, report = MOCK_DEVIL_REPORT, solutionId }: CaseFilePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['verdict']));
  const [activeSection, setActiveSection] = useState<SectionId>('verdict');
  const readingAreaRef = useRef<HTMLDivElement>(null);

  const navSections = buildNavSections(report);

  const handleNavClick = useCallback((id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveSection(id);
  }, []);

  // Keyboard navigation & Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const ids = navSections.map((s) => s.id);
        const currentIndex = ids.indexOf(activeSection);
        if (currentIndex === -1) return;

        e.preventDefault();
        let nextIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % ids.length;
        } else {
          nextIndex = (currentIndex - 1 + ids.length) % ids.length;
        }
        handleNavClick(ids[nextIndex]);
        const nextElem = document.getElementById(`nav-${ids[nextIndex]}`);
        nextElem?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, navSections, handleNavClick, onClose]);

  useEffect(() => {
    if (readingAreaRef.current) {
      readingAreaRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  const renderSection = (id: SectionId) => {
    switch (id) {
      case 'verdict':         return <VerdictSection report={report} />;
      case 'weaknesses':      return <WeaknessesSection report={report} />;
      case 'competitors':     return <CompetitorsSection report={report} />;
      case 'traps':           return <TrapsSection report={report} />;
      case 'reconsideration': return <ReconsiderationSection report={report} />;
    }
  };

  return (
    <div className="case-file-panel" role="main" aria-label="Devil's Advocate Case File">
      {/* ── Top bar ── */}
      <div className="case-file-topbar">
        <button
          id="return-to-chamber-btn"
          type="button"
          className="case-file-return-btn"
          onClick={onClose}
          aria-label="Return to Chamber (Escape key)"
          title="Return to Chamber (Esc)"
        >
          <span className="case-file-return-arrow" aria-hidden="true">←</span>
          Return to Chamber
        </button>

        <div className="case-file-stamp" aria-label="Classification stamp">
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* ── Body: nav + reading area ── */}
      <div className="case-file-body">
        {/* ── Left navigation ── */}
        <nav className="case-file-nav" aria-label="Report sections">
          <div className="case-file-nav-header">
            <span className="case-file-nav-label">THE CASE</span>
            <div className="case-file-nav-rule" />
          </div>

          <ul className="case-file-nav-list" role="list">
            {navSections.map((section) => {
              const isActive   = activeSection === section.id;
              const isExpanded = expandedSections.has(section.id);

              return (
                <li key={section.id}>
                  <button
                    id={`nav-${section.id}`}
                    type="button"
                    className={[
                      'case-file-nav-item',
                      isActive   ? 'case-file-nav-item--active'   : '',
                      isExpanded ? 'case-file-nav-item--expanded' : '',
                    ].join(' ')}
                    onClick={() => handleNavClick(section.id)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-expanded={isExpanded}
                  >
                    <span
                      className={`case-file-nav-dot ${isActive ? 'case-file-nav-dot--active' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="case-file-nav-item-content">
                      <span className="case-file-nav-item-label">{section.label}</span>
                      {section.sublabel && (
                        <span className="case-file-nav-item-sublabel">{section.sublabel}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Right reading area ── */}
        <div
          className="case-file-reading-area"
          ref={readingAreaRef}
          role="region"
          aria-label="Report content"
        >
          <div className="case-file-sections">
            {Array.from(expandedSections).map((id) => (
              <div
                key={id}
                className={`case-file-section-wrapper ${activeSection === id ? 'case-file-section-wrapper--focused' : ''}`}
              >
                {renderSection(id)}
              </div>
            ))}
          </div>

          <ChallengeTheAdvocate solutionId={solutionId} />
        </div>
      </div>
    </div>
  );
}
