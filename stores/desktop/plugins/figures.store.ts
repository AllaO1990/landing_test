import { WithQueue } from '../core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';

export class FiguresStore extends WithQueue<any> {
  constructor(private readonly _api: DesktopService) {
    super({});
  }
}
