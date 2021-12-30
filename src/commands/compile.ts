import * as vsc from 'vscode';
import { getAtlasTerminal } from '../utils/getAtlasTerminal';
import { messages } from '../messages';
import { checkIfFileExists } from '../utils/checkIfFileExists';
import { findAthenaFolder } from '../utils/findAthenaFolder';
import { getPackageFiltersFilePath } from '../utils/getPackageFiltersFilePath';
import { onAthenaMissing } from '../utils/onAthenaMissing';
import { onPackageFiltersMissing } from '../utils/onPackageFiltersMissing';

export const compile = (context: vsc.ExtensionContext): void => {
	const athenaFolder = findAthenaFolder(vsc.workspace.workspaceFolders || []);

	if (athenaFolder) {
		const packageFiltersPath = getPackageFiltersFilePath(athenaFolder.uri.fsPath);

		checkIfFileExists(packageFiltersPath).then(() => {
			const terminal = getAtlasTerminal(athenaFolder);
			terminal.show();
			
			const didPackageFiltersChange = context.workspaceState.get('didPackageFiltersChange', true);
			const wereBuildFilesAdded = context.workspaceState.get('wereBuildFilesAdded', false);

			let textToSend = '';
			if (didPackageFiltersChange || wereBuildFilesAdded) {
				textToSend += 'cmake -DATLAS_PACKAGE_FILTER_FILE=../package_filters.txt ../athena/Projects/WorkDir && ';
			}
			const compileCommand = vsc.workspace.getConfiguration().get('atlas.compileCommand') as string;
			textToSend += compileCommand;

			terminal.sendText(textToSend);

			context.workspaceState.update('wereBuildFilesAdded', false);
			context.workspaceState.update('didPackageFiltersChange', false);
		}, () => {
			onPackageFiltersMissing();
		});
	} else {
		onAthenaMissing(messages.ATHENA_SHOULD_BE_IN_WORKSPACE);
	}
};
