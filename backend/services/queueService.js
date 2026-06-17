const queue = [];
let processing = false;

function enqueueJob(job) {
  queue.push({
    ...job,
    createdAt: new Date()
  });

  processQueue().catch((error) => {
    console.error("Queue processing failed:", error.message);
  });
}

async function processQueue() {
  if (processing) return;

  processing = true;

  try {
    while (queue.length > 0) {
      const job = queue.shift();

      if (job.type === "sync" && typeof job.handler === "function") {
        await job.handler();
      }
    }
  } finally {
    processing = false;
  }
}

function getQueueSize() {
  return queue.length;
}

module.exports = {
  enqueueJob,
  processQueue,
  getQueueSize
};
