import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

  ideaFormGroup = new FormGroup({
    expiresAt: new FormGroup({
      date: new FormControl(new Date()),
      infinite: new FormControl(false),
    }),
    investmentPeriod: new FormControl('mid'),
    tradingPosition: new FormControl('short'),
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
