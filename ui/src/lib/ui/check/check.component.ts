import { TuiIcon } from "@taiga-ui/core";
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-check',
  standalone: true,
  imports: [TuiIcon, NgIf],
  templateUrl: './check.component.html',
  styleUrl: './check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckComponent {
  @Input() value: boolean | null = false;
}
