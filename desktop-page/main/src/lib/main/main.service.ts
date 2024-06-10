import { Injectable } from '@angular/core';
import { Idea, IdeaAuthor } from 'types/idea';

@Injectable()
export class MainService {
  public sortIdeaList(list: Idea[]): Idea[] {
    const sortDate = (a: { createdAt: string }, b: { createdAt: string }) =>
      new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();

    const { vanya, user }: { vanya: Idea[]; user: Idea[] } = list.reduce(
      (
        acc: {
          vanya: Idea[];
          user: Idea[];
        },
        item: Idea
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
