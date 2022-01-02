import * as vsc from 'vscode';
import { compile } from './commands/compile';
import { runTests } from './commands/runTests';
import { updateCopyright } from './commands/updateCopyright';
import { updatePackageFilters } from './commands/updatePackageFilters';
import { updateCompileCommands } from './eventCallbacks/updateCompileCommands';
import { onWorkspaceChange } from './eventCallbacks/onWorkspaceChange';
import { onStartup } from './eventCallbacks/onStartup';

export function activate(context: vsc.ExtensionContext): void {
	onStartup();
	
	vsc.workspace.onDidChangeWorkspaceFolders(onWorkspaceChange);

	vsc.workspace.onDidCreateFiles((event) => updateCompileCommands(event, context));
	vsc.workspace.onDidDeleteFiles((event) => updateCompileCommands(event, context));
	vsc.workspace.onDidRenameFiles((event) => updateCompileCommands(event, context));
	
	const updatePackageFiltersDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.addCurrentPackageToTheBuild', (editor) => updatePackageFilters(editor, context));
	const updateCopyrightDisposable = vsc.commands.registerTextEditorCommand('atlas-integration.updateCopyright', updateCopyright);
	const compileDisposable = vsc.commands.registerCommand('atlas-integration.compile', () => compile(context));
	const runTestsDisposable = vsc.commands.registerCommand('atlas-integration.test', runTests);
	
	context.subscriptions.push(updatePackageFiltersDisposable, updateCopyrightDisposable, compileDisposable, runTestsDisposable);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}