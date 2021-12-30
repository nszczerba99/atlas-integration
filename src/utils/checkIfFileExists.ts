import * as vsc from 'vscode';

export const checkIfFileExists = (path: string): Thenable<vsc.FileStat> => {
	return vsc.workspace.fs.stat(vsc.Uri.file(path));
};