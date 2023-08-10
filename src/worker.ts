
self.global = {}

const { parse } = require('@expreva/tstree')
const evaluate = require('estreval/evaluate')

const context = {}

onmessage = function onmessage(e) {

  const { id, request } = e.data

  const { code } = request

  let ast

  function postResult(result) {
    postMessage({
      id,
      ast,
      ...result
    })
  }

  try {

    // Parse

    try {

      ast = parse(code, {
        jsx: true,
        range: true
      })

    } catch (error) {

      postResult({
        error: {
          message: error.message,
          location: error.location
        }
      })
      return
    }

    // Evaluate

    const response = evaluate(ast, context)

    postResult({ response })

  } catch (error) {
    postResult({ error })
  }
}
