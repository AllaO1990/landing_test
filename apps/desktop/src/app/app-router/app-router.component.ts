import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-router',
  templateUrl: './app-router.component.html',
  styleUrls: ['./app-router.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRouterComponent implements OnInit {
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  myControl = new UntypedFormControl();
  options: string[] = [];
  filteredOptions!: Observable<string[]>;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
