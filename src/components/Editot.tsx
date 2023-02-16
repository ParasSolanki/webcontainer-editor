import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import type { EditorType, Languages } from "../types/editor";

type EditorProps = {
  defaultTheme?: string;
  defaultLanguage: Languages;
  onMount: (editor: EditorType) => void;
};

const Editor: React.FC<EditorProps> = ({
  onMount,
  defaultLanguage,
  defaultTheme = "vs-dark",
}) => {
  const [editor, setEditor] = useState<EditorType>(null);
  const monacoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor !== null) {
      onMount(editor);
    }
  }, [editor]);

  useEffect(() => {
    if (monacoRef.current) {
      setEditor((editor) => {
        if (editor) return editor;

        return monaco.editor.create(monacoRef.current!, {
          value: "",
          language: defaultLanguage,
          theme: defaultTheme,
          minimap: { enabled: false },
          automaticLayout: true,
        });
      });
    }

    return () => {
      editor?.dispose();
    };
  }, [monacoRef.current]);

  return <div className="h-full w-full" ref={monacoRef}></div>;
};

export default Editor;
