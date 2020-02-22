// 状态枚举
const promiseStatus = {
  // 初始状态
  pending: 'pending',
  // 操作成功
  resolved: 'resolved',
  // 操作失败
  rejected: 'rejected'
}

function Promise(executor) {
  // promise状态
  this.status = promiseStatus.pending

  this.resolveHandlers = []
  this.rejectHandlers = []
  this.promiseValue = null
  this.promiseReason = null

  /**
   *
   * @param value {支持Promise类型、thenable、普通值}
   */
  const resolve = value => {
    if (value instanceof Promise) {
      value.then(resolve, reject)
      return
    } else if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      // thenable
      try {
        const then = value.then
        if (typeof then === 'function') {
          then(resolve, reject)
          return
        }
      } catch (e) {
        reject(e)
      }
    }

    // 检查状态，只能被变更一次
    if (this.status === promiseStatus.pending) {
      // 更新状态 成功
      this.status = promiseStatus.resolved
      this.promiseValue = value
      // 遍历执行handlers
      for (let i = 0; i < this.resolveHandlers.length; i++) {
        this.resolveHandlers[i](value)
      }
      // 清空
      this.resolveHandlers = []
    } else {
      // warning
    }
  }

  const reject = reason => {
    // 检查状态，只能被变更一次
    if (this.status === promiseStatus.pending) {
      // 更新状态
      this.status = promiseStatus.rejected
      this.promiseReason = reason
      // 遍历执行handlers
      for (let i = 0; i < this.rejectHandlers.length; i++) {
        this.rejectHandlers[i](reason)
      }
      // 清空
      this.rejectHandlers = []
    } else {
      // warning
    }
  }

  try {
    executor(resolve, reject)
  } catch (e) {
    reject(e)
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  // 循环引用
  if (x === promise2) {
    reject(new TypeError('请勿循环引用，见https://promisesaplus.com/ 2.3.1守则'))
  }

  if (x instanceof Promise) {
    x.then(resolve, reject)
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then
    // 是否已调用（https://promisesaplus.com 见2.3.3.3.3跟2.3.3.3.4）
    let called = false
    try {
      then = x.then
    } catch (e) {
      reject(e)
    }
    if (typeof then === 'function') {
      try {
        then.call(x, function (y) {
          if (called) {
            return
          }
          called = true
          resolvePromise(promise2, y, resolve, reject)
        }, function (r) {
          if (called) {
            return
          }
          called = true
          reject(r)
        })
      } catch (e) {
        if (called) {
          return
        }
        reject(e)
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x)
  }
}

// 参数空判断
Promise.prototype.then = function (onResolved, onRejected) {
  if (typeof onResolved !== 'function') {
    onResolved = value => value
  }

  if (typeof onRejected !== 'function') {
    onRejected = reason => {
      throw reason
    }
  }

  if (this.status === promiseStatus.pending) {
    const that = this
    const newPromise = new Promise(function (resolve, reject) {
      const resolveCallback = function (value) {
        /**
         * 为了使得onResolved是异步执行的
         *
         //————————示例代码 start————————
         const defer = {}
         const p = new Promise((resolve, reject) => {
          defer.resolve = resolve
          defer.reject = reject
        })
         p.then(function onFulfilled(value) {
          console.log(value)
        });
         defer.resolve(1)
         console.log(2)
         //————————示例代码 end————————

         如果没有底下的setTimeout，那么输出结果一次是 "1" "2"
         但实际上我们要求onFulfilled是异步执行的，合理的输出结果应该是"2" "1"
         */
        setTimeout(() => {
          try {
            const x = onResolved(value)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      const rejectCallback = function (reason) {
        setTimeout(() => {
          try {
            const x = onRejected(reason)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      that.resolveHandlers.push(resolveCallback)
      that.rejectHandlers.push(rejectCallback)
    })
    return newPromise
  } else if (this.status === promiseStatus.resolved) {
    const newPromise = new Promise((resolve, reject) => {
      // onResolved异步执行
      setTimeout(() => {
        try {
          const x = onResolved(this.promiseValue)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
    return newPromise
  } else if (this.status === promiseStatus.rejected) {
    const newPromise = new Promise((resolve, reject) => {
      // onRejected异步执行
      setTimeout(() => {
        try {
          const x = onRejected(this.promiseReason)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
    return newPromise
  }
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

/**
 *
 * @param onFinally 该函数有可能返回一个thenable或promise
 * @return {Promise<any>}
 */
Promise.prototype.finally = function (onFinally) {
  const P = this.constructor
  return this.then(
    value => P.resolve(onFinally()).then(() => value),
    reason => P.resolve(onFinally()).then(() => {
      throw reason
    })
  )
}

Promise.resolve = function (value) {
  if (value instanceof Promise) {
    // 根据规定，如果传入value是promise的实例，直接返回该实例即可，见 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve 顶部
    return value
  } else if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    // thenable
    // 统一在上面处理了
    return new Promise(function (resolve) {
      resolve(value)
    })
  } else {
    return new Promise(function (resolve) {
      resolve(value)
    })
  }
}

Promise.reject = function (reason) {
  return new Promise(function (resolve, reject) {
    reject(reason)
  })
}

/**
 * 全部成功才返回resolve，要是有任意一个失败，则返回reject
 * @param args
 * @return {Promise}
 */
Promise.all = function (args) {
  // 转换成数组
  const list = Array.prototype.slice.call(args)

  // 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状
  if (!(list && list.length)) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    // 回调计数值
    let count = 0
    // 按序放置所对应的data或reason
    const dataList = []

    const resolveWrapper = function (index, data) {
      dataList[count++] = data

      // 总数检测
      if (count === list.length) {
        resolve(dataList)
      }
    }

    list.forEach((value, index) => {
      Promise.resolve(value).then(resolveWrapper.bind(null, index)).catch(reject)
    })
  })
}

/**
 * 一旦迭代器中的某个promise解决或拒绝，返回的 promise就会解决或拒绝。
 *
 * 注意：如果传的迭代是空的，则返回的 promise 将永远等待。
 * @param list
 * @return {Promise}
 */
Promise.race = function (list) {
  return new Promise((resolve, reject) => {
    list.forEach(value => {
      Promise.resolve(value).then(resolve).catch(reject)
    })
  })
}

/**
 * 全都有结果之后才返回（无论是resolve还是reject）
 * 返回数组item结构如下所示：{ status: "rejected/"fulfilled"", value: 'xxx', reason: "yyy" }
 * @param list
 */
Promise.allSettled = function (list) {
  // todo
}

Promise.any = function () {
  // todo
}

Promise.try = function () {
  // todo
}


// 测试代码 start
/**
 * Promise/A+规范测试，见https://github.com/promises-aplus/promises-tests
 * npm i -g promises-aplus-tests
 * promises-aplus-tests xxx.js
 */
Promise.deferred = function () { // 延迟对象
  const defer = {}
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}

try {
  module.exports = Promise
} catch (e) {

}
