import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-enter-sidebar-instrument',
  standalone: true,
  imports: [NgIf],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentComponent {
  @Input() data: { name: string; ticker: string; type: string } | null = null;
}
