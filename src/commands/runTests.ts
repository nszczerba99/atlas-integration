import * as vsc from 'vscode';
import { messages } from '../messages';
import { getAtlasTerminal } from '../utils/getAtlasTerminal';
import { findAthenaFolder } from '../utils/findAthenaFolder';
import { onAthenaMissing } from '../utils/onAthenaMissing';

export const runTests = (): void => {
	const athenaFolder = findAthenaFolder(vsc.workspace.workspaceFolders || []);
	if (athenaFolder) {
		const terminal = getAtlasTerminal(athenaFolder);
		terminal.show();
		
		const testCommand = vsc.workspace.getConfiguration().get('atlas.testCommand') as string;
		terminal.sendText(testCommand);	
	} else {
		onAthenaMissing(messages.ATHENA_SHOULD_BE_IN_WORKSPACE);
	}
};
