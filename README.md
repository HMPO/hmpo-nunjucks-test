# hmpo-nunjucks-test

A Nunjucks templating engine testing library.

## Overview of Functions

### `renderer(views, locales, globals?, filters?, realistic?)`

Creates a rendering function for Nunjucks templates with support for localization and dynamic rendering.

This function sets up a Nunjucks environment with the provided view directories and localization files. It can render templates, strings, and components with dynamic context, including support for translations.

The function also includes error handling for missing translations and the ability to conditionally render based on certain flags.

#### Parameters

* `views` (`string` or `string[]`)  - Path(s) to the directories containing Nunjucks templates. Can be a single directory or an array of directories.

* `locales` (`string[]`) - An array of paths to localization files (JSON or YAML) that contain translations for various languages.

* `[globals=require('hmpo-components/lib/globals')]` (`Object`) - An object that provides global functions/variables to be used in the templates.

* `[filters=require('hmpo-components/lib/filters')]` (`Object`) - An object containing custom filters to be added to Nunjucks.

* `[realistic=false]` (`boolean`) - A flag that determines if the translation function should behave in a more "realistic" manner, e.g., fallback to the default value if a key is missing.

#### Returns

* `function` - A render function that can be used to render templates, strings, or components. This function accepts an options object and an optional context object, and returns the rendered HTML output.

#### Example Usage

```javascript
const path = require('path');
let nunjucksTest = require('hmpo-nunjucks-test');

let myRenderFunc = nunjucksTest.renderer(
    [
        path.resolve(__dirname, 'views')    // Path to views
    ],
    [   // Paths to locale files
        path.resolve(__dirname, 'locale', 'locale1.json'),
        path.resolve(__dirname, 'locale', 'locale2.yaml')
    ]
);

// This will return a render() function to myRenderFunc.
```

### `render(options, context = {})`

The `render` function is used to render templates, strings, or components using the Nunjucks templating engine. It also supports translations and context resolution.

This is the function returned by the previously mentioned `renderer` function.

#### Parameters

* `options` (`Object` | `string`) - Options to control the rendering process.
  * If a string is passed, it is treated as a template to render.
  * If an object is passed, it can contain one of the following properties:
    * `template` (`string`) - The path to the template to render.
    * `string` (`string`) - A raw string containing Nunjucks template code.
    * `component` (`string`) - The name of a component / macro to render.
    * `caller` (`string`) - The caller's content to pass to the component (if using `component`).
    * `params` (`Object`) - Parameters to pass to the component (if using `component`).
    * `ctx` (`boolean`) - Whether to include the context (`true` includes context).
    * `ignore` (`Array` | `string`) - Keys to ignore during translation.
    * `translate` (`boolean`) - Whether to perform translation (defaults to `true`).

* `context` (`Object`) - The context to pass to the Nunjucks template rendering. Default is an empty object. It can contain:
  * `translate` (`function`) - A function to provide translations for the keys.
  * `ctx` (`function`) - A function to access the context.

#### Returns

* `string` - The rendered HTML output as a string.

#### Example Usage

Assuming you have already imported and set up `hmpo-nunjucks-test` as seen in `renderer` example usage.

Rendering a template:

```javascript
const output = render({
    template: 'exampleTemplate.html',
    translate: true
});
```

Rendering a component:

```javascript
const output = render({
    component: 'myComponent',
    params: { a: 1, b: 2 },
    ctx: true
});
```

Rendering a String with Translation:

```javascript
const output = render({
    string: '<b>{{ translate("key1") }}</b>',
    translate: true
});
```

### `cleanHtml($)`

Cleans HTML content by removing unnecessary whitespace and formatting issues.
This function processes the HTML content by:

* Replacing the HTML character code `&#x2019;` with the right single quotation mark (`’`).
* Removing whitespace after opening tags and before closing tags.
* Removing all newlines and excessive spaces within the HTML string.
* Trimming leading and trailing whitespace from the final HTML.

This function is useful for "cleaning" HTML content, making it more compact and free of extra spaces and newlines.

Uses `Cheerio JS`. See their [docs](https://cheerio.js.org/docs/intro) for more info.

#### Parameters

* `$` (`Cheerio Object`) - A Cheerio object containing the HTML content to clean.

#### Returns

* `string` - The cleaned HTML as a string, with unnecessary whitespace removed.

#### Example Usage

Assuming you have already imported and set up `hmpo-nunjucks-test` as seen in `renderer` example usage.

```javascript
const cheerio = require('cheerio');
const htmlContent = cheerio.load('<div><p>  This is a test &#x2019; string  </p>  <p>Another test.</p></div>');
const cleanedHtml = cleanHtml(htmlContent);
console.log(cleanedHtml); 

// Output: 
// '<div><p>This is a test ’ string</p><p>Another test.</p></div>'
```

### `formatHtml($)`

Formats HTML content by cleaning up whitespace and adding newlines around tags.
This function processes the HTML content by:

* Replacing HTML character code `&#x2019;` with the right single quotation mark (`’`).
* Adding newlines before opening tags to ensure clean formatting.
* Adding newlines after closing tags to separate them visually.
* Removing multiple consecutive newlines and spaces, ensuring a single newline between elements.
* Trimming any leading or trailing whitespace.

Uses `Cheerio JS`. See their [docs](https://cheerio.js.org/docs/intro) for more info.

#### Parameters

* `$` (`Cheerio Object`) - A Cheerio object containing the HTML content to clean.

#### Returns

* `string` - The cleaned HTML as a string, with unnecessary whitespace removed.

#### Example Usage

Assuming you have already imported and set up `hmpo-nunjucks-test` as seen in `renderer` example usage.

```javascript
const cheerio = require('cheerio');
const htmlContent = cheerio.load('<div><p>  This is a test &#x2019; string  </p>  <p>Another test.</p></div>');
const formattedHtml = formatHtml(htmlContent);
console.log(formattedHtml); 

// Output: 
// '<div>\n<p>This is a test ’ string</p>\n<p>Another test.</p>\n</div>'
```

### A Combined Example

```javascript
const nunjucksTest = require('hmpo-nunjucks-test');

const views = [
    '/component/path,
];

const locales = [
    '/localiation/file.json'
];


// render templates with placeholders or simple translations.
// render options: { template, string, component, ignore = [], translate = false }
const render = nunjucksTest.renderer(views, locales);

// cheerio interface to rendered template
const $ = render({ template: 'template/in/search/path.njk' })

// rendered string
const $ = render({ string: '<h1>hello</h1>' })

// rendered component blah() in ./macro.njk
const $ = render({ component: 'component/in/search/blah' })


// more realistic localisation using multiple keys
// render options: { template, string, component }
const renderWithRealisticI18n = nunjucksTest.renderer(views, locales, undefined, undefined, true);
const $ = renderWithRealisticI18n({ template: 'template/in/search/path.njk' })


// tool to simplify rendered HTML for single line comparisons
const cleanHtml = nunjucksTest.cleanHtml;
const htmlString = cleanHtml($('h1'));

```

### Further Examples

You can find more applied examples with expected outputs in our [tests](/test/index.js).

There are also example usages in:

* [crpf-leo-alpha tests](https://github.com/HMPO/crpf-leo-alpha/blob/87c2505b8dae0493ed1e533b7aa84c9098e13994/test/unit/helper.js#L4)
* [hmpo-components tests](https://github.com/HMPO/hmpo-components/blob/3f7c5c97be49c4067877f6d2056b6369909bef17/test/helpers.js#L4)
