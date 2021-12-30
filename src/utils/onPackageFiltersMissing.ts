import * as vsc from 'vscode';
import { messages } from '../messages';

export const onPackageFiltersMissing = (): void => {
	const explorePackageFiltersText = 'Find out about "package_filters.txt"';
	vsc.window.showErrorMessage(messages.PACKAGE_FILTERS_FILE_NOT_FOUND, explorePackageFiltersText).then((selection) => {
		if (selection === explorePackageFiltersText) {
			vsc.env.openExternal(vsc.Uri.parse('https://atlassoftwaredocs.web.cern.ch/gittutorial/branch-and-change/#setting-up-to-compile-and-test-code-for-the-tutorial'));
		}
	});
};