export type TMetricType = "percentage" | "value";
export interface IStatData {
  id: string;
  label: string;
  value: number;
  changeValue?: number;
  changePercentage?: number;
}

export type TAmountBucket = {
  date: string;
  total: number;
};
