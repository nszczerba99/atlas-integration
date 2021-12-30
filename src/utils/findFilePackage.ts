import * as vsc from 'vscode';
import * as path from 'path';
import { checkIfFileExists } from './checkIfFileExists';

export const findFilePackage = async (filePath: string, rootPath: string): Promise<string> => {
	let currentDirPath = path.dirname(filePath);

	while (currentDirPath !== rootPath) {
		const cmakeFilePath = path.join(currentDirPath, 'CMakeLists.txt');

		const filePackage = await checkIfFileExists(cmakeFilePath).then(() => {
			return vsc.workspace.asRelativePath(currentDirPath, false);
		}, () => {
			return undefined;
		});
		if (filePackage) { return filePackage; }

		currentDirPath = path.join(currentDirPath, '..');
	}
	throw vsc.FileSystemError.FileNotFound();
};