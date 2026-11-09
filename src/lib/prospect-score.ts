/**
 * Probability Score Calculation for Lead Prospects
 * 
 * FORMULA:
 * P = 100 * (A / 55) * ((F + 45) / 90)
 * 
 * A = lead_source + initiative + donor_type (range 15 to 55)
 * F = details + pipeline + amount (range 15 to 45)
 */

export interface ProspectScoreInput {
  leadSource?: string | null;
  targetCampaign?: string | null;
  donorType?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  pipelineStatus?: string | null;
  targetAmount?: number | string | null;
}

export interface ProspectScoreResult {
  rawProbability: number; // Unclamped / exact P (18.2 to 100.0)
  tier: number; // 0, 20, 40, 60, 80, 100
  tierLabel: "Deferred" | "Low" | "Fair" | "Good" | "High Likelihood" | "Secured Donor";
  affinity: {
    leadSourceScore: number;
    initiativeScore: number;
    donorTypeScore: number;
    totalAffinity: number;
    affinityRatio: number; // A / 55
  };
  feasibility: {
    detailsScore: number;
    pipelineScore: number;
    amountScore: number;
    totalFeasibility: number;
    feasibilityMultiplier: number; // (F + 45) / 90
  };
  isOverride: boolean;
}

/**
 * 1. Lead Source (max 20)
 * Referral: 20
 * Walk-in: 15
 * Booths / Events: 10
 * Direct Call: 10
 * Research: 5
 */
export function getLeadSourceScore(source?: string | null): number {
  if (!source) return 5;
  const s = source.toLowerCase().trim();
  if (s.includes("referral")) return 20;
  if (s.includes("walk-in") || s.includes("walk in")) return 15;
  if (s.includes("booth")) return 10;
  if (s.includes("direct call") || s.includes("direct")) return 10;
  return 5; // Research or default
}

/**
 * 2. Initiative (max 20)
 * Health and Disaster Relief: 20
 * Youth Servant Leadership: 15
 * In-Kind Social Enterprise: 10
 * At-Risk Restorative Justice: 5
 * Institute for Stewardship: 5
 */
export function getInitiativeScore(campaign?: string | null): number {
  if (!campaign) return 5;
  const c = campaign.toLowerCase().trim();
  if (c.includes("disaster") || c.includes("health")) return 20;
  if (c.includes("youth") || c.includes("leadership")) return 15;
  if (c.includes("in-kind") || c.includes("social enterprise")) return 10;
  if (c.includes("restorative") || c.includes("at-risk")) return 5;
  if (c.includes("stewardship") || c.includes("institute")) return 5;
  return 5;
}

/**
 * 3. Donor Type (max 15)
 * Individual: 15
 * Community / Faith / Civic: 10
 * Corporate: 10
 * International: 5
 */
export function getDonorTypeScore(donorType?: string | null): number {
  if (!donorType) return 5;
  const d = donorType.toLowerCase().trim();
  if (d === "individual") return 15;
  if (d.includes("community") || d.includes("faith") || d.includes("civic")) return 10;
  if (d.includes("corporate")) return 10;
  if (d.includes("international")) return 5;
  return 5;
}

/**
 * 1. Details (max 15)
 * Complete (named contact + direct phone + valid email): 15
 * Partial (named contact + phone OR email): 10
 * Minimal (general office line only / no direct contact): 5
 */
export function getDetailsScore(contactPerson?: string | null, phone?: string | null, email?: string | null): number {
  const hasName = Boolean(contactPerson && contactPerson.trim().length > 0);
  const hasPhone = Boolean(phone && phone.trim().length > 0);
  const hasEmail = Boolean(email && email.trim().includes("@") && email.trim().includes("."));

  if (hasName && hasPhone && hasEmail) return 15;
  if (hasName && (hasPhone || hasEmail)) return 10;
  return 5;
}

/**
 * 2. Pipeline (max 15)
 * Proposal Sent: 15
 * Outreach Started: 10
 * Under Research / New Lead: 5
 */
export function getPipelineScore(status?: string | null): number {
  if (!status) return 5;
  const s = status.toLowerCase().trim();
  if (s.includes("proposal")) return 15;
  if (s.includes("outreach")) return 10;
  return 5; // Under Research / New Lead / default
}

