// Domain-specific questionnaire configuration for the Guided Solution Formation flow.
// Questions are hardcoded — only answers are sent to the AI for solution assembly.

export type QuestionType = 'text' | 'options' | 'yesno' | 'textarea';

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
}

export interface Domain {
  id: string;
  label: string;
  icon: string;        // emoji icon for the domain card
  description: string; // shown on the domain selector card
  questions: Question[];
  evaluationHint: string; // passed to the evaluator as a domain context hint
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAINS: Domain[] = [
  // ── 1. SaaS / Software ──────────────────────────────────────────────────
  {
    id: 'saas',
    label: 'SaaS / Software',
    icon: '💻',
    description: 'Web apps, APIs, developer tools, B2B platforms',
    evaluationHint:
      'Emphasize: API ecosystem integrations, churn risk, feature parity with incumbents, subscription retention, and developer adoption curve.',
    questions: [
      {
        id: 'pain',
        question: 'What specific user pain point does your software solve?',
        type: 'textarea',
        placeholder: 'e.g. Teams spend 3+ hours per week manually copying data between spreadsheets...',
        required: true,
      },
      {
        id: 'customer',
        question: 'Who is your primary customer?',
        type: 'options',
        options: [
          { label: 'Individual (B2C)', value: 'individual' },
          { label: 'Small / Medium Business (SMB)', value: 'smb' },
          { label: 'Enterprise (B2B)', value: 'enterprise' },
          { label: 'Developer / Technical User', value: 'developer' },
        ],
        required: true,
      },
      {
        id: 'current_solution',
        question: 'How do users currently solve this problem?',
        type: 'textarea',
        placeholder: 'e.g. They use a combination of Excel and manual email workflows...',
        required: true,
      },
      {
        id: 'platform',
        question: 'What platform will your software run on?',
        type: 'options',
        options: [
          { label: 'Web Application', value: 'web' },
          { label: 'Mobile (iOS / Android)', value: 'mobile' },
          { label: 'Web + Mobile', value: 'web_mobile' },
          { label: 'Desktop Application', value: 'desktop' },
          { label: 'API / Developer Tool', value: 'api' },
        ],
        required: true,
      },
      {
        id: 'pricing',
        question: 'What is your pricing model?',
        type: 'options',
        options: [
          { label: 'Monthly / Annual Subscription', value: 'subscription' },
          { label: 'One-time Purchase', value: 'one_time' },
          { label: 'Freemium (free + paid tiers)', value: 'freemium' },
          { label: 'Usage-based / Pay-as-you-go', value: 'usage_based' },
        ],
        required: true,
      },
      {
        id: 'integrations',
        question: 'Will your software require third-party integrations to work?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'advantage',
        question: "What is your unfair advantage over existing tools?",
        type: 'textarea',
        placeholder: 'e.g. We have proprietary access to a unique data source that competitors cannot replicate...',
        required: true,
      },
      {
        id: 'success_metric',
        question: "What is the #1 metric that defines success in your first year?",
        type: 'text',
        placeholder: 'e.g. 500 paying customers, $50k ARR, 10k active users...',
        required: true,
      },
    ],
  },

  // ── 2. Healthcare & MedTech ──────────────────────────────────────────────
  {
    id: 'healthcare',
    label: 'Healthcare & MedTech',
    icon: '🏥',
    description: 'Digital health, medical devices, patient tools, clinical software',
    evaluationHint:
      'Emphasize: regulatory approval pathways (FDA/CE), HIPAA/data privacy compliance, clinical workflow integration, evidence-based efficacy, reimbursement model viability, and patient safety risks.',
    questions: [
      {
        id: 'model',
        question: 'Is this solution primarily B2B or B2C?',
        type: 'options',
        options: [
          { label: 'B2B — Selling to hospitals / clinics / health systems', value: 'b2b' },
          { label: 'B2C — Selling directly to patients / consumers', value: 'b2c' },
          { label: 'Both', value: 'both' },
        ],
        required: true,
      },
      {
        id: 'clinical_problem',
        question: 'What clinical or health problem are you addressing?',
        type: 'textarea',
        placeholder: 'e.g. Early detection of diabetic retinopathy in rural areas with no ophthalmologist access...',
        required: true,
      },
      {
        id: 'patient_data',
        question: 'Does your solution collect, process, or store patient health data?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'regulatory',
        question: 'Does your solution require regulatory approval (e.g. FDA 510(k), CE marking)?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'first_customers',
        question: 'Who are your first 10 customers and how will you reach them?',
        type: 'textarea',
        placeholder: 'e.g. 3 pilot clinics through a medical accelerator partnership...',
        required: true,
      },
      {
        id: 'revenue_model',
        question: 'What is your revenue model?',
        type: 'options',
        options: [
          { label: 'Subscription (hospital / clinic license)', value: 'subscription' },
          { label: 'Per-patient / Per-procedure fee', value: 'per_patient' },
          { label: 'Insurance / Payer reimbursement', value: 'reimbursement' },
          { label: 'Direct consumer subscription', value: 'consumer_sub' },
        ],
        required: true,
      },
      {
        id: 'workflow',
        question: 'How does your solution integrate into an existing clinical workflow?',
        type: 'textarea',
        placeholder: 'e.g. Plugs into the EHR as a background service, generates alerts in the physician dashboard...',
        required: true,
      },
      {
        id: 'pilot',
        question: 'What would it take to get your first hospital or clinic to pilot this?',
        type: 'textarea',
        placeholder: 'e.g. A 3-month free pilot with clinical outcomes data and a signed NDA...',
        required: true,
      },
    ],
  },

  // ── 3. E-commerce & Marketplace ─────────────────────────────────────────
  {
    id: 'ecommerce',
    label: 'E-commerce & Marketplace',
    icon: '🛒',
    description: 'Online retail, two-sided marketplaces, DTC brands, dropshipping',
    evaluationHint:
      'Emphasize: unit economics (CAC vs LTV), logistics and fulfillment complexity, supplier/buyer chicken-and-egg bootstrapping, platform fee structure, and return rate risk.',
    questions: [
      {
        id: 'type',
        question: 'What type of commerce model is this?',
        type: 'options',
        options: [
          { label: 'Direct-to-Consumer (DTC) brand', value: 'dtc' },
          { label: 'Two-sided marketplace (buyers + sellers)', value: 'marketplace' },
          { label: 'B2B wholesale / procurement', value: 'b2b' },
          { label: 'Subscription box / recurring product', value: 'subscription' },
        ],
        required: true,
      },
      {
        id: 'niche',
        question: 'What product niche or category are you targeting?',
        type: 'text',
        placeholder: 'e.g. Handmade artisan home goods, sustainable pet products...',
        required: true,
      },
      {
        id: 'sourcing',
        question: 'How will you source or manufacture products?',
        type: 'options',
        options: [
          { label: 'In-house / own manufacturing', value: 'own' },
          { label: 'Third-party suppliers (private label)', value: 'supplier' },
          { label: 'Dropshipping', value: 'dropshipping' },
          { label: 'User-generated (marketplace model)', value: 'user_generated' },
        ],
        required: true,
      },
      {
        id: 'differentiation',
        question: 'Why will customers buy from you instead of Amazon or an established competitor?',
        type: 'textarea',
        placeholder: 'e.g. We curate eco-certified products with carbon offset shipping, which Amazon cannot offer...',
        required: true,
      },
      {
        id: 'cac',
        question: 'How will you acquire your first 100 customers?',
        type: 'textarea',
        placeholder: 'e.g. Instagram influencer seeding + paid social targeting eco-conscious millennials...',
        required: true,
      },
      {
        id: 'logistics',
        question: 'How will you handle shipping and fulfillment?',
        type: 'options',
        options: [
          { label: 'Self-fulfill from own warehouse', value: 'self' },
          { label: '3PL (third-party logistics provider)', value: '3pl' },
          { label: 'Dropship directly from supplier', value: 'dropship' },
          { label: 'Digital product (no shipping)', value: 'digital' },
        ],
        required: true,
      },
      {
        id: 'unit_economics',
        question: 'What is your estimated gross margin per order?',
        type: 'options',
        options: [
          { label: 'Under 20%', value: 'low' },
          { label: '20–40%', value: 'medium' },
          { label: '40–60%', value: 'good' },
          { label: '60%+', value: 'excellent' },
        ],
        required: true,
      },
      {
        id: 'retention',
        question: 'What is your primary customer retention strategy?',
        type: 'textarea',
        placeholder: 'e.g. Loyalty rewards + a subscription replenishment option for consumable products...',
        required: true,
      },
    ],
  },

  // ── 4. EdTech ────────────────────────────────────────────────────────────
  {
    id: 'edtech',
    label: 'EdTech',
    icon: '🎓',
    description: 'Online learning, tutoring, skills training, academic tools',
    evaluationHint:
      'Emphasize: proven learning outcomes and pedagogy, student engagement and course completion rates, accreditation or certification credibility, and teacher/institution adoption hurdles.',
    questions: [
      {
        id: 'audience',
        question: 'Who is your primary learner?',
        type: 'options',
        options: [
          { label: 'K-12 Students', value: 'k12' },
          { label: 'University / College Students', value: 'university' },
          { label: 'Working Professionals (upskilling)', value: 'professionals' },
          { label: 'Teachers / Educators (B2B)', value: 'teachers' },
          { label: 'Corporate L&D (enterprise)', value: 'enterprise' },
        ],
        required: true,
      },
      {
        id: 'subject',
        question: 'What subject or skill does your platform teach?',
        type: 'text',
        placeholder: 'e.g. Data science, spoken English, financial literacy, coding for kids...',
        required: true,
      },
      {
        id: 'format',
        question: 'What is the primary learning format?',
        type: 'options',
        options: [
          { label: 'Video courses (self-paced)', value: 'video' },
          { label: 'Live classes / tutoring', value: 'live' },
          { label: 'Interactive exercises / gamified', value: 'gamified' },
          { label: 'AI tutor / adaptive learning', value: 'ai_tutor' },
          { label: 'Cohort-based (peer + instructor)', value: 'cohort' },
        ],
        required: true,
      },
      {
        id: 'outcome',
        question: 'What measurable outcome does a learner achieve?',
        type: 'textarea',
        placeholder: 'e.g. Pass the AWS Solutions Architect exam, get a job, improve SAT score by 150 points...',
        required: true,
      },
      {
        id: 'accreditation',
        question: 'Does your platform offer any certification or accreditation?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'completion_strategy',
        question: 'How will you keep learners engaged and ensure course completion?',
        type: 'textarea',
        placeholder: 'e.g. Streak rewards, accountability partner matching, weekly cohort calls...',
        required: true,
      },
      {
        id: 'pricing',
        question: 'What is your pricing model?',
        type: 'options',
        options: [
          { label: 'Per-course one-time fee', value: 'per_course' },
          { label: 'Monthly subscription', value: 'subscription' },
          { label: 'Freemium (free intro + paid advanced)', value: 'freemium' },
          { label: 'Institutional / school license', value: 'b2b' },
          { label: 'Income share agreement (ISA)', value: 'isa' },
        ],
        required: true,
      },
      {
        id: 'differentiation',
        question: 'Why is your platform better than Coursera, Udemy, or YouTube?',
        type: 'textarea',
        placeholder: 'e.g. We offer live 1:1 mentorship with industry practitioners, not just video content...',
        required: true,
      },
    ],
  },

  // ── 5. FinTech ───────────────────────────────────────────────────────────
  {
    id: 'fintech',
    label: 'FinTech',
    icon: '💰',
    description: 'Payments, lending, insurance, investment tools, banking infrastructure',
    evaluationHint:
      'Emphasize: financial regulation compliance (RBI, FCA, SEC depending on market), fraud and AML risk, licensing requirements, customer financial safety, unit economics of float or transaction fees.',
    questions: [
      {
        id: 'category',
        question: 'What FinTech category does your solution fall into?',
        type: 'options',
        options: [
          { label: 'Payments & Transfers', value: 'payments' },
          { label: 'Lending & Credit', value: 'lending' },
          { label: 'Investing & Wealth Management', value: 'investing' },
          { label: 'Insurance (InsurTech)', value: 'insurance' },
          { label: 'Banking Infrastructure / BaaS', value: 'infrastructure' },
          { label: 'Budgeting / Personal Finance', value: 'personal_finance' },
        ],
        required: true,
      },
      {
        id: 'target_market',
        question: 'Who is your target market?',
        type: 'options',
        options: [
          { label: 'Unbanked / underserved consumers', value: 'unbanked' },
          { label: 'Mainstream retail consumers', value: 'retail' },
          { label: 'Small business owners', value: 'smb' },
          { label: 'Enterprises / institutional clients', value: 'enterprise' },
          { label: 'Developers / other FinTechs (API)', value: 'developer' },
        ],
        required: true,
      },
      {
        id: 'license',
        question: 'Will your solution require a financial services license or partnership with a licensed bank?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'revenue',
        question: 'How does your solution make money?',
        type: 'options',
        options: [
          { label: 'Transaction / interchange fees', value: 'transaction' },
          { label: 'Interest on loans / float', value: 'interest' },
          { label: 'Monthly subscription', value: 'subscription' },
          { label: 'Premium features (freemium)', value: 'freemium' },
          { label: 'Data / analytics monetization', value: 'data' },
        ],
        required: true,
      },
      {
        id: 'fraud_risk',
        question: 'How will you handle fraud, money laundering, or financial crime risk?',
        type: 'textarea',
        placeholder: 'e.g. KYC via Onfido, transaction monitoring via SEON, AML compliance officer...',
        required: true,
      },
      {
        id: 'trust',
        question: 'How will you build trust with users who are sharing their financial data?',
        type: 'textarea',
        placeholder: 'e.g. Bank-grade 256-bit encryption, SOC 2 Type II certification, FDIC insurance partnership...',
        required: true,
      },
      {
        id: 'moat',
        question: 'What prevents a large bank or existing FinTech from copying this in 6 months?',
        type: 'textarea',
        placeholder: 'e.g. Proprietary credit scoring model trained on 5 years of alternative data...',
        required: true,
      },
      {
        id: 'first_customers',
        question: 'How will you acquire your first 1,000 users?',
        type: 'textarea',
        placeholder: 'e.g. Referral program targeting gig economy workers, partnering with a payroll company...',
        required: true,
      },
    ],
  },

  // ── 6. Physical Product / Hardware ──────────────────────────────────────
  {
    id: 'hardware',
    label: 'Physical Product / Hardware',
    icon: '📦',
    description: 'Consumer gadgets, IoT devices, manufactured goods, CPG',
    evaluationHint:
      'Emphasize: manufacturing and tooling cost, minimum order quantity (MOQ) risk, supply chain fragility, product-market fit validation before capital commitment, certification requirements (FCC, CE, UL), and warranty/return economics.',
    questions: [
      {
        id: 'product_type',
        question: 'What type of physical product is this?',
        type: 'options',
        options: [
          { label: 'Consumer electronics / gadget', value: 'electronics' },
          { label: 'IoT / connected device', value: 'iot' },
          { label: 'Consumer packaged goods (CPG)', value: 'cpg' },
          { label: 'Industrial / B2B equipment', value: 'industrial' },
          { label: 'Apparel / fashion', value: 'apparel' },
          { label: 'Home goods / furniture', value: 'home' },
        ],
        required: true,
      },
      {
        id: 'problem',
        question: 'What problem does your product solve for the user?',
        type: 'textarea',
        placeholder: 'e.g. People forget to take medication on time, leading to treatment failure...',
        required: true,
      },
      {
        id: 'manufacturing',
        question: 'How will you manufacture this product?',
        type: 'options',
        options: [
          { label: 'Contract manufacturer in China / Asia', value: 'china' },
          { label: 'Local / domestic manufacturer', value: 'local' },
          { label: 'In-house assembly', value: 'in_house' },
          { label: 'Co-packing / white-label', value: 'white_label' },
        ],
        required: true,
      },
      {
        id: 'moq',
        question: 'What is your estimated minimum order quantity (MOQ) and unit cost at that volume?',
        type: 'text',
        placeholder: 'e.g. MOQ 500 units at $12/unit manufacturing cost, sell for $49...',
        required: true,
      },
      {
        id: 'certifications',
        question: 'Does your product require safety or regulatory certifications?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'validation',
        question: 'How have you validated demand before committing to manufacturing?',
        type: 'textarea',
        placeholder: 'e.g. Kickstarter campaign, 200 pre-order deposits, 3 retail buyer commitments...',
        required: true,
      },
      {
        id: 'distribution',
        question: 'How will you distribute and sell the product?',
        type: 'options',
        options: [
          { label: 'Direct-to-consumer website', value: 'dtc' },
          { label: 'Amazon / online marketplaces', value: 'amazon' },
          { label: 'Retail stores (B2B distribution)', value: 'retail' },
          { label: 'Kickstarter / crowdfunding', value: 'crowdfunding' },
        ],
        required: true,
      },
      {
        id: 'moat',
        question: 'What prevents someone from copying your product in 6 months?',
        type: 'textarea',
        placeholder: 'e.g. Patent pending design, exclusive supplier contract, brand community...',
        required: true,
      },
    ],
  },

  // ── 7. Social / Community Platform ──────────────────────────────────────
  {
    id: 'social',
    label: 'Social / Community Platform',
    icon: '🌐',
    description: 'Social networks, forums, creator tools, community platforms',
    evaluationHint:
      'Emphasize: network effects and cold-start problem, content moderation strategy and costs, creator monetization model, virality and organic growth loops, and the existential threat of incumbents (Meta, Reddit, Discord) copying the feature set.',
    questions: [
      {
        id: 'niche',
        question: 'What specific community or interest group does your platform serve?',
        type: 'text',
        placeholder: 'e.g. Amateur astronomers, indie game developers, female founders in Southeast Asia...',
        required: true,
      },
      {
        id: 'value_prop',
        question: 'Why will users come to your platform instead of a Facebook group, Slack, or Discord server?',
        type: 'textarea',
        placeholder: 'e.g. We offer built-in tools specific to this niche that generic platforms cannot provide...',
        required: true,
      },
      {
        id: 'cold_start',
        question: 'How will you solve the cold-start problem — getting your first 100 active members?',
        type: 'textarea',
        placeholder: 'e.g. Personally invite 50 community leaders, seed the feed with curated content...',
        required: true,
      },
      {
        id: 'content_moderation',
        question: 'How will you handle harmful content, spam, or bad actors?',
        type: 'textarea',
        placeholder: 'e.g. AI-assisted flagging + community reporting + human moderators...',
        required: true,
      },
      {
        id: 'monetization',
        question: 'How does your platform make money?',
        type: 'options',
        options: [
          { label: 'Subscription / membership fee', value: 'subscription' },
          { label: 'Creator tools / monetization cut', value: 'creator_cut' },
          { label: 'Advertising', value: 'ads' },
          { label: 'Community / group tools for businesses', value: 'b2b' },
          { label: 'Marketplace / transaction fee', value: 'marketplace' },
        ],
        required: true,
      },
      {
        id: 'virality',
        question: 'What is your viral growth loop — how does one user bring in more users?',
        type: 'textarea',
        placeholder: 'e.g. Users share community posts publicly, non-members see the content, sign up to comment...',
        required: true,
      },
      {
        id: 'creator_economy',
        question: 'Do you plan to support content creators building an audience or income on your platform?',
        type: 'yesno',
        required: true,
      },
      {
        id: 'network_effects',
        question: 'At what user scale does your platform become meaningfully better for everyone?',
        type: 'text',
        placeholder: 'e.g. At 1,000 active members, there is enough daily activity to feel alive...',
        required: true,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Find a domain by its ID */
export function getDomainById(id: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}

/**
 * Assembles the questionnaire answers into a well-structured solution text
 * to be submitted as the solution content.
 */
export function assembleAnswersIntoSolution(
  domain: Domain,
  answers: Record<string, string>
): string {
  const lines: string[] = [
    `Solution Proposal — ${domain.label}`,
    '─'.repeat(40),
    '',
  ];

  for (const question of domain.questions) {
    const answer = answers[question.id];
    if (!answer || answer.trim() === '') continue;

    let displayAnswer = answer;

    // For options questions, resolve the label from value
    if (question.type === 'options' && question.options) {
      const match = question.options.find((o) => o.value === answer);
      if (match) displayAnswer = match.label;
    }

    // For yes/no questions
    if (question.type === 'yesno') {
      displayAnswer = answer === 'yes' ? 'Yes' : 'No';
    }

    lines.push(`${question.question}`);
    lines.push(`→ ${displayAnswer}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}
