import { Injectable } from '@angular/core';
import { Idea } from 'types/idea';

@Injectable()
export class MainService {
  public sortIdeaList(list: Idea[]): Idea[] {
    const sortDate = (
      a: { date: string },
      b: {
        date: string;
      }
    ) => new Date(b.date).valueOf() - new Date(a.date).valueOf();

    const { vanya, user }: { vanya: Idea[]; user: Idea[] } = list.reduce(
      (
        acc: {
          vanya: Idea[];
          user: Idea[];
        },
        item: Idea
      ) => {
        if (item.idea) {
          acc.vanya.push(item);
        } else {
          acc.user.push(item);
        }

        return acc;
      },
      { vanya: [], user: [] }
    );

    return [...vanya.sort(sortDate), ...user.sort(sortDate)];
  }
}
