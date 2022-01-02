import * as vsc from 'vscode';
import { findFilePackage } from '../utils/findFilePackage';
import { getPackageFiltersFilePath } from '../utils/getPackageFiltersFilePath';
import { isAthena } from '../utils/isAthena';
import { onPackageFiltersMissing } from '../utils/onPackageFiltersMissing';

export const updateCompileCommands = (event: vsc.FileCreateEvent | vsc.FileDeleteEvent | vsc.FileRenameEvent, context: vsc.ExtensionContext): void => {
	const checkFile = (uri: vsc.Uri) => {
		const currentFolder = vsc.workspace.getWorkspaceFolder(uri);
		if (currentFolder && isAthena(currentFolder)) {
			const rootPath = currentFolder.uri.fsPath;
			const packageFiltersPath = getPackageFiltersFilePath(rootPath);

			vsc.workspace.openTextDocument(packageFiltersPath).then((packageFiltersDocument) => {
				const packageFiltersText = packageFiltersDocument.getText();
				
				findFilePackage(uri.fsPath, rootPath).then((packagePath) => {
					if (packagePath && packageFiltersText.match(packagePath)) {
						context.workspaceState.update('wereBuildFilesAdded', true);
					}
				});
			}, () => {
				onPackageFiltersMissing();
			});
		}
	};

	const wereBuildFilesAdded = context.workspaceState.get('wereBuildFilesAdded', false);
	if (!wereBuildFilesAdded) {
		event.files.forEach((uriData) => {
			if (uriData instanceof vsc.Uri) {
				checkFile(uriData);
			} else {
				checkFile(uriData.newUri);
			}
		});
	}
};	