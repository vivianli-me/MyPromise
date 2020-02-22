### 如何测试
详细见[promises-tests](https://github.com/promises-aplus/promises-tests)，共有872测试用例

### 参考资源
+ [Promise/A+规范原文](https://promisesaplus.com)
+ [Promise/A+规范译文](https://github.com/kaola-fed/blog/issues/99)
+ [阮一峰ES6—Promise](http://es6.ruanyifeng.com/#docs/promise)
+ [Promise迷你书](http://liubin.org/promises-book)
+ [MDN-Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
+ [promises-tests](https://github.com/promises-aplus)

### 讲解大纲
1. 介绍几个Promise的基本用法，让大家猜猜看打印结果（给大家一个初始印象，如果有回答错误的话，纠正下大家）

    ```javascript
    function example1() {
      // 常见用法
      new Promise(function(resolve, reject) {
        if (true){
          // 经过某些异步操作
          // 将状态从pending变成resolved
          resolve('success')
        } else {
          // 将状态从pending变成rejected
          reject(new Error('error'))
        }
      });
    }

    function example2() {
      new Promise(resolve => {
        setTimeout(() => resolve('a'), 3000)
      }).then(value => console.log(value))
      console.log('immediately')

      // 依次输出 "immediately" "a"
    }

    function example3() {
      const p = new Promise((resolve) => {
        setTimeout(() => {
          resolve(10)
        }, 3000)
      })

      p.then(function (value) {
        return value * 10
      })

      p.then(function (value) {
        return value + 2
      })

      p.then(function (value) {
        return value - 30
      })

      p.then(function (value) {
        console.log(value)
        return value
      })

      // 输出值为10
    }

    function example4() {
      const p = new Promise(resolve => {
        setTimeout(() => resolve(10), 3000)
      })

      const p2 = p.then(function (value) {
        return value * 10
      }).then(function (value) {
        return value + 2
      }).then(function (value) {
        return value - 30
      }).then(function (value) {
        console.log(value)
      })

      p2.then(value => console.log(value))

      // 依次输出 "72" "undefined"
    }
    ```
2. Promise/A+规范介绍，先重点看以下两点
    + 基础概念
        + Promise
        + thenable
        + value（any legal js value, include undefined、Promise、thenable）
        + exception
        + reason
    + 状态流转
3. 如何保证写出来是对的，如何保证覆盖完全（[promises-tests](https://github.com/promises-aplus/promises-tests)，800+测试用例）
4. 最开始为了简单，我们先做一个设定：**value不会是Promise、thenable之类的，只能是常见的js变量或简单对象**
    ```javascript
    new Promise(resolve => resolve('success')).then(function(value) {
      // 假定then函数的第一个参数函数执行后，都是返回普通值
      return 'new value'
    })
    ```
5. 从状态枚举的声明开始，并写构造函数（此时还不包含resolveHandlers跟rejectHandlers等逻辑）
6. 写then函数，先引导大家说说函数的输入与输出。并拆分成多个选择逻辑：pending、resolved、rejected（暂时先忽略异步、错误处理）
7. 先处理确定状态下的逻辑：resolved、rejected
8. 处理pending状态下的逻辑，并在构造函数中添加resolveHandlers跟rejectHandlers等逻辑
9. 在开始thenable之前先把一些细节逻辑完善了：变更为确定态之后就不可再更改了、onResolved或onRejected为空的默认值处理
10. onResolved或onRejected函数返回值为Promise情况下的逻辑处理
11. onResolved或onRejected函数返回值为thenable情况下的逻辑处理（事先举例讲讲thenable）
12. 错误处理、异步机制等
13. 其它