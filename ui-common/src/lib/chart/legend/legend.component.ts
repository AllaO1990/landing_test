import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { NgFor, NgTemplateOutlet } from '@angular/common';
import { ColorIndicator } from 'types/color';

@Pipe({
  name: 'legendColor',
  standalone: true,
})
export class LegendColorPipe implements PipeTransform {
  transform(value: string): string | null {
    const color = ColorIndicator[value.toLocaleUpperCase() as keyof typeof ColorIndicator];

    return color ? color : null;
  }
}

@Pipe({
  name: 'legendSort',
  standalone: true,
})
export class LegendSortPipe implements PipeTransform {
  transform(value: { name: string; value: string; order: number }[]) {
    return value.sort((a, b) => b.order - a.order);
  }
}

@Component({
  selector: 'lib-chart-legend',
  standalone: true,
  imports: [NgFor, LegendColorPipe, LegendSortPipe, NgTemplateOutlet],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss',
})
export class LegendComponent {
  @Input() list: { name: string; value: string; order: number }[] = [];

  trackByValue(_: number, item: { name: string; value: string; order: number }): string {
    return item.value;
  }
}
