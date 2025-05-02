import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { addDays } from 'date-fns/addDays';

export const getListOfRange = (day: Date): { text: string; range: TuiDayRange }[] => {
  return [
    {
      text: 'Сегодня',
      range: new TuiDayRange(TuiDay.fromLocalNativeDate(day), TuiDay.fromLocalNativeDate(day)),
    },
    {
      text: '7 дней',
      range: new TuiDayRange(TuiDay.fromLocalNativeDate(addDays(day, -6)), TuiDay.fromLocalNativeDate(day)),
    },
    {
      text: '30 дней',
      range: new TuiDayRange(TuiDay.fromLocalNativeDate(addDays(day, -29)), TuiDay.fromLocalNativeDate(day)),
    },
    {
      text: '90 дней',
      range: new TuiDayRange(TuiDay.fromLocalNativeDate(addDays(day, -89)), TuiDay.fromLocalNativeDate(day)),
    },
    {
      text: '365 дней',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(addDays(day, -364).getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(day)
      ),
    },
    {
      text: 'С Начала года',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(day.getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(day)
      ),
    },
  ];
};
