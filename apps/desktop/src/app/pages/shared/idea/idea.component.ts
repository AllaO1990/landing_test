import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IdeaService } from './idea.service';

declare const TradingView: any;

@Component({
  selector: 'vt-idea-dialog',
  templateUrl: 'idea.component.html',
  styleUrls: ['idea.component.scss'],
  providers: [IdeaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtIdeaComponent implements OnInit {
  investmentPeriods = [
    { value: 'short', name: 'Краткосрок' },
    { value: 'mid', name: 'Среднесрок' },
    { value: 'long', name: 'Долгосрок' },
  ];

  tradingPositions = [
    { value: 'short', name: 'Шорт' },
    { value: 'long', name: 'Лонг' },
  ];

  ideaCommonInfo = [
    { value: '7.00%', name: 'Вероятность успеха' },
    { value: '2.63%', name: '% депозита' },
    { value: 'Энергетика', name: 'Сектор экономики' },
    { value: '20%', name: '% Сектора в вашем портфеле' },
  ];

  ideaFormGroup = new UntypedFormGroup({
    expiresAt: new UntypedFormGroup({
      date: new UntypedFormControl(new Date()),
      infinite: new UntypedFormControl(false),
    }),
    investmentPeriod: new UntypedFormControl('mid'),
    tradingPosition: new UntypedFormControl('short'),
  });

  constructor(
    public dialogRef: MatDialogRef<VtIdeaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {}

  onSubmit() {
    return;
  }
}
