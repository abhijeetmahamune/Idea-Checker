/**
 * mock-devil-report.ts
 *
 * Canonical shared types & mock data for the Devil's Advocate report.
 * The type definitions here match the upgraded schema produced by
 * `generateDevilAdvocate()` in devil-advocate-generator.ts.
 *
 * Prosecution Case Architecture:
 *   - Verdict & Overall Risk Level
 *   - Formal Charges (title, severity, reasoning, evidence, businessImpact, founderAssumption, suggestedValidation, counterEvidence)
 *   - Ignored Competitors (name, threat, whyCustomerChooses, missingDifferentiation)
 *   - Founder Traps (cognitive biases)
 *   - Condition to Reconsider (measurable target evidence)
 *   - Backward-compatible failureReasons array
 */

// ── Schema Types ────────────────────────────────────────────────────────

export type FailureSeverity = 'Fatal' | 'Severe' | 'Moderate';
export type OverallRiskLevel = 'Critical' | 'High Risk' | 'Moderate Risk' | 'Low Risk';

export interface Charge {
  /** Title of the formal prosecution charge */
  title: string;
  /** Charge severity */
  severity: FailureSeverity;
  /** Data-grounded explanation of the charge */
  reasoning: string;
  /** Specific business realities, metrics, or market benchmarks */
  evidence: string;
  /** Financial or operational failure this charge leads to */
  businessImpact: string;
  /** Unvalidated founder assumption or cognitive bias */
  founderAssumption: string;
  /** Quantifiable test to validate/invalidate this claim */
  suggestedValidation: string;
  /** Proof that would make the Advocate withdraw this charge */
  counterEvidence: string;
}

export interface DetailedCompetitor {
  name: string;
  threat: string;
  /** Helper field for backward compatibility */
  why_threat?: string;
  whyCustomerChooses: string;
  missingDifferentiation: string;
}

export interface FailureReason {
  reason: string;
  severity: FailureSeverity;
}

export interface DevilReport {
  /** One memorable, powerful, specific sentence summarizing the prosecution verdict */
  verdict: string;
  /** Overall risk level classification */
  overallRiskLevel: OverallRiskLevel;
  /** Formal legal prosecution charges */
  charges: Charge[];
  /** Detailed competitor threats */
  ignoredCompetitors: DetailedCompetitor[];
  /** Specific startup cognitive biases and assumption traps */
  founderTraps: string[];
  /** Specific, measurable evidence required for overall verdict reversal */
  conditionToReconsider: string;
  /** Backward-compatible array for existing viewers */
  failureReasons: FailureReason[];
}

// ── Mock Data (Prosecution Case Format) ──────────────────────────────────

