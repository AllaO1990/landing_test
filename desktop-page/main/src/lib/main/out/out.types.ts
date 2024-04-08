import { TuiComparator } from '@taiga-ui/addon-table';

export interface OutHeaderItem {
  name: string;
  label: string;
  rowspan: number | null;
  colspan: number | null;
  sorter: TuiComparator<any> | null;
}
