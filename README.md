# Lisp Rainbow Brackets

Lisp Rainbow Brackets 是一个为 **Scheme、Racket、Common Lisp 以及相关 Lisp 方言** 打造的 VSCode 彩虹括号扩展。

它专注于 Lisp 家族语言中最核心的阅读体验：**通过不同层级的颜色高亮括号嵌套结构，让复杂的 S-expression 更容易理解、导航与维护**。

无论你是在编写宏、调试深层嵌套表达式，还是阅读大型 Lisp 代码库，Lisp Rainbow Brackets 都能帮助你更快定位结构边界，降低视觉负担。

## Features

- **针对 Lisp 方言优化**：面向 Scheme、Racket、Common Lisp、通用 Lisp 语法场景设计。
- **按嵌套深度循环着色**：不同层级的括号使用不同颜色，结构层次一目了然。
- **支持常见 Lisp 括号形式**：不仅支持标准圆括号，还支持 `#()` 与 `#vu8()` 等前缀括号结构。
- **避免干扰非代码内容**：在字符串、行注释、块注释、字符字面量中不会错误地进行括号着色。
- **可自定义颜色与语言列表**：可按团队主题或个人偏好调整配色与适用语言。
- **轻量即时生效**：在编辑器切换、文本修改和配置变更时自动刷新装饰效果。

## Supported Languages

默认对以下语言 ID 生效：

- `scheme`
- `racket`
- `commonlisp`
- `lisp`
- `clojure`
- `janet`

如果你的 Lisp 方言使用其他 VSCode language id，也可以通过配置手动加入。

## Supported Bracket Types

本扩展当前支持以下括号类型：

- **标准括号**：`()`
- **Vector 括号**：`#()`
- **Bytevector 括号**：`#vu8()`

这些括号会根据嵌套深度应用循环颜色，帮助你快速识别表达式边界。

## Installation

### From VSCode Marketplace

1. 打开 VSCode
2. 进入 **Extensions** 视图
3. 搜索 `Lisp Rainbow Brackets`
4. 点击 **Install**
5. 打开 Scheme、Racket、Common Lisp 等文件后即可自动启用

### From VSIX / Local Development

如果你在本地开发或测试该插件：

1. 克隆仓库到本地
2. 安装依赖：

   ```bash
   npm install
   ```

3. 编译扩展：

   ```bash
   npm run compile
   ```

4. 在 VSCode 中按 `F5` 启动 Extension Development Host 进行调试

## Usage

安装完成后，扩展会在支持的 Lisp 文件中自动启用。

### Example: Nested S-Expressions

```lisp
(define (sum-tree tree)
  (cond
    ((null? tree) 0)
    ((pair? tree)
     (+ (sum-tree (car tree))
        (sum-tree (cdr tree))))
    (else tree)))
```

在上面的代码中，不同层级的括号会以不同颜色显示，帮助你快速看清 `cond`、`+` 以及递归调用之间的结构关系。

### Example: Special Lisp Forms

```lisp
#(define values '(1 2 3))
#vu8(65 66 67)
```

扩展同样支持 `#()` 与 `#vu8()` 这类 Lisp 常见括号形式。

## Screenshots

> 在发布到 VSCode 插件商店前，建议将下列占位图替换为真实截图。

![Screenshot: Nested expressions placeholder](images/screenshot-nested-expressions.png)

![Screenshot: Vector and bytevector placeholder](images/screenshot-vector-bytevector.png)

## Configuration

本扩展提供以下配置项：

### `lispRainbowBrackets.enabled`

- 类型：`boolean`
- 默认值：`true`
- 说明：是否启用 Lisp 彩虹括号高亮。

### `lispRainbowBrackets.colors`

- 类型：`string[]`
- 默认值：

  ```json
  [
    "#ff6b6b",
    "#f59f00",
    "#51cf66",
    "#22b8cf",
    "#4c6ef5",
    "#845ef7",
    "#f06595",
    "#94d82d"
  ]
  ```

- 说明：按嵌套深度循环使用的括号颜色列表。

### `lispRainbowBrackets.languages`

- 类型：`string[]`
- 默认值：

  ```json
  [
    "scheme",
    "racket",
    "commonlisp",
    "lisp",
    "clojure",
    "janet"
  ]
  ```

- 说明：指定哪些 VSCode language id 会启用彩虹括号效果。

### Example Settings

```json
{
  "lispRainbowBrackets.enabled": true,
  "lispRainbowBrackets.colors": [
    "#ff6b6b",
    "#ffd43b",
    "#69db7c",
    "#4dabf7",
    "#9775fa"
  ],
  "lispRainbowBrackets.languages": [
    "scheme",
    "racket",
    "commonlisp",
    "clojure"
  ]
}
```

## Why This Extension

通用彩虹括号扩展通常面向多语言场景，而 Lisp 代码的结构高度依赖括号表达式。本扩展专注于 Lisp 方言，目标是提供：

- 更符合 Lisp 代码阅读习惯的结构高亮体验
- 对 Lisp 注释、字符串与特殊括号形式更友好的处理
- 简单直接、开箱即用的使用方式

## License

当前仓库中**尚未包含正式的 LICENSE 文件**。

如果你计划将该扩展发布到 VSCode Marketplace，建议在仓库根目录补充许可证文件（例如 `MIT` License），并在此处更新为对应声明。
