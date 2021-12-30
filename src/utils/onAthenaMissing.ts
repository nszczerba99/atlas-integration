import * as vsc from 'vscode';

export const onAthenaMissing = (message: string): void => {
	const exploreAthenaText = 'Explore athena';
	vsc.window.showErrorMessage(message, exploreAthenaText).then((selection) => {
		if (selection === exploreAthenaText) {
			vsc.env.openExternal(vsc.Uri.parse('https://gitlab.cern.ch/atlas/athena'));
		}
	});
};