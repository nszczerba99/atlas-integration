import * as vsc from 'vscode';

export const getTextDocumentLastPosition = (document: vsc.TextDocument): vsc.Position => {
	const lastLine = document.lineAt(document.lineCount - 1);
	return lastLine.range.end;
};