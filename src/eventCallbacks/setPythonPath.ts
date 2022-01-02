import * as path from 'path';
import * as vsc from 'vscode';
import { messages } from '../messages';
import { checkIfFileExists } from '../utils/checkIfFileExists';

export const setAthenaPythonPath = (athenaFolder: vsc.WorkspaceFolder): void => {
	const config = vsc.workspace.getConfiguration('python', athenaFolder);
	const rootPath = athenaFolder.uri.fsPath;
	const pythonEnvPathFromRoot = path.join('..', 'build', 'env.txt');
	const pythonEnvAbsPath = path.join(rootPath, pythonEnvPathFromRoot);
	const pythonEnvRelPath = `\${workspaceFolder}${path.sep}${pythonEnvPathFromRoot}`;

	checkIfFileExists(pythonEnvAbsPath).then(() => {
		config.update('envFile', pythonEnvRelPath, vsc.ConfigurationTarget.WorkspaceFolder).then(undefined, () => {
			vsc.window.showWarningMessage(messages.PYTHON_ENV_SETTING_ERROR);
		});
	}, () => {
		vsc.window.showWarningMessage(messages.PYTHON_ENV_FILE_NOT_FOUND);
	});
};