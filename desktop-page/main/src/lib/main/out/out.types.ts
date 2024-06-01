import { TuiComparator } from '@taiga-ui/addon-table';

export interface OutHeaderItem {
  name: string;
  label: string;
  title?: string;
  sorter: TuiComparator<any> | null;
}
