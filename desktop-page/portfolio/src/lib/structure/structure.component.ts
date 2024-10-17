import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { TuiRingChartModule } from '@taiga-ui/addon-charts';
import { AsyncPipe, DOCUMENT, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { StructureIsNaNPipe, StructureListValuePipe } from './structure.pipe';
import { scaleLinear } from 'd3-scale';
import { TuiFormatNumberPipeModule, TuiGroupModule } from '@taiga-ui/core';
import { TuiRadioBlockModule } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { COLOR_LIST } from './structure.constants';
import { filter, Observable, ReplaySubject, startWith, Subject, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderComponent } from '@ui/components/loader';
import { ItemDirective, ListComponent } from '@ui/components/list';

interface StructureControl {
  name: string;
  value: string;
}

interface StructureItem {
  value: number;
  name: string;
  percentage: number;
}

type StructureList = {
  name: string;
  value: string;
  list: StructureItem[];
}[];

let COLOR_LIMIT = 5;

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
    AsyncPipe,
    ListComponent,
    ItemDirective,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureComponent {
  private readonly _doc: Document = inject(DOCUMENT);
  private readonly _styleId: string = 'structure';
  private readonly _data$: Subject<StructureList> = new ReplaySubject(1);

  readonly controlCategories: FormControl = new FormControl(null, Validators.required);

  activeItemIndex = Number.NaN;
  summary = 0;

  private readonly data$: Observable<StructureList> = this._data$
    .asObservable()
    .pipe(filter((data: StructureList | null): data is StructureList => data !== null));

  categories$: Observable<StructureControl[]> = this.data$.pipe(
    map((data: StructureList) => data.map(({ name, value }: { name: string; value: string }) => ({ name, value }))),
    tap((list: { name: string; value: string }[]) => this.controlCategories.patchValue(list[0]))
  );

  list$: Observable<StructureItem[]> = this.data$.pipe(
    switchMap((list: StructureList) =>
      this.controlCategories.valueChanges.pipe(
        startWith(this.controlCategories.value),
        map((controlValue: StructureControl) => {
          const find = list.find((item: { value: string }) => item.value === controlValue.value);

          return find ? find.list : [];
        }),
        tap((list: StructureItem[]) => (this.summary = list.reduce((acc, item) => (acc += item.value), 0)))
      )
    )
  );

  @Input()
  set data(value: StructureList) {
    if (value) {
      const max = Math.max(...value.map((item) => item.list.length));

      if (max > COLOR_LIMIT) {
        COLOR_LIMIT = max;
        this._generateColorList(COLOR_LIMIT);
      }
    }

    this._data$.next(value);
  }

  private _generateColorList(length: number): void {
    const style = this._getStyleTag();
    const getColor = this._getColor(length);
    const text: string = Array.from({ length }, (_, i: number) => `--tui-chart-${i}: ${getColor(i)};`).join('');

    style.innerHTML = `:root{${text}`;
  }

  private _getColor(length: number): (value: number) => string {
    const add = length / COLOR_LIST.length;
    const domain = Array.from({ length: COLOR_LIST.length }, (_, i: number) => i * add);

    return scaleLinear(domain, COLOR_LIST);
  }

  private _getStyleTag(): HTMLElement {
    const root: HTMLElement | null = this._doc.querySelector(`style#${this._styleId}`);

    if (root !== null) {
      return root;
    }

    const style: HTMLElement = this._doc.createElement('style');
    style.id = this._styleId;
    this._doc.head.appendChild(style);

    return this._doc.querySelector(`style#${this._styleId}`) as HTMLElement;
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
