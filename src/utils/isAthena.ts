import * as vsc from 'vscode';

export const isAthena = (folder: vsc.WorkspaceFolder): boolean => {
	return folder.name === 'athena';
};