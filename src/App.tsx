import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import Convert from "ansi-to-html";
import Editor from "./components/Editot";
import type { EditorType } from "./types/editor";

const files = {
  "index.js": {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
  res.send('Welcome to a WebContainers app! 🥳');
});

app.listen(port, () => {
  console.log(\`App is live at http://localhost:\${port}\`);
});`,
    },
  },
  "package.json": {
    file: {
      contents: `
{
  "name": "example-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon index.js"
  }
}`,
    },
  },
} satisfies FileSystemTree;

const convert = new Convert();

export const LanguagesFromExtention = {
  html: "html",
  css: "css",
  json: "json",
  scss: "scss",
  less: "less",
  js: "javascript",
  ts: "typescript",
} as const;

const detectLanguage = (filename: string) => {
  const ext = filename.split(".").pop() as keyof typeof LanguagesFromExtention;

  return ext ? LanguagesFromExtention[ext] : "";
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [output, setOutput] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<EditorType>(null);
  const webContainerInstanceRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    if (!iframeRef.current.contentDocument) return;

    iframeRef.current.contentDocument.body.innerText = "Loading...";
  }, [isLoading]);

  useEffect(() => {
    async function handleContainerLoad() {
      if (webContainerInstanceRef.current !== null) return;

      setIsLoading(true);

      webContainerInstanceRef.current = await WebContainer.boot();
      await webContainerInstanceRef.current.mount(files);
      // Install dependencies
      const installProcess = await webContainerInstanceRef.current.spawn(
        "npm",
        ["install"]
      );

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            setOutput(convert.toHtml(data));
          },
        })
      );
      // Wait for install command to exit
      const exitCode = await installProcess.exit;

      if (exitCode !== 0) {
        throw new Error("Installation failed");
      }

      await webContainerInstanceRef.current.spawn("npm", ["run", "start"]);

      // Wait for `server-ready` event
      webContainerInstanceRef.current.on("server-ready", (port, url) => {
        if (iframeRef.current) iframeRef.current.src = url;
        setUrl(url);
        setIsLoading(false);
      });
    }

    window.addEventListener("load", handleContainerLoad);

    return () => {
      window.removeEventListener("load", handleContainerLoad);
    };
  }, []);

  function handleEditorOnMount(editor: EditorType) {
    editorRef.current = editor;
    const filename = "index.js";
    const language = detectLanguage(filename);
    editorRef.current?.setValue(files[filename].file.contents);

    editorRef.current?.onDidChangeModelContent(async () => {
      const value = editorRef.current?.getValue();

      if (!value) return;

      setIsLoading(true);

      await webContainerInstanceRef.current?.fs.writeFile("/index.js", value);

      setIsLoading(false);
    });
  }

  return (
    <div className="flex h-screen w-full space-x-4 p-2">
      <div className="w-6/12">
        <Editor onMount={handleEditorOnMount} defaultLanguage="javascript" />
      </div>
      <div className="relative w-6/12">
        <div className="absolute inset-x-0 top-0 flex h-10 items-center space-x-4 rounded bg-black p-2 px-3">
          <button
            type="button"
            className="rounded-full p-1.5 text-white hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19.91 15.51h-4.53a1 1 0 0 0 0 2h2.4A8 8 0 0 1 4 12a1 1 0 0 0-2 0a10 10 0 0 0 16.88 7.23V21a1 1 0 0 0 2 0v-4.5a1 1 0 0 0-.97-.99ZM12 2a10 10 0 0 0-6.88 2.77V3a1 1 0 0 0-2 0v4.5a1 1 0 0 0 1 1h4.5a1 1 0 0 0 0-2h-2.4A8 8 0 0 1 20 12a1 1 0 0 0 2 0A10 10 0 0 0 12 2Z"
              ></path>
            </svg>
          </button>
          <div className="flex h-6 flex-grow items-center rounded bg-white p-1 shadow">
            <p className="text-sm text-black">{url}</p>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          className="h-full w-full rounded border-2 border-slate-400 pt-9"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
