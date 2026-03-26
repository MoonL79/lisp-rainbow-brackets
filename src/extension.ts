import * as vscode from "vscode";

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

type TokenKind = "open" | "close";

interface BracketToken {
  kind: TokenKind;
  depth: number;
  start: number;
  length: number;
}

class RainbowBracketController implements vscode.Disposable {
  private decorationTypes: vscode.TextEditorDecorationType[] = [];
  private refreshTimer: NodeJS.Timeout | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.reloadDecorations();

    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => this.refreshVisibleEditors()),
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (vscode.window.visibleTextEditors.some((editor) => editor.document === event.document)) {
          this.queueRefresh();
        }
      }),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_SECTION)) {
          this.reloadDecorations();
          this.refreshVisibleEditors();
        }
      }),
    );

    this.refreshVisibleEditors();
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    for (const decorationType of this.decorationTypes) {
      decorationType.dispose();
    }
  }

  private queueRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => this.refreshVisibleEditors(), 40);
  }

  private reloadDecorations(): void {
    for (const decorationType of this.decorationTypes) {
      decorationType.dispose();
    }

    const colors = this.getColors();
    this.decorationTypes = colors.map((color) =>
      vscode.window.createTextEditorDecorationType({
        color,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      }),
    );
  }

  private refreshVisibleEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      this.updateEditor(editor);
    }
  }

  private updateEditor(editor: vscode.TextEditor): void {
    if (!this.isSupportedLanguage(editor.document.languageId)) {
      this.clearEditor(editor);
      return;
    }

    const text = editor.document.getText();
    const buckets = this.decorationTypes.map(() => [] as vscode.Range[]);

    for (const token of scanBracketTokens(text)) {
      if (buckets.length === 0) {
        break;
      }

      const bucketIndex = token.depth % buckets.length;
      const start = editor.document.positionAt(token.start);
      const end = editor.document.positionAt(token.start + token.length);
      buckets[bucketIndex].push(new vscode.Range(start, end));
    }

    this.decorationTypes.forEach((decorationType, index) => {
      editor.setDecorations(decorationType, buckets[index]);
    });
  }

  private clearEditor(editor: vscode.TextEditor): void {
    for (const decorationType of this.decorationTypes) {
      editor.setDecorations(decorationType, []);
    }
  }

  private getColors(): string[] {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const configured = config.get<string[]>("colors", []);
    const colors = configured.filter((value) => typeof value === "string" && value.trim().length > 0);
    return colors.length > 0 ? colors : DEFAULT_COLORS;
  }

  private isSupportedLanguage(languageId: string): boolean {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const languages = config.get<string[]>("languages", []);
    return languages.includes(languageId);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(new RainbowBracketController(context));
}

export function deactivate(): void {}

function scanBracketTokens(text: string): BracketToken[] {
  const tokens: BracketToken[] = [];
  const stack: number[] = [];

  let index = 0;
  let blockCommentDepth = 0;
  let inString = false;
  let inLineComment = false;
  let inCharLiteral = false;

  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1] ?? "";

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

    if (text.startsWith("#vu8(", index)) {
      const depth = stack.length;
      stack.push(depth);
      tokens.push({ kind: "open", depth, start: index, length: 5 });
      index += 5;
      continue;
    }

    if (text.startsWith("#(", index)) {
      const depth = stack.length;
      stack.push(depth);
      tokens.push({ kind: "open", depth, start: index, length: 2 });
      index += 2;
      continue;
    }

    if (text.startsWith("#)", index)) {
      const depth = stack.length > 0 ? stack.pop()! : 0;
      tokens.push({ kind: "close", depth, start: index, length: 2 });
      index += 2;
      continue;
    }

    if (char === "(") {
      const depth = stack.length;
      stack.push(depth);
      tokens.push({ kind: "open", depth, start: index, length: 1 });
      index += 1;
      continue;
    }

    if (char === ")") {
      const depth = stack.length > 0 ? stack.pop()! : 0;
      tokens.push({ kind: "close", depth, start: index, length: 1 });
      index += 1;
      continue;
    }

    index += 1;
  }

  return tokens;
}

function isDelimiter(char: string): boolean {
  return char.length === 0 || /\s|[()[\]{}"';]/.test(char);
}
