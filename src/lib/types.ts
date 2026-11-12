export type none = null | undefined;

type numArray = (number | none)[] | none;

export namespace Primitives {
  export interface ChartOption<K = string, L = string, V = number> {
    key: K;
    label: L | none;
    value: V | none;
  }

  export interface DropdownOption<K = string, V = string> {
    key: K;
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
        subTotalLeadIntake: numArray;
      };
      pipelineStageBreakdown?: {
        newLead?: numArray;
        underResearch?: numArray;
        outreachStarted?: numArray;
        proposalSent?: numArray;
        securedDonor?: numArray;
        subTotalProspectRecords: numArray;
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
