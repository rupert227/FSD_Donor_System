export type none = null | undefined;

type numArray = (number | none)[] | none;

export namespace Primitives {
  export interface ChartOption<K = string, L = string, V = number> {
    key: K | none;
    label: L | none;
    value: V | none;
  }

  export interface DropdownOption<K = string, V = string> {
    key: K | none;
    label: V | none;
  }
}

export namespace Leads {
  export interface Report {
    timestamp?: string | none;
    fiscalYear?: string | none;
    donorType?: string | none;
    pipelineStage?: string | none;
    fiscalYearOptions?: Primitives.DropdownOption[] | none;
    donorTypeOptions?: Primitives.DropdownOption[] | none;
    pipelineStageOptions?: Primitives.DropdownOption[] | none;
    quarterlySummary?: {
      headers?: (string | none)[] | none;
      coreMonetaryValue?: {
        totalEstimatedValuation?: numArray;
        probabilityAdjustedValue?: numArray;
        securedValue?: numArray;
        unsecuredBalance?: numArray;
      };
      conversionEfficiencyAndRatios?: {
        donorConversionRate?: numArray;
        valueRealizationRate?: numArray;
      };
      leadOriginBreakdown?: {
        referral?: numArray;
        research?: numArray;
        booths?: numArray;
        callOrText?: numArray;
        walkIn?: numArray;
        subtotalLeadIntake?: numArray;
      };
      pipelineStageBreakdown?: {
        newLead?: numArray;
        underResearch?: numArray;
        outreachStarted?: numArray;
        proposalSent?: numArray;
        securedDonor?: numArray;
        subtotalProspectRecords?: numArray;
      };
    };
  }

  export interface ReportFilters {
    fiscalYear?: string | none;
    donorType?: string | none;
    pipelineStage?: string | none;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    fiscalYear: undefined,
    donorType: undefined,
    pipelineStage: undefined,
    fiscalYearOptions: undefined,
    donorTypeOptions: undefined,
    pipelineStageOptions: undefined,
    quarterlySummary: undefined,
  };
}

export namespace Retention {
  export interface Report {
    timestamp?: string | none;
    fiscalYear?: string | none;
    targetCampaign?: string | none;
    engagementStatus?: string | none;
    fiscalYearOptions?: Primitives.DropdownOption[] | none;
    targetCampaignOptions?: Primitives.DropdownOption[] | none;
    engagementStatusOptions?: Primitives.DropdownOption[] | none;

    quarterlySummary?: {
      headers?: (string | none)[] | none;
      renewalValue?: {
        totalEstimatedRenewalAmount?: numArray;
        realizedRenewalAmount?: numArray;
        uncollectedRenewalAmount?: numArray;
        meanRenewalValue?: numArray;
      };
      portfolio?: {
        activeRetainedDonors?: numArray;
        donorRetentionRate?: numArray;
        realizedRenewalValueRate?: numArray;
      };
      engagementStatus?: {
        recommitted?: numArray;
        renewalStarted?: numArray;
        followedUp?: numArray;
        uncontacted?: numArray;
        lapsedDonor?: numArray;
        subtotalRetentionAccounts?: numArray;
      };
      donorTenure?: {
        threePlusYearsLoyal?: numArray;
        twoYearsRetained?: numArray;
        oneYearRetained?: numArray;
        newRenewal?: numArray;
        subtotalLoyaltyAccounts?: numArray;
      };
    };
  }

  export interface ReportFilters {
    fiscalYear?: string | none;
    targetCampaign?: string | none;
    engagementStatus?: string | none;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    fiscalYear: undefined,
    targetCampaign: undefined,
    engagementStatus: undefined,
    fiscalYearOptions: undefined,
    targetCampaignOptions: undefined,
    engagementStatusOptions: undefined,
    quarterlySummary: undefined,
  };
}
