import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	// Bold
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.toggleBold', () => {
		toggleFormatting("**")
	}))

	// Italic
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.toggleItalic', () => {
		toggleFormatting("*")
	}))

	// Strikthrough
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.toggleStrikethrough', () => {
		toggleFormatting("~~")
	}))

	// Code Block
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.toggleCodeBlock', () => {
		toggleFormatting("`")
	}))

	// Block Quote
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.toggleBlockQuote', () => {
		toggleBlockQuote()
	}))

	// Insert link
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.insertLink', () => {
		insertSnippet("[${1:title}](${2:link})$0")
	}))

	// Insert image
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.insertImage', () => {
		insertSnippet("![${1:alttext}](${2:imageLink})$0")
	}))

	// Increase header level (h2->h1)
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.headerIncreaseLevel', () => {
		changeHeaderSize(true)
	}))

	// Decrease header level (h1->h2)
	context.subscriptions.push(vscode.commands.registerCommand('markdowntoolbar.headerDecreaseLevel', () => {
		changeHeaderSize(false)
	}))
}

// Toggles formatting for the current selection or current word
function toggleFormatting(chars: string) {
	const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
	const charCount: number = chars.length

	if (editor && editor.selection) {
		// Get current selection or current word
		if (editor.selection.start.isEqual(editor.selection.end)) {
			var range: vscode.Range = editor.document.getWordRangeAtPosition(editor.selection.start)!

			if (!range) {
				return
			}

			var start: vscode.Position = range?.start!
			var end: vscode.Position = range?.end!
		} else {
			var start: vscode.Position = editor.selection.start
			var end: vscode.Position = editor.selection.end
		}

		// Check for chars before and after (in and outside word)
		var outsideBeforeRange = new vscode.Range(start.translate(0, -Math.min(start.character, charCount)), start) // Prevent going outside line
		var insideBeforeRange = new vscode.Range(start, start.translate(0, charCount))
		var insideAfterRange = new vscode.Range(end.translate(0, -charCount), end)
		var outsideAfterRange = new vscode.Range(end, end.translate(0, charCount))

		// Check for chars before word
		var [charsBefore, beforeRange]: [boolean, vscode.Range | null] = checkForChars(editor, chars, outsideBeforeRange, insideBeforeRange)

		// Check for chars after word
		var [charsAfter, afterRange]: [boolean, vscode.Range | null] = checkForChars(editor, chars, outsideAfterRange, insideAfterRange)

		editor.edit((editBuilder: vscode.TextEditorEdit) => {
			// Disable formatting
			if (charsBefore) {
				editBuilder.delete(beforeRange!)
			}

			if (charsAfter) {
				editBuilder.delete(afterRange!)
			}

			// Enable formatting
			if (!charsBefore && !charsAfter) {
				editBuilder.insert(start, chars)
				editBuilder.insert(end, chars)
			}
		})
	}
}

function checkForChars(editor: vscode.TextEditor, chars: String, outsideRange: vscode.Range, insideRange: vscode.Range): [boolean, vscode.Range | null] {
	var charsFound: boolean = true
	var range: vscode.Range | null = null
	if (editor.document.getText(outsideRange) == chars) {
		range = outsideRange
	} else if (editor.document.getText(insideRange) == chars) {
		range = insideRange
	} else {
		var charsFound = false
	}

	return [charsFound, range]
}

function toggleBlockQuote() {
	const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor && editor.selection) {
		// Get current line from current selection or current word
		var line: number = editor.selection.start.line
		var lineRange: vscode.Range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 3))
		var lineString: string = editor.document.getText(lineRange)
		var startChar: string = lineString.trim().charAt(0)

		editor.edit((editBuilder: vscode.TextEditorEdit) => {
			if (startChar == ">") {
				// Remove char
				var charPos: number = lineString.indexOf(">")
				var deletionRange = new vscode.Range(new vscode.Position(line, charPos), new vscode.Position(line, charPos + 1))
				editBuilder.delete(deletionRange)
			} else {
				// Add char
				editBuilder.insert(lineRange.start, ">")
			}
		})
	}
}

function insertSnippet(snippet: string) {
	const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor) {
		editor.insertSnippet(new vscode.SnippetString(snippet))
	}
}

function changeHeaderSize(decrease: Boolean) {
	const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

	if (editor && editor.selection) {
		// Get current line from current selection or current word
		var line: number = editor.selection.start.line
		var lineRange: vscode.Range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 6))
		var lineString: string = editor.document.getText(lineRange)

		editor.edit((editBuilder: vscode.TextEditorEdit) => {
			if (decrease) {
				if (lineString.trim().startsWith("#")) {
					var charPos: number = lineString.indexOf("#")

					// Only remove chars that affect header
					if (charPos <= 3) {
						// Remove char
						var deletionRange = new vscode.Range(new vscode.Position(line, charPos), new vscode.Position(line, charPos + 1))
						editBuilder.delete(deletionRange)
					}
				}
			} else {
				// h6 is the smallest header
				if (!lineString.trim().startsWith("######")) {
					// Add char
					editBuilder.insert(lineRange.start, "#")
				}
			}
		})
	}
}
