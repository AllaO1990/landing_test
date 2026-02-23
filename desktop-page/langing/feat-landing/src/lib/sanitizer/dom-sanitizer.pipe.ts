import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
	name: 'safeHtml',
	standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
	readonly #sanitizer: DomSanitizer = inject(DomSanitizer);

	transform(html: string): SafeHtml {
		return this.#sanitizer.bypassSecurityTrustHtml(html);
	}
}
