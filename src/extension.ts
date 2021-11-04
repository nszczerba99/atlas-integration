import * as vscode from 'vscode';

function setPythonPath() {
	const config = vscode.workspace.getConfiguration();
	vscode.workspace.findFiles('**/build/env.txt').then((uris) => {
		if(uris.length === 1) {
			const newPythonPath = uris[0].fsPath;
			if (config.get("python.envFile") !== newPythonPath) {
				config.update("python.envFile", newPythonPath, vscode.ConfigurationTarget.Workspace);
			}
		} else {
			vscode.window.showErrorMessage('Cannot set property "python.envFile": no "build/env.txt" file');
		}
	}, (error: any) => {
		console.error(error);
	}); 
}

async function findPackageFiltersUri() {
	return await vscode.workspace.findFiles('**/package_filters.txt').then((uris) => {
		if(uris.length === 1) {
			return uris[0];
		} else {
			return null;
		}
	});
}

function getLastPositionInFile(document: vscode.TextDocument) {
	const lastLine = document.lineAt(document.lineCount - 1);
	return lastLine.range.end;
}

async function updateCopyrightInfo(uri: vscode.Uri): Promise<void> {
	let document: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
	const text: string = document.getText();

	const copyrightInfo = /Copyright \(C\) [0-9]{4}\-[0-9]{4} CERN for the benefit of the ATLAS collaboration/g.exec(text);
	const yearOffset = 19;
	const yearLength = 4;
	if (copyrightInfo !== null) {
		const startPos = document.positionAt(copyrightInfo.index + yearOffset);
		const endPos = startPos.translate(0, yearLength);
		const range = new vscode.Range(startPos, endPos);

		const currentYear = new Date().getFullYear().toString();
		const previousYear = copyrightInfo[0].substr(yearOffset, yearLength);
		if (previousYear !== currentYear) {
			let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
			edit.replace(uri, range, currentYear);
			await vscode.workspace.applyEdit(edit);
			await document.save();
			vscode.window.showInformationMessage("Copyright data updated");
		}
	}
}

async function updatePackageFiltersFile(uri: vscode.Uri, packageFiltersUri: vscode.Uri): Promise<void> {
	const packageFiltersDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(packageFiltersUri);
	const packageFiltersText: string = packageFiltersDocument.getText();
	const changedFilename = uri.fsPath;

	if (packageFiltersText.match(changedFilename) === null) {
		let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
		edit.insert(packageFiltersUri, getLastPositionInFile(packageFiltersDocument), `\n- ${uri.fsPath}`);
		await vscode.workspace.applyEdit(edit);
		await packageFiltersDocument.save();
		vscode.window.showInformationMessage('"package_filters.txt" file updated');
	}
}

export function activate(context: vscode.ExtensionContext) {

	setPythonPath();

	findPackageFiltersUri().then((packageFiltersUri) => {
		let watcher = vscode.workspace.createFileSystemWatcher("**/athena/**/*.{py,cxx,h,txt}", true, false, true);

		watcher.onDidChange((uri) => {
			updateCopyrightInfo(uri);

			if (packageFiltersUri !== null) {
				updatePackageFiltersFile(uri, packageFiltersUri);
			}
		});
	});
}

export function deactivate() {}