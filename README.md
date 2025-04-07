# hmpo-nunjucks-test

## Usage

* How to use the renderer() method
  * What are each of the params?
  * What file extensions are allowed for the views?
  * What file extensions are allowed for the locales?
* How to use the returned render() method
* How to use the cleanHtml() and formatHtml() methods

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
