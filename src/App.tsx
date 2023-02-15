function App() {
  return (
    <div className="flex h-screen w-full space-x-4 p-2">
      <div className="w-6/12">
        <textarea
          name="editor"
          id="editor"
          cols={30}
          rows={10}
          className="h-full w-full rounded border-2 border-slate-200 bg-black p-2 text-white"
        ></textarea>
      </div>
      <div className="w-6/12">
        <iframe
          src=""
          className="h-full w-full rounded border-2 border-slate-400"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
