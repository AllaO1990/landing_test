import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'vt-issuer-info',
  templateUrl: './issuer-info.component.html',
  styleUrls: ['./issuer-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuerInfoComponent implements OnInit {
  @Input() issuerName = 'Детский мир';

  @Input() issuerId = 'DSKY';

  dateFg = this._fb.group({
    start: new FormControl(new Date(2021, 0, 13)),
    end: new FormControl(new Date(2022, 11, 16)),
  });

  constructor(private _fb: FormBuilder) {}

  ngOnInit(): void {}
}
