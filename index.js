
'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const nunjucks = require('nunjucks');
const cheerio = require('cheerio');
const deepCloneMerge = require('deep-clone-merge');
const yaml = require('js-yaml');

const loadHtml = html => {
    return cheerio.load(html, { normalizeWhitespace: true });
};

/**
 * Formats HTML content by cleaning up whitespace and adding newlines around tags.
 * 
 * This function processes the HTML content by:
 * - Replacing HTML character code `&#x2019;` with the right single quotation mark (`’`).
 * - Adding newlines before opening tags to ensure clean formatting.
 * - Adding newlines after closing tags to separate them visually.
 * - Removing multiple consecutive newlines and spaces, ensuring a single newline between elements.
 * - Trimming any leading or trailing whitespace.
 *
 * @param {Cheerio} $ - A Cheerio object containing the HTML content to format.
 * @returns {string} The formatted HTML as a string, with newlines and cleaned whitespace.
 * 
 * @example
 * const cheerio = require('cheerio');
 * const htmlContent = cheerio.load('<div><p>  This is a test &#x2019; string  </p>  <p>Another test.</p></div>');
 * const formattedHtml = formatHtml(htmlContent);
 * console.log(formattedHtml); 
 * // Output: 
 * // '<div>\n<p>This is a test ’ string</p>\n<p>Another test.</p>\n</div>'
 */
