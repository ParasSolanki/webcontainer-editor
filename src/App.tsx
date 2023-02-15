import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import Convert from "ansi-to-html";

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

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webContainerInstanceRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    if (!iframeRef.current.contentDocument) return;

    // install process output show this in terminal
    // iframeRef.current.contentDocument.body.innerHTML = output;
  }, [output]);

  useEffect(() => {
    if (!iframeRef.current) return;

    if (!iframeRef.current.contentDocument) return;

    iframeRef.current.contentDocument.body.innerText = "Loading...";
  }, [isLoading]);

  useEffect(() => {
    async function handleContainerLoad() {
      if (webContainerInstanceRef.current !== null) return;

      setIsLoading(true);

      if (editorRef.current) {
        editorRef.current.innerText = files["index.js"].file.contents;
      }

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
        setIsLoading(false);
      });
    }

    window.addEventListener("load", handleContainerLoad);

    return () => {
      window.removeEventListener("load", handleContainerLoad);
    };
  }, []);

  return (
    <div className="flex h-screen w-full space-x-4 p-2">
      <div className="w-6/12">
        <textarea
          name="editor"
          id="editor"
          ref={editorRef}
          cols={30}
          rows={10}
          className="h-full w-full rounded border-2 border-slate-200 bg-black p-2 text-white"
        ></textarea>
      </div>
      <div className="w-6/12">
        <iframe
          ref={iframeRef}
          className="h-full w-full rounded border-2 border-slate-400"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
