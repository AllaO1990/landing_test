import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ENTRY_CONSTANTS, ENTRY_HEADER } from './entry.constants';
import { Observable } from 'rxjs';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { Idea } from 'types/idea';

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  public testValue = new FormControl(null);
  public constants = ENTRY_CONSTANTS;

  @Input() data: Idea[] | null = null;

  public readonly header: { name: string; label: string }[] = ENTRY_HEADER;
  public readonly columnList: string[] = this.header.map(
    (item: { name: string }) => item.name
  );

  public market = [
    {
      id: 1,
      text: 'РФ',
    },
    {
      id: 2,
      text: 'США',
    },
    {
      id: 3,
      text: 'Фьючерсы',
    },
    {
      id: 4,
      text: 'Опционы',
    },
    {
      id: 5,
      text: 'Валюты',
    },
  ];

  public time = [
    {
      id: 1,
      text: 'Краткосрок',
    },
    {
      id: 2,
      text: 'Среднесрок',
    },
    {
      id: 3,
      text: 'Долгосрок',
    },
    {
      id: 4,
      text: 'Скальпинг',
    },
  ];

  public trackByIndex(index: number): number {
    return index;
  }
  public trackById(index: number, item: Idea): number | string {
    return item.id;
  }
}
