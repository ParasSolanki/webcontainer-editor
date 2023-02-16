import type { editor } from "monaco-editor/esm/vs/editor/editor.api";

export type EditorType = editor.IStandaloneCodeEditor | null;

export type Languages =
  | "javascript"
  | "typescript"
  | "css"
  | "html"
  | "json"
  | "scss"
  | "less";
