"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const CONFIG_SECTION = "lispRainbowBrackets";
const DEFAULT_COLORS = [
    "#ff6b6b",
    "#f59f00",
    "#51cf66",
    "#22b8cf",
    "#4c6ef5",
    "#845ef7",
    "#f06595",
    "#94d82d",
];
class RainbowBracketController {
    constructor(context) {
        this.context = context;
        this.decorationTypes = [];
        this.reloadDecorations();
        this.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => this.refreshVisibleEditors()), vscode.workspace.onDidChangeTextDocument((event) => {
            if (vscode.window.visibleTextEditors.some((editor) => editor.document === event.document)) {
                this.queueRefresh();
            }
        }), vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(CONFIG_SECTION)) {
                this.reloadDecorations();
                this.refreshVisibleEditors();
            }
        }));
        this.refreshVisibleEditors();
    }
    dispose() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.specialDecorationType?.dispose();
        for (const decorationType of this.decorationTypes) {
            decorationType.dispose();
        }
    }
    queueRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(() => this.refreshVisibleEditors(), 40);
    }
    reloadDecorations() {
        this.specialDecorationType?.dispose();
        for (const decorationType of this.decorationTypes) {
            decorationType.dispose();
        }
        const colors = this.getColors();
        this.decorationTypes = colors.map((color) => vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }));
        this.specialDecorationType = vscode.window.createTextEditorDecorationType({
            color: "#888888",
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }
    refreshVisibleEditors() {
        for (const editor of vscode.window.visibleTextEditors) {
            this.updateEditor(editor);
        }
    }
    updateEditor(editor) {
        if (!this.isSupportedLanguage(editor.document.languageId)) {
            this.clearEditor(editor);
            return;
        }
        const text = editor.document.getText();
        const buckets = this.decorationTypes.map(() => []);
        const specialRanges = [];
        const scanResult = scanBracketTokens(text);
        for (const token of scanResult.bracketTokens) {
            if (buckets.length === 0) {
                break;
            }
            const bucketIndex = token.depth % buckets.length;
            const start = editor.document.positionAt(token.start);
            const end = editor.document.positionAt(token.start + token.length);
            buckets[bucketIndex].push(new vscode.Range(start, end));
        }
        for (const token of scanResult.specialTokens) {
            const start = editor.document.positionAt(token.start);
            const end = editor.document.positionAt(token.start + token.length);
            specialRanges.push(new vscode.Range(start, end));
        }
        this.decorationTypes.forEach((decorationType, index) => {
            editor.setDecorations(decorationType, buckets[index]);
        });
        this.specialDecorationType && editor.setDecorations(this.specialDecorationType, specialRanges);
    }
    clearEditor(editor) {
        for (const decorationType of this.decorationTypes) {
            editor.setDecorations(decorationType, []);
        }
        this.specialDecorationType && editor.setDecorations(this.specialDecorationType, []);
    }
    getColors() {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const configured = config.get("colors", []);
        const colors = configured.filter((value) => typeof value === "string" && value.trim().length > 0);
        return colors.length > 0 ? colors : DEFAULT_COLORS;
    }
    isSupportedLanguage(languageId) {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const languages = config.get("languages", []);
        return languages.includes(languageId);
    }
}
function activate(context) {
    context.subscriptions.push(new RainbowBracketController(context));
}
function deactivate() { }
function scanBracketTokens(text) {
    const bracketTokens = [];
    const specialTokens = [];
    const stack = [];
    let index = 0;
    let blockCommentDepth = 0;
    let inString = false;
    let inLineComment = false;
    let inCharLiteral = false;
    while (index < text.length) {
        const char = text[index];
        const next = text[index + 1] ?? "";
        const afterNext = text[index + 2] ?? "";
        if (char === "\\" && next === "#") {
            const specialLength = afterNext.length > 0 && afterNext !== "\n" ? 3 : 2;
            specialTokens.push({ start: index, length: specialLength });
            index += specialLength;
            continue;
        }
        if (inLineComment) {
            if (char === "\n") {
                inLineComment = false;
            }
            index += 1;
            continue;
        }
        if (blockCommentDepth > 0) {
            if (char === "#" && next === "|") {
                blockCommentDepth += 1;
                index += 2;
                continue;
            }
            if (char === "|" && next === "#") {
                blockCommentDepth -= 1;
                index += 2;
                continue;
            }
            index += 1;
            continue;
        }
        if (inString) {
            if (char === "\\") {
                index += 2;
                continue;
            }
            if (char === "\"") {
                inString = false;
            }
            index += 1;
            continue;
        }
        if (inCharLiteral) {
            if (isDelimiter(char)) {
                inCharLiteral = false;
                continue;
            }
            index += 1;
            continue;
        }
        if (char === ";") {
            inLineComment = true;
            index += 1;
            continue;
        }
        if (char === "#" && next === "|") {
            blockCommentDepth = 1;
            index += 2;
            continue;
        }
        if (char === "\"") {
            inString = true;
            index += 1;
            continue;
        }
        if (char === "#" && next === "\\") {
            inCharLiteral = true;
            index += 2;
            continue;
        }
        const openTokenLength = matchOpenBracketToken(text, index);
        if (openTokenLength > 0) {
            const depth = stack.length;
            stack.push(depth);
            bracketTokens.push({ kind: "open", depth, start: index, length: openTokenLength });
            index += openTokenLength;
            continue;
        }
        const closeTokenLength = matchCloseBracketToken(text, index);
        if (closeTokenLength > 0) {
            const depth = stack.length > 0 ? stack.pop() : 0;
            bracketTokens.push({ kind: "close", depth, start: index, length: closeTokenLength });
            index += closeTokenLength;
            continue;
        }
        index += 1;
    }
    return { bracketTokens, specialTokens };
}
function isDelimiter(char) {
    return char.length === 0 || /\s|[()[\]{}"';]/.test(char);
}
function isEscapedAt(text, index) {
    let backslashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
        backslashCount += 1;
    }
    return backslashCount % 2 === 1;
}
function matchOpenBracketToken(text, index) {
    if (isEscapedAt(text, index)) {
        return 0;
    }
    if (text.startsWith("#vu8(", index)) {
        return 5;
    }
    if (text.startsWith("#(", index)) {
        return 2;
    }
    if (text[index] === "(") {
        return 1;
    }
    return 0;
}
function matchCloseBracketToken(text, index) {
    if (text.startsWith("#)", index)) {
        return 2;
    }
    if (text[index] === ")") {
        return 1;
    }
    return 0;
}
//# sourceMappingURL=extension.js.map