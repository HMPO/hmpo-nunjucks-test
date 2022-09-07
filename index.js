
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

const formatHtml = $ => {
    let html = $.html()
        .replace(/&#x2019;/g, '’')
        .replace(/(<[^/][^>]+>)\s*/g, '\n$1')
        .replace(/\s*(<\/[^>]+>)/g, '$1\n')
        .replace(/(\n\s*)+/g, '\n');
    return html.trim();
};

const cleanHtml = $ => {
    let html = $.html()
        .replace(/&#x2019;/g, '’')
        .replace(/(<[^/][^>]+>)\s*/g, '$1')
        .replace(/\s*(<\/[^>]+>)/g, '$1')
        .replace(/(\n\s*)+/g, '');
    return html.trim();
};

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
        } catch(e) {
            throw new Error('Error loading localisation file ' + p + ': ' + e.message);
        }

        if (!stack) return data;

        // mount this file in the correct place in the stack based on filename
        const parts = path.basename(p).split('.');
        parts.pop();
        if (parts[0] === 'default') parts.shift();
        while(parts.length) data = { [parts.pop()]: data };
        return deepCloneMerge(stack, data);
    };

    let locale;
    if (locales) {
        locales = locales.map(locale => loadLocale(locale));
        locale = deepCloneMerge(...locales);
    }

    const render = (options, context = {}) => {
        if (typeof options === 'string') options = { template: options };

        context = Object.assign({
            translate: (key, translateOptions = {}) => {
                translateOptions = _.extend({ self: true }, translateOptions);
                if (realistic) {
                    if (!locale) return;
                    const keys = Array.isArray(key) ? key : [ key ];
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

