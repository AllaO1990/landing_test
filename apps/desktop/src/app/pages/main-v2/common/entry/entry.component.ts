import {ChangeDetectionStrategy, Component, inject, Inject, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ENTRY_CONSTANTS} from './entry.constants';
import {DesktopStubService} from "../../../../../../../../api/desktop-data/src/lib/desktop-data/desktop.stub.service";
import {Observable} from "rxjs";

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent implements OnInit {
  public testValue = new FormControl(null);
  public constants = ENTRY_CONSTANTS;

  public readonly _api: DesktopStubService = inject(DesktopStubService);
  public data$: Observable<any[]> = this._api.getListIdea() as Observable<any[]>;

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

  constructor() {
  }

  ngOnInit(): void {
  }
}
