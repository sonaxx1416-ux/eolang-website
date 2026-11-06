// Runs the eo interpreter (compiled from Go to WebAssembly) off the page's main thread,
// so a program that never ends can be stopped by terminating this worker.
importScripts('wasm_exec.js');
const go = new Go();
async function load() {
  try {
    const r = await WebAssembly.instantiateStreaming(fetch('eo.wasm'), go.importObject);
    return r.instance;
  } catch (e) {
    const buf = await (await fetch('eo.wasm')).arrayBuffer();
    return (await WebAssembly.instantiate(buf, go.importObject)).instance;
  }
}
const ready = load().then(inst => { go.run(inst); });
ready.catch(err => postMessage({ type: 'fail', error: String(err) }));
onmessage = async (e) => {
  await ready;
  self.eoRun(e.data.src, e.data.stdin || '', e.data.id);
};
