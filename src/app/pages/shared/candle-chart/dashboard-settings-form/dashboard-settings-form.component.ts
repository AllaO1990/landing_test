import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VtLocalStorageService } from 'src/app/core/storage/local-storage.service';

@Component({
  selector: 'vt-dashboard-settings-form',
  templateUrl: 'dashboard-settings-form.component.html',
  styleUrls: ['./dashboard-settings-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtDashboardSettingsFormComponent implements OnInit {
  formInitialized = false;

  timeframes = [
    { value: '1', viewValue: 'Минута' },
    { value: '1D', viewValue: 'День' },
    { value: '1W', viewValue: 'Неделя' },
  ];

  settingsFormGroup = new FormGroup({});

  constructor(
    public dialogRef: MatDialogRef<VtDashboardSettingsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _storageService: VtLocalStorageService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._initForm();
  }

  onNoClick() {
    this.dialogRef.close();
  }

  private _initForm() {
    const savedSettings = this._storageService.getObject<{ timeframe: string }>(
      'dashboard'
    );
    this.settingsFormGroup.addControl(
      'timeframe',
      new FormControl(savedSettings.timeframe ?? '1')
    );

    this.formInitialized = true;

    this._cdr.markForCheck();
  }
}
