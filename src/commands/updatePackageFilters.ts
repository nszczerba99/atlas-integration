import * as vsc from 'vscode';
import { messages } from '../messages';
import { findFilePackage } from '../utils/findFilePackage';
import { getPackageFiltersFilePath } from '../utils/getPackageFiltersFilePath';
import { getTextDocumentLastPosition } from '../utils/getTextDocumentLastPosition';
import { isAthena } from '../utils/isAthena';
import { onAthenaMissing } from '../utils/onAthenaMissing';
import { onPackageFiltersMissing } from '../utils/onPackageFiltersMissing';

export const updatePackageFilters = (textEditor: vsc.TextEditor, context: vsc.ExtensionContext): void => {
	const currentFolder = vsc.workspace.getWorkspaceFolder(textEditor.document.uri);

	if (currentFolder && isAthena(currentFolder)) {
		const rootPath = currentFolder.uri.fsPath;
		const packageFiltersPath = getPackageFiltersFilePath(rootPath);

		vsc.workspace.openTextDocument(packageFiltersPath).then((packageFiltersDocument) => {
			const packageFiltersText: string = packageFiltersDocument.getText();

			findFilePackage(textEditor.document.uri.fsPath, rootPath).then((packagePath) => {
				if (!packageFiltersText.match(packagePath)) {
					let packageFiltersInsertPosition, insertText;
					const excludeAllPackagesMark = /^- \.\*/m.exec(packageFiltersText);

					if (excludeAllPackagesMark) {
						packageFiltersInsertPosition = packageFiltersDocument.positionAt(excludeAllPackagesMark.index - 1);
						insertText = `\n+ ${packagePath}`;
					} else {
						packageFiltersInsertPosition = getTextDocumentLastPosition(packageFiltersDocument);
						insertText = `\n+ ${packagePath}\n- .*\n`;
					}

					const edit: vsc.WorkspaceEdit = new vsc.WorkspaceEdit();
					edit.insert(packageFiltersDocument.uri, packageFiltersInsertPosition, insertText);

					vsc.workspace.applyEdit(edit).then(() => {
						packageFiltersDocument.save().then(() => {
							vsc.window.showInformationMessage(messages.PACKAGE_FILTERS_UPDATED);
							context.workspaceState.update('didPackageFiltersChange', true);
						});
					});
				} else {
					vsc.window.showInformationMessage(messages.PACKAGE_FILTERS_ALREADY_UPDATED);
				}
			}, () => {
				vsc.window.showErrorMessage(messages.PACKAGE_NOT_FOUND);
			});
		}, () => {
			onPackageFiltersMissing();
		});
	} else {
		onAthenaMissing(messages.ATHENA_SHOULD_BE_CURRENT_FOLDER);
	}
};