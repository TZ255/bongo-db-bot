// jobQueue.js
let running = false
const queue = []

async function runNext() {
  if (running || queue.length === 0) return

  running = true
  const { fn, ctx, q_msg_id } = queue.shift()

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
    await ctx.api.deleteMessage(ctx.chat.id, q_msg_id).catch(e => {})
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
function addJob(q_msg_id, ctx, fn) {
  queue.push({ fn, ctx, q_msg_id })
  setImmediate(runNext) // start soon, non-blocking
}

module.exports = addJob