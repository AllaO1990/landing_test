import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';

export const getParamsFromRange = (range: TuiDayRange | null): { from: string | null; to: string | null } => {
  let from = null;
  let to = null;

  if (range !== null) {
    from = new Date((range.from as TuiDay).toUtcNativeDate().setUTCHours(0, 0, 0)).toISOString();
    to = new Date((range.to as TuiDay).toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString();
  }

  return { from, to };
};
