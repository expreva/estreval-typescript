var estrevalTypeScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    run: () => run,
    terminateWorker: () => terminateWorker
  });
  var listeners = {};
  var worker;
  function createWorker() {
    worker = new Worker("estreval-typescript-worker.js");
    worker.onmessage = function(e) {
      const { id, response, error, ast } = e.data;
      if (listeners[id]) {
        clearTimeout(listeners[id].timer);
        listeners[id].callback({ response, error, ast });
        delete listeners[id];
      }
    };
  }
  function terminateWorker() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  }
  function run(code, options = {}) {
    const { timeout = 2e3 } = options;
    if (!worker)
      createWorker();
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}${Math.random()}`;
      const timer = setTimeout(function() {
        terminateWorker();
        delete listeners[id];
        reject(new Error("Timed out"));
      }, timeout);
      listeners[id] = {
        timer,
        callback: resolve
      };
      worker.postMessage({
        id,
        request: {
          code
        }
      });
    });
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=estreval-typescript.js.map
