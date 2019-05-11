
'use strict';

const path = require('path');
const _ = require('lodash');
const nunjucks = require('nunjucks');
const cheerio = require('cheerio');
const deepCloneMerge = require('deep-clone-merge');

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

const renderer = (views, locales) => {

    let nunjucksEnv = nunjucks.configure(views, {
        trimBlocks: true,
        lstripBlocks: true
    });

    let globals;
    try {
        globals = require('hmpo-components/lib/globals');
    } catch (e) {
        globals = require('../../lib/globals');
    }
    globals.addGlobals(nunjucksEnv);

    let filters;
    try {
        filters = require('hmpo-components/lib/filters');
    } catch (e) {
        filters = require('../../lib/filters');
    }
    filters.addFilters(nunjucksEnv);

    let locale;
    if (locales) {
        locales = locales.map(locale => require(locale));
        locale = deepCloneMerge(...locales);
    }

    const render = (options, context = {}) => {
        if (typeof options === 'string') options = { template: options };

        context = Object.assign({
            translate: (key, translateOptions = {}) => {
                if (Array.isArray(key)) key = key[0];
                if  (!locale) return '[' + key + ']';
                // check if keys exist in locale en file
                let translation = _.get(locale, key) || translateOptions.default;
                if (!translateOptions.optional && !translation && !options.ignore === true && !_.includes(options.ignore, key))
                    throw new Error('Translation not found for ' + key);
                return options.translate ? String(translation) : '[' + key + ']';
            },
            ctx: key => key ? _.get(context, key) : context
        }, context);

        let output;

        if (options.template) output = nunjucksEnv.render(options.template, context);

        else if (options.string) output = nunjucksEnv.renderString(options.string, context);

        else if (options.component) {
            let filename = options.component.replace(/([A-Z])/g, l => '-' + l.toLowerCase()) + '/macro.njk';
            let args = [];
            if (options.ctx) args.push('ctx');
            if (options.params) args.push(JSON.stringify(options.params, null, ' '));
            let string = `{% from "${filename}" import ${options.component} %}{{ ${options.component}(${args.join(',')}) }}`;
            output = nunjucksEnv.renderString(string, context);
        }
        
        else throw new Error('Cannot render!');

        return loadHtml(output);
    };

    return render;
};

module.exports = {
    renderer,
    loadHtml,
    formatHtml,
    cleanHtml
};

