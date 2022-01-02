import * as vsc from 'vscode';
import { getAtlasTerminalOptions } from './getAtlasTerminalOptions';

export const getAtlasTerminal = (athenaFolder: vsc.WorkspaceFolder): vsc.Terminal => {
	const terminal = vsc.window.terminals.find((terminal) => terminal.name === 'ATLAS')
	|| vsc.window.createTerminal(getAtlasTerminalOptions(athenaFolder));

	return terminal;
};