import * as vsc from 'vscode';
import * as path from 'path';

function isAthenaOpened() {
	const workspaceFolders = vsc.workspace.workspaceFolders;
	if (workspaceFolders !== undefined && workspaceFolders.length === 1 && workspaceFolders[0].name === 'athena') {
		return true;
	} else {
		return false;
	}
}

function setPythonPath() {
	const config = vsc.workspace.getConfiguration();
	const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;
	const pythonEnvPathFromRoot = `../build/env.txt`;
	const pythonEnvAbsPath = `${rootPath}/${pythonEnvPathFromRoot}`;
	const pythonEnvRelPath = `\${workspaceFolder}/${pythonEnvPathFromRoot}`;

	vsc.workspace.fs.stat(vsc.Uri.file(pythonEnvAbsPath)).then(() => {
		config.update('python.envFile', pythonEnvRelPath, vsc.ConfigurationTarget.Workspace);
	}, () => {
		vsc.window.showErrorMessage(`Cannot set property "python.envFile": "${pythonEnvRelPath}" file not found`);
	}); 
}

function getTextDocumentLastPosition(document: vsc.TextDocument) {
	const lastLine = document.lineAt(document.lineCount - 1);
	return lastLine.range.end;
}

async function getFilePackage(filePath: string): Promise<string | undefined> {
	const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;
	let currentDirPath = path.dirname(filePath);

	while (currentDirPath !== rootPath) {
		currentDirPath = path.join(currentDirPath, '..');
		const cmakeFilePath = `${currentDirPath}/CMakeLists.txt`;

		const filePackage = await vsc.workspace.fs.stat(vsc.Uri.file(cmakeFilePath)).then(() => {
			return vsc.workspace.asRelativePath(currentDirPath);
		}, () => {
			return undefined;
		});
		if (filePackage) { return filePackage; }
	}
	return undefined;
}

export function activate(context: vsc.ExtensionContext): void {

	if (!isAthenaOpened()) {
		vsc.window.showErrorMessage('"athena" should be the workspace root folder');
		return;
	}

	setPythonPath();

	// vsc.workspace.onDidChangeWorkspaceFolders(() => {
	// });

	let didPackageFiltersChanged = true;
	let didBuildFilesAdded = false;

	vsc.workspace.onDidCreateFiles((event) => {
		if (!didBuildFilesAdded) {
			event.files.forEach((uri) => {
				const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;
				const packageFiltersPathFromRoot = `../package_filters.txt`;
				const packageFiltersAbsPath = `${rootPath}/${packageFiltersPathFromRoot}`;

				vsc.workspace.openTextDocument(packageFiltersAbsPath).then((packageFiltersDocument) => {
					const packageFiltersText: string = packageFiltersDocument.getText();
					getFilePackage(uri.fsPath).then((packagePath) => {
						if (packagePath && packageFiltersText.match(packagePath)) {
							didBuildFilesAdded = true;
						}
					});
				}, () => {
					vsc.window.showErrorMessage(`"\${workspaceFolder}/${packageFiltersPathFromRoot}" file not found`);
				}); 
			});
		}
	});
	
	const updatePackageFiltersDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.addCurrentPackageToTheBuild', (textEditor) => {
		getFilePackage(textEditor.document.uri.fsPath).then((packagePath) => {
			if (packagePath !== undefined) {
				const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;
				const packageFiltersPathFromRoot = `../package_filters.txt`;
				const packageFiltersAbsPath = `${rootPath}/${packageFiltersPathFromRoot}`;

				vsc.workspace.openTextDocument(packageFiltersAbsPath).then((packageFiltersDocument) => {
					const packageFiltersText: string = packageFiltersDocument.getText();

					if (packageFiltersText.match(packagePath) === null) {
						let packageFiltersInsertPosition, insertText;
						const excludeAllPackagesMark = /^- \.\*$/m.exec(packageFiltersText);		

						if (excludeAllPackagesMark) {
							packageFiltersInsertPosition = packageFiltersDocument.positionAt(excludeAllPackagesMark.index - 1);
							insertText = `\n+ ${packagePath}`;
						} else {
							packageFiltersInsertPosition = getTextDocumentLastPosition(packageFiltersDocument);
							insertText = `\n+ ${packagePath}\n- .*\n`;
						}

						const edit: vsc.WorkspaceEdit = new vsc.WorkspaceEdit();
						edit.insert(packageFiltersDocument.uri, packageFiltersInsertPosition, insertText);

						vsc.workspace.applyEdit(edit).then(() => {
							packageFiltersDocument.save().then(() => {
								vsc.window.showInformationMessage('"package_filters.txt" file updated');
								didPackageFiltersChanged = true;
							});
						}, (error) => {
							console.error(error);
						});
					} else {
						vsc.window.showInformationMessage('Package already added to the build');
					}
				}, () => {
					vsc.window.showErrorMessage(`"\${workspaceFolder}/${packageFiltersPathFromRoot}" file not found`);
				}); 
			} else {
				vsc.window.showErrorMessage(`Package of ${vsc.workspace.asRelativePath(textEditor.document.uri.fsPath)} file not found`);
			}
		});
	});

	context.subscriptions.push(updatePackageFiltersDisposable);

	const updateCopyrightDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.updateCopyright', (textEditor, edit) => {
		const textDocument = textEditor.document;
		const text = textDocument.getText();

		const copyrightInfo = /Copyright \(C\) [0-9]{4}-[0-9]{4} CERN for the benefit of the ATLAS collaboration/g.exec(text);
		const yearOffset = 19;
		const yearLength = 4;

		if (copyrightInfo !== null) {
			const startPos = textDocument.positionAt(copyrightInfo.index + yearOffset);
			const endPos = startPos.translate(0, yearLength);
			const yearLocation = new vsc.Range(startPos, endPos);

			const currentYear = new Date().getFullYear().toString();

			edit.replace(yearLocation, currentYear);
			textDocument.save().then(() => {
				vsc.window.showInformationMessage('Copyright updated');
			});
		}
	});

	context.subscriptions.push(updateCopyrightDisposable);

	const runMakeDisposable = vsc.commands.registerCommand('atlas-integration.compile', () => {
		vsc.window.activeTerminal?.show();
		if (didPackageFiltersChanged || didBuildFilesAdded) {
			vsc.window.activeTerminal?.sendText('cmake -DATLAS_PACKAGE_FILTER_FILE=../package_filters.txt ../athena/Projects/WorkDir');
		}
		vsc.window.activeTerminal?.sendText('make');

		didBuildFilesAdded = false;
		didPackageFiltersChanged = false;
	});

	context.subscriptions.push(runMakeDisposable);

	const runTestsDisposable = vsc.commands.registerCommand('atlas-integration.test', () => {
		vsc.window.activeTerminal?.show();
		const testCommand = vsc.workspace.getConfiguration().get('testing.testCommand');
		vsc.window.activeTerminal?.sendText(testCommand as string);
	});

	context.subscriptions.push(runTestsDisposable);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}