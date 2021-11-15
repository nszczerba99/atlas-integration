import * as vsc from 'vscode';

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
		config.update("python.envFile", pythonEnvRelPath, vsc.ConfigurationTarget.Workspace);
	}, () => {
		vsc.window.showErrorMessage(`Cannot set property "python.envFile": "${pythonEnvRelPath}" file not found`);
	}); 
}

function getLastPositionInFile(document: vsc.TextDocument) {
	const lastLine = document.lineAt(document.lineCount - 1);
	return lastLine.range.end;
}

export function activate(context: vsc.ExtensionContext) {

	if (!isAthenaOpened()) {
		vsc.window.showErrorMessage('"athena" should be the workspace root folder');
	}
	
	// vsc.workspace.onDidChangeWorkspaceFolders(() => {
	// });

	setPythonPath();

	let updatePackageFiltersDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.updatePackageFilters', (textEditor, edit) => {
		const currentFilePath = vsc.workspace.asRelativePath(textEditor.document.uri.fsPath);
		
		const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;
		const packageFiltersPathFromRoot = `../package_filters.txt`;
		const packageFiltersAbsPath = `${rootPath}/${packageFiltersPathFromRoot}`;

		vsc.workspace.openTextDocument(packageFiltersAbsPath).then((packageFiltersDocument) => {
			const packageFiltersText: string = packageFiltersDocument.getText();

			if (packageFiltersText.match(currentFilePath) === null) {
				let edit: vsc.WorkspaceEdit = new vsc.WorkspaceEdit();
				edit.insert(packageFiltersDocument.uri, getLastPositionInFile(packageFiltersDocument), `- ${currentFilePath}\n`);

				vsc.workspace.applyEdit(edit).then(() => {
					packageFiltersDocument.save().then(() => {
						vsc.window.showInformationMessage('"package_filters.txt" file updated');
					});
				}, (error) => {
					console.error(error);
				});
			}
		}, () => {
			vsc.window.showErrorMessage(`"\${workspaceFolder}/${packageFiltersPathFromRoot}" file not found`);
		}); 
	});

	context.subscriptions.push(updatePackageFiltersDisposable);

	let updateCopyrightDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.updateCopyright', (textEditor, edit) => {
		const textDocument = textEditor.document;
		const text = textDocument.getText();

		const copyrightInfo = /Copyright \(C\) [0-9]{4}\-[0-9]{4} CERN for the benefit of the ATLAS collaboration/g.exec(text);
		const yearOffset = 19;
		const yearLength = 4;

		if (copyrightInfo !== null) {
			const startPos = textDocument.positionAt(copyrightInfo.index + yearOffset);
			const endPos = startPos.translate(0, yearLength);
			const yearLocation = new vsc.Range(startPos, endPos);

			const currentYear = new Date().getFullYear().toString();

			edit.replace(yearLocation, currentYear);
			textDocument.save().then(() => {
				vsc.window.showInformationMessage("Copyright updated");
			});
		}
	});

	context.subscriptions.push(updateCopyrightDisposable);
}

export function deactivate() {}