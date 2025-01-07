import { Injectable } from '@angular/core';
import { IdeaAuthor } from 'types/idea';
import { Position } from 'types/position';

@Injectable()
export class MainService {
  public sortIdeaList(list: Position[]): Position[] {
    const sortDate = (a: { createdAt: string }, b: { createdAt: string }) =>
      new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();

    const { vanya, user }: { vanya: Position[]; user: Position[] } = list.reduce(
      (
        acc: {
          vanya: Position[];
          user: Position[];
        },
        item: Position
      ) => {
        if (item.author === IdeaAuthor.BOT) {
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
