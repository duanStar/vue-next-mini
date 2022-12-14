let isFlushPending = false

const resolvedPromise = Promise.resolve() as Promise<any>

let currentFlushPromise: Promise<any> | null = null

const pendingFlushCbs: Function[] = []

export function queuePreFlushCb(cb: Function) {
  queueCb(cb)
}

export function queueCb(cb: Function) {
  pendingFlushCbs.push(cb)
  queueFlush()
}

export function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

export function flushJobs() {
  isFlushPending = false
  flushPreFlushCbs()
}

export function flushPreFlushCbs() {
  if (pendingFlushCbs.length) {
    const activeFlushCbs = [...new Set(pendingFlushCbs)]
    pendingFlushCbs.length = 0
    activeFlushCbs.forEach(cb => cb())
  }
}
