import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Команда для отображения комментариев
    let showCommentsDisposable = vscode.commands.registerCommand('extension.showComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to see comments.');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const fileExtension = document.languageId;
        const comments: {text: string, range: vscode.Range}[] = [];
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
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            comments.push({ text: match[0], range: range });
        }

        if (comments.length > 0) {
            vscode.window.showQuickPick(
                comments.map(comment => comment.text), 
                { placeHolder: 'Comments in this file' }
            ).then(selected => {
                if (selected) {
                    const comment = comments.find(comment => comment.text === selected);
                    if (comment) {
                        editor.selection = new vscode.Selection(comment.range.start, comment.range.end);
                        editor.revealRange(comment.range, vscode.TextEditorRevealType.Default);
                    }
                }
            });
        } else {
            vscode.window.showInformationMessage('No comments found in this file.');
        }
    });

    context.subscriptions.push(showCommentsDisposable);

    // Команда для перевода комментариев
    let translateCommentsDisposable = vscode.commands.registerCommand('extension.translateComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to translate comments.');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const fileExtension = document.languageId;
        const comments: {text: string, range: vscode.Range}[] = [];
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
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            comments.push({ text: match[0], range: range });
        }

        if (comments.length > 0) {
            // need to add API to translate
            const translations = comments.map(comment => ({
                original: comment.text,
                translated: `#Translated: ${comment.text}` // need to change on translated line
            }));

            editor.edit(editBuilder => {
                translations.forEach((translation, index) => {
                    editBuilder.replace(comments[index].range, translation.translated);
                });
            });
        } else {
            vscode.window.showInformationMessage('No comments found in this file.');
        }
    });

    context.subscriptions.push(translateCommentsDisposable);
}

export function deactivate() {}