const formatHtml = $ => {
    let html = $.html()
        .replace(/&#x2019;/g, '’')
        .replace(/(<[^/][^>]+>)\s*/g, '\n$1')
        .replace(/\s*(<\/[^>]+>)/g, '$1\n')
        .replace(/(\n\s*)+/g, '\n');
    return html.trim();
};

/**
 * Cleans HTML content by removing unnecessary whitespace and formatting issues.
 * 
 * This function processes the HTML content by:
 * - Replacing the HTML character code `&#x2019;` with the right single quotation mark (`’`).
 * - Removing whitespace after opening tags and before closing tags.
 * - Removing all newlines and excessive spaces within the HTML string.
 * - Trimming leading and trailing whitespace from the final HTML.
 *
 * This function is useful for "cleaning" HTML content, making it more compact and free of extra spaces and newlines.
 *
 * @param {Cheerio} $ - A Cheerio object containing the HTML content to clean.
 * @returns {string} The cleaned HTML as a string, with unnecessary whitespace removed.
 * 
 * @example
 * const cheerio = require('cheerio');
 * const htmlContent = cheerio.load('<div><p>  This is a test &#x2019; string  </p>  <p>Another test.</p></div>');
 * const cleanedHtml = cleanHtml(htmlContent);
 * console.log(cleanedHtml); 
 * // Output: 
 * // '<div><p>This is a test ’ string</p><p>Another test.</p></div>'
 */
const cleanHtml = $ => {
    let html = $.html()
        .replace(/&#x2019;/g, '’')
        .replace(/(<[^/][^>]+>)\s*/g, '$1')
        .replace(/\s*(<\/[^>]+>)/g, '$1')
        .replace(/(\n\s*)+/g, '');
    return html.trim();
};

/**
 * Creates a rendering function for Nunjucks templates with support for localization and dynamic rendering.
 * 
 * This function sets up a Nunjucks environment with the provided view directories and localization files. It can 
 * render templates, strings, and components with dynamic context, including support for translations. The function 
 * also includes error handling for missing translations and the ability to conditionally render based on certain 
 * flags.
 * 
 * @param {string|string[]} views - Path(s) to the directories containing Nunjucks templates. Can be a single 
 *                                  directory or an array of directories.
 * @param {string[]} locales - An array of paths to localization files (JSON or YAML) that contain translations 
 *                             for various languages.
 * @param {Object} [globals=require('hmpo-components/lib/globals')] - An object that provides global 
 *                                                                     functions/variables to be used in the templates.
 * @param {Object} [filters=require('hmpo-components/lib/filters')] - An object containing custom filters to be 
 *                                                                     added to Nunjucks.
 * @param {boolean} [realistic=false] - A flag that determines if the translation function should behave in a 
 *                                      more "realistic" manner, e.g., fallback to the default value if a key is 
 *                                      missing.
 * 
 * @returns {function} - A render function that can be used to render templates, strings, or components. This 
 *                       function accepts an options object and an optional context object, and returns the 
 *                       rendered HTML output.
 * 
 * @example
 * const renderer = require('./renderer');
 * 
 * // Create a render function with views and locales
 * const render = renderer(
 *     [
            path.resolve(__dirname, 'views')    // Path to views
        ],
        [   // Paths to locale files.
            path.resolve(__dirname, 'locale', 'locale1.json'),
            path.resolve(__dirname, 'locale', 'locale2.json')
        ],
        undefined,
        undefined,
        true
 * );
 * 
 * // Render a template with a context object
 * const context = { name: 'John' };
 * const output = render({
 *     template: 'greeting.njk',  // Template to render
 *     context: context            // Context to pass to the template
 * });
 * 
 * console.log(output);  // Output might be: <h1>Hello, John!</h1> (based on translations)
 * 
 * // Render a component
 * const componentOutput = render({
 *     component: 'header',  // Component to render
 *     params: { title: 'Welcome' }
 * });
 * 
 * console.log(componentOutput);  // Output might be: <header><h1>Welcome</h1></header>
 * 
 * // Handle missing translations gracefully (if realistic flag is true)
 * const translatedString = render({
 *     string: '<p>{{translate("welcome_message")}}</p>',
 *     translate: true
 * });
 * 
 * // Throws an error if the translation is missing and `realistic` is false
 * render({
 *     component: 'footer', 
 *     ctx: true  // Indicates context should be passed
 * });
 * // Will throw an error if translation for "footer" is missing
 */
const renderer = (views, locales, globals = require('hmpo-components/lib/globals'), filters = require('hmpo-components/lib/filters'), realistic) => {

    let nunjucksEnv = nunjucks.configure(views, {
        trimBlocks: true,
        lstripBlocks: true
    });

    globals.addGlobals(nunjucksEnv);
    filters.addFilters(nunjucksEnv);

    const loadLocale = (p, stack) => {
        const stat = fs.statSync(p);

        if (stat.isDirectory()) {
            const files = fs.readdirSync(p);
            let data = {};
            files.forEach(file => {
                if (file.match(/\.(jso?n|ya?ml)$/)) data = loadLocale(path.resolve(p, file), data);
            });
            return data;
        }

        let data;
        try {
            const text = fs.readFileSync(p).toString();
            if (p.match(/\.jso?n$/)) data = JSON.parse(text);
            else if (p.match(/\.ya?ml$/)) data = yaml.load(text);
            else throw new Error('Unknown file type');
        } catch (e) {
            throw new Error('Error loading localisation file ' + p + ': ' + e.message);
        }

        if (!stack) return data;

        // mount this file in the correct place in the stack based on filename
        const parts = path.basename(p).split('.');
        parts.pop();
        if (parts[0] === 'default') parts.shift();
        while (parts.length) data = { [parts.pop()]: data };
        return deepCloneMerge(stack, data);
    };

    let locale;
    if (locales) {
        locales = locales.map(locale => loadLocale(locale));
        locale = deepCloneMerge(...locales);
    }

    /**
     * Renders a template, string, or component using the Nunjucks templating engine.
     * 
     * This function can handle rendering based on different options:
     * - **template**: Render a template file using Nunjucks.
     * - **string**: Render a string that contains Nunjucks syntax.
     * - **component**: Render a component (macro) using Nunjucks, optionally passing parameters and context.
     * 
     * It also supports translations via the `translate` function and context resolution.
     * 
     * @param {Object|string} options - Options to control the rendering process. This can be:
     *   - A string, which is treated as the template to render.
     *   - An object containing one of the following properties:
     *     - `template` {string}: The path to the template to render.
     *     - `string` {string}: A raw string containing Nunjucks template code.
     *     - `component` {string}: The name of a component (macro) to render.
     *     - `caller` {string}: The caller's content to pass to the component (if using `component`).
     *     - `params` {Object}: Parameters to pass to the component (if using `component`).
     *     - `ctx` {boolean}: Whether to include the context (`true` includes context).
     *     - `ignore` {Array|string}: Keys to ignore during translation.
     *     - `translate` {boolean}: Whether to perform translation (defaults to `true`).
     * @param {Object} [context={}] - The context to pass to the Nunjucks template rendering. 
     *   It can contain variables, helper functions, or translation options.
     *   - `translate`: A function that provides translations for keys.
     *   - `ctx`: A function to access the context.
     * @returns {string} The rendered HTML output as a string.
     * @throws {Error} If an error occurs during rendering or if a translation is not found.
     * 
     * @example
     * // Rendering a template
     * const output = render({
     *   template: 'exampleTemplate.html',
     *   translate: true
     * });
     * 
     * // Rendering a component
     * const output = render({
     *   component: 'myComponent',
     *   params: { a: 1, b: 2 },
     *   ctx: true
     * });
     * 
     * // Rendering a string with translation
     * const output = render({
     *   string: '<b>{{ translate("key1") }}</b>',
     *   translate: true
     * });
     */
    const render = (options, context = {}) => {
        if (typeof options === 'string') options = { template: options };

        context = Object.assign({
            translate: (key, translateOptions = {}) => {
                translateOptions = _.extend({ self: true }, translateOptions);
                if (realistic) {
                    if (!locale) return;
                    const keys = Array.isArray(key) ? key : [key];
                    return _.reduce(keys, (str, k) => {
                        return str || _.get(locale, k);
                    }, null) || translateOptions.default || (translateOptions.self && keys[0]);
                }

                if (Array.isArray(key)) key = key[0];
                if (!locale) return '[' + key + ']';
                // check if keys exist in locale en file
                let translation = _.get(locale, key) || translateOptions.default;
                if (translateOptions.self && !translation && !options.ignore === true && !_.includes(options.ignore, key))
                    throw new Error('Translation not found for ' + key);
                return options.translate ? String(translation) : '[' + key + ']';
            },
            ctx: key => key ? _.get(context, key) : context
        }, context);

        let output;

        if (options.template) output = nunjucksEnv.render(options.template, context);

        else if (options.string) output = nunjucksEnv.renderString(options.string, context);

        else if (options.component) {
            const filename = options.component.replace(/([A-Z])/g, l => '-' + l.toLowerCase()) + '/macro.njk';
            const importString = `{% from "${filename}" import ${options.component} %}`;
            const args = [];
            if (options.ctx) args.push('ctx');
            if (options.params) args.push(JSON.stringify(options.params, null, ' '));
            const macroString = `${options.component}(${args.join(',')})`;
            const string = options.caller ?
                `${importString}{% call ${macroString} %}${options.caller}{% endcall %}` :
                `${importString}{{ ${macroString} }}`;
            output = nunjucksEnv.renderString(string, context);
        }

        else throw new Error('Cannot render!');

        return loadHtml(output);
    };

    render.dictionary = locale;

    return render;
};

module.exports = {
    renderer,
    loadHtml,
    formatHtml,
    cleanHtml
};

