import { TuiDay, TuiTime } from '@taiga-ui/cdk';

export const getTuiDayTime = (date: string | null): [TuiDay, TuiTime] | [null, null] => {
  if (date === null) {
    return [null, null];
  }

  const d = new Date(date);

  return [TuiDay.fromLocalNativeDate(d), TuiTime.fromLocalNativeDate(d)];
};
