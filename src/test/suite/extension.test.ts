import * as assert from 'assert';
import { afterEach, before, after } from 'mocha';
import * as path from 'path';
import * as fs from 'fs';


// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vsc from 'vscode';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const cleanPackageFilters = async (rootPath: string) => {
    const packageFiltersPath = path.join(rootPath, '..', 'package_filters.txt');
    await fs.writeFile(packageFiltersPath, '\n- .*', (err) => {
		if (err) { throw err; }
	});
};

suite('Extension Test Suite', () => {
	const rootPath = (vsc.workspace.workspaceFolders as vsc.WorkspaceFolder[])[0].uri.fsPath;

	before(async () => {
		await vsc.extensions.getExtension('ms-python.python')?.activate();
	});

	after(async () => {
		const config = vsc.workspace.getConfiguration('python');
		config.update('envFile', '${workspaceFolder}/../build/env.txt');
	});

	afterEach(async () => {
		await vsc.commands.executeCommand('workbench.action.closeAllEditors');
	});

    test('should have ATLAS Terminal', () => {
		const atlasTerminal = vsc.window.terminals.find((terminal) => terminal.name === 'ATLAS');

		assert.notStrictEqual(atlasTerminal, undefined);
		assert.strictEqual(vsc.window.activeTerminal, atlasTerminal);
	});

    test('should set "python.envFile" to "env.txt" file', async () => {
		const pythonPathLocation = vsc.workspace.getConfiguration('python').get('envFile') as string;
		assert.strictEqual(pythonPathLocation, '${workspaceFolder}/../build/env.txt');
    });

	test('should update copyright', async () => {
        const filePath = `${rootPath}/athenaFile.py`;
		const document = await vsc.workspace.openTextDocument(filePath);
        await vsc.window.showTextDocument(document);

		await vsc.commands.executeCommand('atlas-integration.updateCopyright');

		const copyrightInfo = /Copyright \(C\) [0-9]{4}-[0-9]{4} CERN for the benefit of the ATLAS collaboration/g.exec(document.getText());
		if (copyrightInfo) {
			const copyrightYear = copyrightInfo[0].substring(19, 23);
			const currentYear = new Date().getFullYear().toString();

			assert(document.isDirty);
			assert.strictEqual(copyrightYear, currentYear);
		}
    });

    test('should update "package_filters.txt" file', async () => {
        const athenaFilePath = `${rootPath}/package/athenaPackageFile.py`;
        const athenaDocument = await vsc.workspace.openTextDocument(athenaFilePath);
        await vsc.window.showTextDocument(athenaDocument);
        await vsc.commands.executeCommand('atlas-integration.addCurrentPackageToTheBuild');
        await delay(1500);

        const packageFiltersPath = path.join(rootPath, '..', 'package_filters.txt');
        const packageFiltersDocument = await vsc.workspace.openTextDocument(packageFiltersPath);

        const packageFiltersText: string = packageFiltersDocument.getText();
        assert.match(packageFiltersText, /\+ package\n- \.\*/);

        cleanPackageFilters(rootPath);
    });

    test('should send compilation command to ATLAS Terminal', async () => {
        await vsc.commands.executeCommand('atlas-integration.compile');
        await delay(1500);

		const atlasTerminal = vsc.window.terminals.find((terminal) => terminal.name === 'ATLAS');
		assert(atlasTerminal?.state.isInteractedWith);
    });

    test('should send test command to ATLAS Terminal', async () => {
		const prevAtlasTerminal = vsc.window.terminals.find((terminal) => terminal.name === 'ATLAS');
		prevAtlasTerminal?.dispose();
        await delay(900);

		const newAtlasTerminal = vsc.window.createTerminal('ATLAS');

        await vsc.commands.executeCommand('atlas-integration.test');
        await delay(900);

		assert(newAtlasTerminal?.state.isInteractedWith);
    });
});
