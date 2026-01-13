import { UrlTree } from '@angular/router';

export const getPathFromFragment = (urlTree: UrlTree): string | null => {
	const reg = /path="([/?-\w+\d+=&]+)"/;

	if (urlTree.fragment) {
		const matchResult = urlTree.fragment.match(reg);

		if (matchResult) {
			return matchResult[1];
		}
	}

	return null;
};
