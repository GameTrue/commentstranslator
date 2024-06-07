import * as vscode from 'vscode';
import { translate } from '@vitalets/google-translate-api';
import { HttpsProxyAgent } from 'https-proxy-agent';

export function activate(context: vscode.ExtensionContext) {
    // Command to display comments in the current file
    let showCommentsDisposable = vscode.commands.registerCommand('extension.showComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            // Show message if no file is open
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
        // Find all matches of the regex in the text
        while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            // Store the matched comment and its range
            comments.push({ text: match[0], range: range });
        }

        // Show comments in a quick pick menu
        if (comments.length > 0) {
            vscode.window.showQuickPick(
                comments.map(comment => comment.text), 
                { placeHolder: 'Comments in this file' }
            ).then(selected => {
                if (selected) {
                    const comment = comments.find(comment => comment.text === selected);
                    if (comment) {
                        // Select and reveal the chosen comment in the editor
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

    // Command to translate comments in the current file to English
    let translateCommentsDisposable = vscode.commands.registerCommand('extension.translateComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            // Show message if no file is open
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
        // Find all matches of the regex in the text
        while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            comments.push({ text: match[0], range: range });
        }

        // Translate comments
        if (comments.length > 0) {
            const translatedComments = await Promise.all(comments.map(async comment => {
                try {
					const agent = new HttpsProxyAgent('http://198.12.85.213:80');
                    // Translate the comment text to English
                    const res = await translate(comment.text, { to: 'en', fetchOptions: { agent } });
                    // Log original and translated text to the console for debugging
					console.log(`Original: ${comment.text} -> Translated: ${res.text}`);
                    return { ...comment, text: res.text };
                } catch (err) {
                    // Log any translation errors to the console
                    console.error('Translation error:', err);
                    return comment;
                }
            }));

            // Replace original comments with translated ones
            editor.edit(editBuilder => {
                translatedComments.forEach((comment, index) => {
                    editBuilder.replace(comments[index].range, comment.text);
                });
            }).then(success => {
                if (success) {
                    // Show message if comments were translated successfully
                    vscode.window.showInformationMessage('Comments translated successfully.');
                } else {
                    // Show error message if comments could not be translated
                    vscode.window.showErrorMessage('Failed to translate comments.');
                }
            });
        } else {
            // Show message if no comments are found
            vscode.window.showInformationMessage('No comments found in this file.');
        }
    });

    context.subscriptions.push(translateCommentsDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
