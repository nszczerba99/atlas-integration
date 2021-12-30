import * as vsc from 'vscode';
import { findAthenaFolder } from '../utils/findAthenaFolder';
import { setupExtensionComponents } from './setupExtensionComponents';

export const onStartup = (): void => {
	const athenaFolder = findAthenaFolder(vsc.workspace.workspaceFolders || []);
	if (athenaFolder) {
		setupExtensionComponents(athenaFolder);
	}
};
