import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TuiTabsModule } from '@taiga-ui/kit';
import { TuiSvgModule } from '@taiga-ui/core';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'lib-tabs',
  standalone: true,
  imports: [TuiTabsModule, TuiSvgModule, NgForOf],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  @Input() tabs: { text: string; icon: string; title?: string }[] = [];

  @Input() activeItemIndex = -1;

  @Output() activeItemIndexChange: EventEmitter<number> = new EventEmitter<number>();

  onChange(event: number): void {
    this.activeItemIndexChange.emit(event);
  }

  trackByIndex(index: number): number {
    return index;
  }

  protected readonly onchange = onchange;
}
