// jobQueue.js
let running = false
const queue = []

async function runNext() {
  if (running || queue.length === 0) return

  running = true
  const { fn, ctx } = queue.shift()

  try {
    await fn()
  } catch (err) {
    console.error('Job error:', err)
    // Try replying the error to Telegram
    if (ctx && typeof ctx.reply === 'function') {
      try {
        await ctx.reply(`❌ Job failed: ${err.message}`)
      } catch (e) {
        console.error('Failed to send error message to Telegram:', e.message)
      }
    }
  } finally {
    running = false
    runNext() // continue with next queued job
  }
}

/**
 * Add a job to run in background, one after another.
 * Does not block Telegram webhook response.
 * @param {Object} ctx - Telegram context for replying on error
 * @param {Function} fn - async function to execute
 */
function addJob(ctx, fn) {
  queue.push({ fn, ctx })
  setImmediate(runNext) // start soon, non-blocking
}

module.exports = addJob