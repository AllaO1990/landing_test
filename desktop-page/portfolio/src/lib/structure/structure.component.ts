import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiRingChartModule } from '@taiga-ui/addon-charts';
import { LoaderComponent } from '@ui/loader';
import { NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { StructureIsNaNPipe, StructureListValuePipe } from './structure.pipe';
import { scaleLinear } from 'd3-scale';
import { TuiFormatNumberPipeModule, TuiGroupModule } from '@taiga-ui/core';
import { TuiRadioBlockModule } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface StructureItem {
  value: number;
  name: string;
  percentage: number;
}

type StructureList = StructureItem[];

let COLOR_LIMIT = 5;

const COLOR_LIST = [
  '#a8cef1',
  '#3682db',
  '#8dda71',
  '#34b41f',
  '#e29398',
  '#b8474e',
  '#fcc068',
  '#ff8a00',
  '#dab3f9',
  '#7b439e',
  '#fee797',
  '#fcbb14',
  '#ea97c4',
  '#bd65a4',
  '#7fd7cc',
  '#2fad96',
  '#d4aca2',
  '#9d6f64',
  '#d2e9a2',
  '#aadc42',
];

@Component({
  selector: 'portfolio-structure',
  standalone: true,
  imports: [
    TuiRingChartModule,
    LoaderComponent,
    NgIf,
    StructureListValuePipe,
    StructureIsNaNPipe,
    NgForOf,
    TuiFormatNumberPipeModule,
    NgTemplateOutlet,
    TuiRadioBlockModule,
    TuiGroupModule,
    ReactiveFormsModule,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureComponent {
  readonly categories: { name: string; value: string }[] = [
    { name: 'Активы', value: '' },
    { name: 'Компании', value: '' },
    { name: 'Отрасли', value: '' },
    { name: 'Валюта', value: '' },
    { name: 'Портфель', value: '' },
  ];
  readonly controlCategories: FormControl = new FormControl(this.categories[0], Validators.required);

  activeItemIndex = Number.NaN;

  list: StructureList | null = null;
  summary = 0;

  @Input()
  set data(value: StructureList) {
    if (value) {
      if (value.length > COLOR_LIMIT) {
        this._generateColorList(value.length);
        COLOR_LIMIT = value.length;
      }
      this.summary = value.reduce((acc: number, item: StructureItem) => (acc += item.value), 0);
    }

    this.list = value;
  }

  private _generateColorList(length: number): void {
    const getColor = this._getColor(length);
    const root: HTMLElement = this._getStyleRoot();
    const text: string = Array.from({ length }, (_, i: number) => `--tui-chart-${i}: ${getColor(i)};`).join('');

    root.innerHTML = `:root {${text}}`;
  }

  private _getColor(length: number): (value: number) => string {
    const add = length / COLOR_LIST.length;
    const domain = Array.from({ length: COLOR_LIST.length }, (_, i: number) => i * add);

    return scaleLinear(domain, COLOR_LIST);
  }

  private _getStyleRoot(): HTMLElement {
    const root: HTMLElement | null = document.querySelector('style#root');

    if (root !== null) {
      return root;
    }

    const style: HTMLElement = document.createElement('style');
    style.id = 'root';
    document.head.appendChild(style);

    return document.querySelector('style#root') as HTMLElement;
  }

  trackByName(_: number, item: StructureItem): string {
    return item.name;
  }

  onMouseenter(event: Event, i: number): void {
    event.preventDefault();

    this.activeItemIndex = i;
  }

  onMouseleave(event: Event): void {
    event.preventDefault();

    this.activeItemIndex = Number.NaN;
  }
}
