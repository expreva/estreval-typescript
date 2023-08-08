import * as tstree from '@expreva/tstree'
import { generate } from 'astring'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction

const workerScript = `

const {
  addEventListener,
  postMessage,
  Date, Promise, setTimeout, clearTimeout, Error
} = self

// Main

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
const context = {}

onmessage = function onmessage(e) {
  const { id, request } = e.data
  const fn = new AsyncFunction(\`with(this){\${request}}\`).bind(context)
  fn(context)
    .then(response => postMessage({ id, response }))
    .catch(error => postMessage({ id, error }))
}

// Remove everything in global scope except for allowed list

let current = self
const keepProperties = [
  'Object', 'Function', 'Infinity', 'NaN', 'undefined',
  'Array', 'Boolean', 'Number', 'String', 'Symbol',
  'Map', 'Math', 'Set',
  'Date', 'Promise'
]

do {
  Object.getOwnPropertyNames(current).forEach(function (name) {
    if (keepProperties.indexOf(name) === -1) {
      delete current[name]
    }
  })
  current = Object.getPrototypeOf(current)
} while (current !== Object.prototype)
`

let vm

function createVM(options = {}) {

  // Create virtual machine

  const {
    timeout = 2000
  } = options

  const blob = new Blob([ workerScript ], { type: 'application/javascript' })
  const listeners = {}

  let worker

  function createWorker() {

    worker = new Worker(URL.createObjectURL(blob))

    worker.onmessage = function(e) {

      const { id, response, error } = e.data

      if (listeners[id]) {
        clearTimeout(listeners[id].timer)
        listeners[id].callback(response)
        delete listeners[id]
      }
    }
  }

  function terminateWorker() {
    worker.terminate()
    worker = null
  }

  function sendRequest(request) {

    if (!worker) createWorker()

    return new Promise((resolve, reject) => {

      const id = `${Date.now()}${Math.random()}`
      const timer = setTimeout(function() {

        terminateWorker()
        delete listeners[id]

        reject({
          message: 'Timed out'
        })

      }, timeout)

      listeners[id] = {
        timer,
        callback: resolve
      }

      worker.postMessage({
        id,
        request
      })
    })
  }

  return {
    run: sendRequest,
  }
}

async function tsrun(source) {

  // console.log('tstree', tstree)

  // Parse

  const ast = tstree.parse(source)

  console.log('ast', ast)

  const compiled = generate(ast)

  console.log('compiled', compiled)

  // Evaluate

  if (!vm) {
    vm = createVM()
  }

  return await vm.run(compiled)
}

;(async () => {

  console.log('result', await tsrun(`

  const message: string = 'hi'

  return message
  `))

})().catch(console.error)
