import { VtDirection } from '../../../../../shared/interfaces/direction.enums';

export interface IdeaType {
  id: number;
  direction: VtDirection;
  ticker: string;
  cost: number;
  enter: number;
  stop: number;
  luck: number;
  idea: boolean;
}
