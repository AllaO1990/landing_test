import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { TuiDialogModule, TuiModeModule, TuiRootModule } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    // AppRoutingModule,
    // BrowserAnimationsModule,
    RouterModule,
    HttpClientModule,
    TuiRootModule,
    MatNativeDateModule,
    // LayoutStartModule,
    TuiModeModule,
    TuiDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'gpn-dev';
}
