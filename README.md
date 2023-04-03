<div align="center">

# @defx/r5

## HTML Renderer

## declarative • minimalist • isomorphic

</div>
<br />

@defx/r5 is a ~1.5Kb JavaScript library consisting of two essential utility functions that can be used to create and render HTML templates. R5's minimalist design is small and flexible enough to fit into any UI architecture, no matter how simple or complex.

R5 templates are written in standard JavaScript with Template Literals.

```js
import { html, render } from "@defx/r5"

// The html function is used to render a template
const helloWorld = (name) => html`<p>Hello ${name} 👋</p>`

// The render function is used to render a template to the DOM
render(helloWorld("Kimberley"), document.body)

// Calling the render function again updates the text of our existing div node
render(helloWorld("Thea"), document.body)
```

R5 provides two main exports:

    `html`: A tag function that accepts an HTML Template Literal and returns a template value
    `render()`: A function that renders a template value to a DOM node.

</div>
<br />
<br />

### Installation via NPM

```sh
npm install @defx/r5
```

### Installation via CDN

```js
import { html } from "https://www.unpkg.com/@defx/r5"
```
