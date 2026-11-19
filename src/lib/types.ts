export type none = null | undefined;

type numArray = (number | none)[] | none;
type stringArray = (string | none)[] | none;

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

export namespace Care {
  export interface Report {
    timestamp?: string | none;
    baseYear?: string | none;
    compareYear?: string | none;
    sourceOfFunds?: string | none;
    baseYearOptions?: Primitives.DropdownOption[] | none;
    compareYearOptions?: Primitives.DropdownOption[] | none;
    sourceOfFundsOptions?: Primitives.DropdownOption[] | none;
    donationVariance?: {
      headers?: stringArray;
      coreMonetaryMetrics?: {
        totalCollectedDonations?: numArray;
        totalCommittedDonations?: numArray;
        uncollectedDonationBalance?: numArray;
        meanDonationPerTransaction?: numArray;
      };
      campaignAllocations?: {
        healthAndDisasterRelief?: numArray;
        youthServiceLeadership?: numArray;
        inKindSocialEnterprise?: numArray;
        instituteForStewardship?: numArray;
        atRiskRestorativeJustice?: numArray;
        subtotalCampaignDonations?: numArray;
      };
      transactionAuditAndCertificates?: {
        completedTransactionsEncoded?: numArray;
        donationReceiptsDispatched?: numArray;
        taxCertificatesIssued?: numArray;
        meanDispatchTurnaround?: numArray;
      };
    };
  }

  export interface ReportFilters {
    baseYear?: string | none;
    compareYear?: string | none;
    sourceOfFunds?: string | none;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    baseYear: undefined,
    compareYear: undefined,
    sourceOfFunds: undefined,
    baseYearOptions: undefined,
    compareYearOptions: undefined,
    sourceOfFundsOptions: undefined,
    donationVariance: undefined,
  };
}

export namespace Leads {
  export interface Report {
    timestamp?: string | none;
    year?: string | none;
    donorType?: string | none;
    targetCampaign?: string | none;
    yearOptions?: Primitives.DropdownOption[] | none;
    donorTypeOptions?: Primitives.DropdownOption[] | none;
    targetCampaignOptions?: Primitives.DropdownOption[] | none;
    quarterlySummary?: {
      headers?: stringArray;
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
    year?: string | none;
    donorType?: string | none;
    targetCampaign?: string | none;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    year: undefined,
    donorType: undefined,
    targetCampaign: undefined,
    yearOptions: undefined,
    donorTypeOptions: undefined,
    targetCampaignOptions: undefined,
    quarterlySummary: undefined,
  };
}

export namespace Retention {
  export interface Report {
    timestamp?: string | none;
    year?: string | none;
    targetCampaign?: string | none;
    engagementStatus?: string | none;
    yearOptions?: Primitives.DropdownOption[] | none;
    targetCampaignOptions?: Primitives.DropdownOption[] | none;
    engagementStatusOptions?: Primitives.DropdownOption[] | none;
    quarterlySummary?: {
      headers?: stringArray;
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
    year?: string | none;
    targetCampaign?: string | none;
    engagementStatus?: string | none;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    year: undefined,
    targetCampaign: undefined,
    engagementStatus: undefined,
    yearOptions: undefined,
    targetCampaignOptions: undefined,
    engagementStatusOptions: undefined,
    quarterlySummary: undefined,
  };
}
