import * as vsc from 'vscode';
import { messages } from '../messages';
import { isAthena } from '../utils/isAthena';
import { onAthenaMissing } from '../utils/onAthenaMissing';

export const updateCopyright = (textEditor: vsc.TextEditor, edit: vsc.TextEditorEdit): void => {
	const textDocument = textEditor.document;
	const currentFolder = vsc.workspace.getWorkspaceFolder(textDocument.uri);
	
	if (currentFolder && isAthena(currentFolder)) {
		const text = textDocument.getText();

		const copyrightInfo = /Copyright \(C\) [0-9]{4}-[0-9]{4} CERN for the benefit of the ATLAS collaboration/g.exec(text);
		const yearOffset = 19;
		const yearLength = 4;

		if (copyrightInfo) {
			const copyrightYear = copyrightInfo[0].substring(yearOffset, yearOffset + yearLength);
			const currentYear = new Date().getFullYear().toString();
			
			if (currentYear === copyrightYear) {
				vsc.window.showInformationMessage(messages.COPYRIGHT_ALREADY_UPDATED);
			} else {
				const startPos = textDocument.positionAt(copyrightInfo.index + yearOffset);
				const endPos = startPos.translate(0, yearLength);
				const yearLocation = new vsc.Range(startPos, endPos);

				edit.replace(yearLocation, currentYear);
				textDocument.save().then(() => {
					vsc.window.showInformationMessage(messages.COPYRIGHT_UPDATED);
				});
			}
		} else {
			vsc.window.showErrorMessage(messages.NO_COPYRIGHT_INFO);
		}
	} else {
		onAthenaMissing(messages.ATHENA_SHOULD_BE_CURRENT_FOLDER);
	}
};