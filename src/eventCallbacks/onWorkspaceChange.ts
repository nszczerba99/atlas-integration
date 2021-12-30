import * as vsc from 'vscode';
import { findAthenaFolder } from '../utils/findAthenaFolder';
import { setupExtensionComponents } from './setupExtensionComponents';

export const onWorkspaceChange = (event: vsc.WorkspaceFoldersChangeEvent): void => {
	const athenaAddedFolder = findAthenaFolder(event.added);
	if (athenaAddedFolder) {
		setupExtensionComponents(athenaAddedFolder);
		return;
	}
};
