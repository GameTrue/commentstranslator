import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.showComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to see comments.');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const fileExtension = document.languageId;
        const comments: string[] = [];
        let regex;

        // Select regex based on the file type
        if (fileExtension === 'python') {
            // Regex for Python comments: single-line and multi-line
            regex = /#.*|'''[\s\S]*?'''|"""[\s\S]*?"""/g;
        } else {
            // Regex for other file comments (assumes C-like comments)
            regex = /\/\/.*|\/\*[\s\S]*?\*\//g;
        }

        let match;
        while ((match = regex.exec(text)) !== null) {
            comments.push(match[0]);
        }

        if (comments.length > 0) {
            vscode.window.showQuickPick(comments, { placeHolder: 'Comments in this file' });
        } else {
            vscode.window.showInformationMessage('No comments found in this file.');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
