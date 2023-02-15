import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { useEffect, useRef } from "react";

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

function App() {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function handleContainerLoad() {
      if (editorRef.current) {
        editorRef.current.innerText = files["index.js"].file.contents;
      }

      const instance = await WebContainer.boot();
      await instance.mount(files);

      const packageJSON = await instance.fs.readFile("package.json", "utf-8");
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
