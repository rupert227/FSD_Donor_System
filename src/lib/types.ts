export namespace Primitives {
  export interface ChartOption<K = string, L = string, V = number> {
    key: K;
    label: L | null | undefined;
    value: V | null | undefined;
  };

  export interface DropdownOption<K = string, V = string> {
    key: K;
    label: V | null | undefined;
  };
}

export namespace Leads {
  export interface Report {
    timestamp: string | null | undefined;
    fiscalYear: string | null | undefined;
    donorType: string | null | undefined;
    pipelineStage: string | null | undefined;
    weightedForecast: number | null | undefined;
    leadConversionRate: number | null | undefined;
    totalPipelineValue: number | null | undefined;
    averageProbability: number | null | undefined;
    fiscalYearOptions: Primitives.DropdownOption[] | null | undefined;
    donorTypeOptions: Primitives.DropdownOption[] | null | undefined;
    pipelineStageOptions: Primitives.DropdownOption[] | null | undefined;
    leadOrigins: Primitives.ChartOption[] | null | undefined;
    pipelineStages: Primitives.ChartOption[] | null | undefined;
    quarterNewLeads: Primitives.ChartOption[] | null | undefined;
    quarterlySummary: {
      totalEstimatedValue: number[] | null | undefined;
      probabilityAdjustedValue: number[] | null | undefined;
      securedValue: number[] | null | undefined;
      unsecuredBalance: number[] | null | undefined;
    };
    conversion: {
      leadConversionRate: number[] | null | undefined;
      valueRealizationRate: number[] | null | undefined;
    };
    leadsOrigin: {
      referral: number[] | null | undefined;
      research: number[] | null | undefined;
      booths: number[] | null | undefined;
      directCall: number[] | null | undefined;
      walkIn: number[] | null | undefined;
    };
    totalNewLeads: number[] | null | undefined;
  }

  export interface ReportFilters {
    fiscalYear?: string;
    donorType?: string;
    pipelineStage?: string;
  }

  export const emptyReport: Report = {
    timestamp: undefined,
    fiscalYear: undefined,
    donorType: undefined,
    pipelineStage: undefined,
    weightedForecast: undefined,
    leadConversionRate: undefined,
    totalPipelineValue: undefined,
    averageProbability: undefined,
    fiscalYearOptions: undefined,
    donorTypeOptions: undefined,
    pipelineStageOptions: undefined,
    leadOrigins: undefined,
    pipelineStages: undefined,
    quarterNewLeads: undefined,
    quarterlySummary: {
      totalEstimatedValue: undefined,
      probabilityAdjustedValue: undefined,
      securedValue: undefined,
      unsecuredBalance: undefined,
    },
    conversion: {
      leadConversionRate: undefined,
      valueRealizationRate: undefined,
    },
    leadsOrigin: {
      referral: undefined,
      research: undefined,
      booths: undefined,
      directCall: undefined,
      walkIn: undefined,
    },
    totalNewLeads: undefined,
  };
}