const MOCK_CHARGES: Charge[] = [
  {
    title: 'Zero Distribution Strategy',
    severity: 'Fatal',
    reasoning:
      'The entire go-to-market plan relies on "build it and they will come" rephrased as a growth strategy. There is no owned channel, no network effect moat, and no content flywheel.',
    evidence:
      'Competitors currently own 84% of top-of-funnel SEO keywords and active community channels. Unpaid acquisition is non-existent.',
    businessImpact:
      'Customer acquisition cost (CAC) will soar to $40–120 on paid channels for an early product with unproven LTV > $0, burning initial runway within 6 months.',
    founderAssumption:
      'Assuming product superiority automatically translates to organic user acquisition without dedicated distribution investment.',
    suggestedValidation:
      'Run a 14-day landing page campaign testing 3 cold acquisition channels to prove CAC < $25 before writing production code.',
    counterEvidence:
      'Demonstrate a scalable, non-paid acquisition channel delivering > 50 qualified leads per week at CAC < $15.',
  },
  {
    title: 'Unit Economic Collapse at Scale',
    severity: 'Fatal',
    reasoning:
      'The financial model projects 18-month payback periods while assuming monthly churn below 2% — a metric achieved by fewer than 10 B2B SaaS companies globally at early stage.',
    evidence:
      'Early-stage SaaS average churn is 6–8% monthly. At realistic churn rates, LTV drops by 65%, causing payback periods to blow past 30 months.',
    businessImpact:
      'Renders the business mathematically unprofitable at scale, creating negative cash flows that no venture funding can salvage.',
    founderAssumption:
      'Assuming enterprise-grade retention rates for a v1 product before establishing onboarding workflows or customer success ops.',
    suggestedValidation:
      'Measure 60-day retention on a pilot cohort of 20 non-affiliated users.',
    counterEvidence:
      'Achieve 3 consecutive months of cohort retention > 92% with negative net revenue churn.',
  },
  {
    title: 'Unmodeled Regulatory & Compliance Risk',
    severity: 'Severe',
    reasoning:
      'The architecture requires processing user-generated behavioral data without accounting for legal compliance frameworks in target jurisdictions.',
    evidence:
      'GDPR Article 22 (automated profiling) and CCPA opt-out mandates require $80k–150k in legal and compliance engineering before launch.',
    businessImpact:
      'Exposes the company to severe regulatory fines and unexpected pre-launch capital burn not reflected in financial projections.',
    founderAssumption:
      'Believing regulatory compliance is a post-funding problem rather than a launch blocker.',
    suggestedValidation:
      'Conduct a formal 3rd-party data privacy assessment prior to commercial deployment.',
    counterEvidence:
      'Obtain certified compliance audit clearance (SOC2 Type II / GDPR compliance documentation).',
  },
  {
    title: 'Enterprise Sales Motion Skill Gap',
    severity: 'Moderate',
    reasoning:
      'The target buyer personas (mid-market ops leads, procurement officers) buy through relationship sales, but the team is building a purely self-serve PLG flow.',
    evidence:
      '90% of mid-market contracts in this category require security reviews, procurement approvals, and custom SLA negotiations.',
    businessImpact:
      'Self-serve conversion rates will plateau below 0.5%, resulting in a long, drawn-out sales cycle without dedicated sales personnel.',
    founderAssumption:
      'Believing mid-market procurement leads will enter credit cards on an unvetted self-serve pricing page.',
    suggestedValidation:
      'Conduct 10 outbound sales calls targeting procurement heads to validate willingness to buy self-serve.',
    counterEvidence:
      'Close 5 mid-market annual contracts with upfront payment via a non-founder sales rep.',
  },
];

const MOCK_COMPETITORS: DetailedCompetitor[] = [
  {
    name: 'Notion + Native AI Suite',
    threat:
      'Owns 30 million active users already in your ICP. Can ship your core value proposition as a minor feature update.',
    why_threat:
      'Notion owns the distribution, data flywheel, and workflow trust. They can replicate adjacent features instantly.',
    whyCustomerChooses:
      'Customers already pay for Notion and prefer consolidating tools over managing another subscription.',
    missingDifferentiation:
      'The pitch relies on general AI assistance rather than deep, defensible vertical workflows Notion cannot clone.',
  },
  {
    name: 'Linear + Height (Next-Gen PM Tools)',
    threat:
      'Ops-forward teams have already standardized on Linear or Height with high switching costs.',
    why_threat:
      'High switching costs and active developer/ops ecosystems lock users into existing project workflows.',
    whyCustomerChooses:
      'Exceptional performance, keyboard shortcuts, and deep developer ecosystem integrations.',
    missingDifferentiation:
      'Lacks native integration parity, forcing users to manage fragmented tools across platforms.',
  },
];

export const MOCK_DEVIL_REPORT: DevilReport = {
  verdict:
    'This idea is built on a foundation of wishful thinking. The market exists — the execution plan does not. Without a defensible acquisition channel and a clear answer to "why now and why you," this will join the 94% of funded startups that quietly shut down.',
  overallRiskLevel: 'High Risk',
  charges: MOCK_CHARGES,
  ignoredCompetitors: MOCK_COMPETITORS,
  founderTraps: [
    'False Consensus Bias: Mistaking positive feedback from personal connections for cold market demand.',
    'Technology-First Thinking: Solving for interesting technical architecture instead of cold distribution friction.',
    'Optimism Bias: Assuming enterprise-grade retention (>98%) for a v1 early-stage product.',
    'Feature Obsession: Prioritizing roadmap features over resolving lost-deal sales blockers.',
  ],
  conditionToReconsider:
    'Reconsider this path if, and only if, you can demonstrate within 90 days: (1) ten paying customers from a cold outbound channel at an ACV above $4,000, (2) month-over-month retention above 92% for 3 consecutive months, and (3) a repeatable sales motion executed without direct founder involvement.',
  failureReasons: MOCK_CHARGES.map((c) => ({
    reason: `${c.title}: ${c.reasoning}`,
    severity: c.severity,
  })),
};
