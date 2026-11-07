export namespace Primitives {
  export interface Option {
    key: string;
    value: string | null | undefined;
  };
}

export namespace Leads {
  export interface Report {
    fiscalYearOptions: Primitives.Option[] | null | undefined;
    donorTypeOptions: Primitives.Option[] | null | undefined;
    pipelineStageOptions: Primitives.Option[] | null | undefined;
    weightedForecast: number | null | undefined;
    leadConversionRate: number | null | undefined;
    totalPipelineValue: number | null | undefined;
    averageProbability: number | null | undefined;
    leadOrigins: Primitives.Option[] | null | undefined;
    pipelineStages: Primitives.Option[] | null | undefined;
    quarterNewLeads: Primitives.Option[] | null | undefined;
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
    fiscalYearOptions: undefined,
    donorTypeOptions: undefined,
    pipelineStageOptions: undefined,
    weightedForecast: undefined,
    leadConversionRate: undefined,
    totalPipelineValue: undefined,
    averageProbability: undefined,
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
