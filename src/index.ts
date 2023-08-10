
// const blob = new Blob([ workerScript ], { type: 'application/javascript' })
const listeners = {}

let worker

function createWorker() {

  // worker = new Worker(URL.createObjectURL(blob))
  worker = new Worker('estreval-typescript-worker.js')

  worker.onmessage = function (e) {

    const { id, response, error, ast } = e.data

    if (listeners[id]) {
      clearTimeout(listeners[id].timer)
      listeners[id].callback({ response, error, ast })
      delete listeners[id]
    }
  }
}

export function terminateWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}

export function run(code, options = {}) {

  const { timeout = 2000 } = options
  if (!worker) createWorker()

  return new Promise((resolve, reject) => {

    const id = `${Date.now()}${Math.random()}`
    const timer = setTimeout(function () {
      terminateWorker()
      delete listeners[id]
      reject(new Error('Timed out'))
    }, timeout)

    listeners[id] = {
      timer,
      callback: resolve
    }

    worker.postMessage({
      id,
      request: {
        code
      }
    })
  })
}

