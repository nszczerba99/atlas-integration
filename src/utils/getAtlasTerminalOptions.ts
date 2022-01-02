import * as vsc from 'vscode';
import { messages } from '../messages';

export const getAtlasTerminalOptions = (athenaFolder: vsc.WorkspaceFolder): vsc.TerminalOptions => {
	return {
		name: 'ATLAS',
		cwd: vsc.Uri.joinPath(athenaFolder.uri, '..'),
		iconPath: new vsc.ThemeIcon('folder'),
		message: messages.TERMINAL_WELCOME_MESSAGE,
	};
};