/**
 * 3. Amount (max 15)
 * PHP 0 - 50,000: 15
 * PHP 50,000 - 250,000: 10
 * PHP 250,000+: 5
 */
export function getAmountScore(amount?: number | string | null): number {
  const val = typeof amount === "number" ? amount : parseFloat(String(amount ?? "0").replace(/[^0-9.-]+/g, "")) || 0;
  if (val <= 50_000) return 15;
  if (val <= 250_000) return 10;
  return 5;
}

/**
 * Calculate Prospect Probability and Tier
 */
export function calculateProspectProbability(input: ProspectScoreInput): ProspectScoreResult {
  const status = (input.pipelineStatus ?? "").trim();

  // OVERRIDES (APPLIED BEFORE THE FORMULA)
  if (status.toLowerCase() === "secured donor") {
    return {
      rawProbability: 100.0,
      tier: 100,
      tierLabel: "Secured Donor",
      affinity: {
        leadSourceScore: 20,
        initiativeScore: 20,
        donorTypeScore: 15,
        totalAffinity: 55,
        affinityRatio: 1.0,
      },
      feasibility: {
        detailsScore: 15,
        pipelineScore: 15,
        amountScore: 15,
        totalFeasibility: 45,
        feasibilityMultiplier: 1.0,
      },
      isOverride: true,
    };
  }

  if (status.toLowerCase() === "deferred") {
    return {
      rawProbability: 0.0,
      tier: 0,
      tierLabel: "Deferred",
      affinity: {
        leadSourceScore: 5,
        initiativeScore: 5,
        donorTypeScore: 5,
        totalAffinity: 15,
        affinityRatio: 15 / 55,
      },
      feasibility: {
        detailsScore: 5,
        pipelineScore: 5,
        amountScore: 5,
        totalFeasibility: 15,
        feasibilityMultiplier: 60 / 90,
      },
      isOverride: true,
    };
  }

  // AFFINITY (A)
  const leadSourceScore = getLeadSourceScore(input.leadSource);
  const initiativeScore = getInitiativeScore(input.targetCampaign);
  const donorTypeScore = getDonorTypeScore(input.donorType);
  const A = leadSourceScore + initiativeScore + donorTypeScore; // Range 15 to 55
  const affinityRatio = A / 55; // 0.27 to 1.00

  // FEASIBILITY (F)
  const detailsScore = getDetailsScore(input.contactPerson, input.phone, input.email);
  const pipelineScore = getPipelineScore(input.pipelineStatus);
  const amountScore = getAmountScore(input.targetAmount);
  const F = detailsScore + pipelineScore + amountScore; // Range 15 to 45
  const feasibilityMultiplier = (F + 45) / 90; // 0.67 to 1.00

  // FORMULA: P = 100 * (A / 55) * ((F + 45) / 90)
  const P = 100 * affinityRatio * feasibilityMultiplier;

  // TIER MAPPING:
  // Low:              20%  (P < 30)
  // Fair:             40%  (30 <= P < 50)
  // Good:             60%  (50 <= P < 70)
  // High Likelihood:  80%  (P >= 70)
  // Math equivalent: min(80, max(20, round(P / 20) * 20))
  const tier = Math.min(80, Math.max(20, Math.round(P / 20) * 20));

  let tierLabel: ProspectScoreResult["tierLabel"] = "Low";
  if (tier === 20) tierLabel = "Low";
  else if (tier === 40) tierLabel = "Fair";
  else if (tier === 60) tierLabel = "Good";
  else if (tier === 80) tierLabel = "High Likelihood";

  return {
    rawProbability: Math.round(P * 10) / 10,
    tier,
    tierLabel,
    affinity: {
      leadSourceScore,
      initiativeScore,
      donorTypeScore,
      totalAffinity: A,
      affinityRatio: Math.round(affinityRatio * 100) / 100,
    },
    feasibility: {
      detailsScore,
      pipelineScore,
      amountScore,
      totalFeasibility: F,
      feasibilityMultiplier: Math.round(feasibilityMultiplier * 100) / 100,
    },
    isOverride: false,
  };
}
