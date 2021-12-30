import * as vsc from 'vscode';
import { isAthena } from './isAthena';

export const findAthenaFolder = (folders: readonly vsc.WorkspaceFolder[]): vsc.WorkspaceFolder | undefined => {
	return folders.find((folder) => isAthena(folder));
};