import * as vsc from 'vscode';
import { getAtlasTerminal } from '../utils/getAtlasTerminal';
import { setAthenaPythonPath } from './setPythonPath';

export const setupExtensionComponents = (athenaFolder: vsc.WorkspaceFolder): void => {
	setAthenaPythonPath(athenaFolder);
	const terminal = getAtlasTerminal(athenaFolder);
	terminal.show();
};