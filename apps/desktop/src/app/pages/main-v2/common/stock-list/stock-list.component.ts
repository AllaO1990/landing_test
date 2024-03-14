import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { DATA_INPUT } from './stock-list.constant';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiInputModule, TuiSelectModule, TuiTextareaModule } from '@taiga-ui/kit';
import { TuiButtonModule, TuiDataListModule, TuiSvgModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { NgFor, NgIf } from '@angular/common';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { Observable, Subject } from 'rxjs';
import { DesktopApiService } from '../../../../../../../../api/desktop-data/src/lib/desktop-data/desktop.api.service';

@Component({
  selector: 'vt-stock-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    ScrollingModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiTextfieldControllerModule,
    TuiSvgModule,
    TuiTextareaModule,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiButtonModule
  ],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockListComponent implements OnInit {
  private readonly _nameList$: Subject<any[]>
  
  @Input() data = DATA_INPUT;

  public titleList: string[] = [
    'Символ',
    'Посл.цена',
    'Изменение',
    'Изм. в %',
    'Сектор'
  ];

  readonly items = ['https://twitter.com/marsibarsi', 'https://twitter.com/waterplea'];

  readonly testForm = new FormGroup({
    email: new FormControl(null),
    signature: new FormControl('')
  });

  signatureVisible = false;

  toggle(): void {
    this.signatureVisible = !this.signatureVisible;
  }


  constructor() {
  }

  ngOnInit(): void {
  }

  public trackByIndex(index: number): number {
    return index;
  }
}
