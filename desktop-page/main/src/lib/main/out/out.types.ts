import { TuiComparator } from '@taiga-ui/addon-table';

export interface OutHeaderItem {
  name: string;
  label: string;
  sorter: TuiComparator<any> | null;
}
