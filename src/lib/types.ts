export type none = null | undefined;

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
    weightedForecast?: number | none;
    leadConversionRate?: number | none;
    totalPipelineValue?: number | none;
    averageProbability?: number | none;
    fiscalYearOptions?: Primitives.DropdownOption[] | none;
    donorTypeOptions?: Primitives.DropdownOption[] | none;
    pipelineStageOptions?: Primitives.DropdownOption[] | none;
    leadOrigins?: Primitives.ChartOption[] | none;
    pipelineStages?: Primitives.ChartOption[] | none;
    quarterNewLeads?: Primitives.ChartOption[] | none;
    quarterlySummary?:
      | {
          pipelineValue?: {
            totalEstimatedValue?: (number | none)[] | none;
            probabilityAdjustedValue?: (number | none)[] | none;
            securedValue?: (number | none)[] | none;
            unsecuredBalance?: (number | none)[] | none;
          };
          conversion?: {
            leadConversionRate?: (number | none)[] | none;
            valueRealizationRate?: (number | none)[] | none;
          };
          leadsOrigin?: {
            referral?: (number | none)[] | none;
            research?: (number | none)[] | none;
            booths?: (number | none)[] | none;
            directCall?: (number | none)[] | none;
            walkIn?: (number | none)[] | none;
          };
          totalNewLeads?: (number | none)[] | none;
        }
      | null
      | undefined;
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
    quarterlySummary: undefined,
  };
}
