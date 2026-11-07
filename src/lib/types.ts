export namespace Leads {
  export interface Report {
    fiscalYearOptions: string[];
    donorTypeOptions: string[];
    pipelineStageOptions: string[];
    weightedForecast: number | null;
    leadConversionRate: number | null;
    totalPipelineValue: number | null;
    averageProbability: number | null;
    leadOrigins: Record<string, number | null>[];
    pipelineStages: Record<string, number | null>[];
    quarterNewLeads: Record<string, number | null>[];
    quarterlySummary: {
      totalEstimatedValue: number[];
      probabilityAdjustedValue: number[];
      securedValue: number[];
      unsecuredBalance: number[];
    };
    conversion: {
      leadConversionRate: number[];
      valueRealizationRate: number[];
    };
    leadsOrigin: {
      referral: number[];
      research: number[];
      booths: number[];
      directCall: number[];
      walkIn: number[];
    };
    totalNewLeads: number[];
  }

  export interface ReportFilters {
    fiscalYear?: string;
    donorType?: string;
    pipelineStage?: string;
  }

  export const emptyReport: Report = {
    fiscalYearOptions: ["All Years"],
    donorTypeOptions: ["All Types"],
    pipelineStageOptions: ["All Stages"],
    weightedForecast: 0,
    leadConversionRate: 0,
    totalPipelineValue: 0,
    averageProbability: 0,
    leadOrigins: [{ "No data": 0 }],
    pipelineStages: [{ "No data": 0 }],
    quarterNewLeads: [{ "No data": 0 }],
    quarterlySummary: {
      totalEstimatedValue: [0, 0, 0, 0, 0],
      probabilityAdjustedValue: [0, 0, 0, 0, 0],
      securedValue: [0, 0, 0, 0, 0],
      unsecuredBalance: [0, 0, 0, 0, 0],
    },
    conversion: {
      leadConversionRate: [0, 0, 0, 0, 0],
      valueRealizationRate: [0, 0, 0, 0, 0],
    },
    leadsOrigin: {
      referral: [0, 0, 0, 0, 0],
      research: [0, 0, 0, 0, 0],
      booths: [0, 0, 0, 0, 0],
      directCall: [0, 0, 0, 0, 0],
      walkIn: [0, 0, 0, 0, 0],
    },
    totalNewLeads: [0, 0, 0, 0, 0],
  };
}
