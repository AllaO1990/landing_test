import { TuiComparator } from '@taiga-ui/addon-table';

export interface EntryHeaderItem {
  name: string;
  label: string;
  sorter: TuiComparator<any> | null;
}
