
const path = require('path');
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

let nunjucksTest = require('../');

describe('nunjucks render loader', () => {
    let render;

    it('reads locales dictionary files', () => {
        render = nunjucksTest.renderer(
            [
                path.resolve(__dirname, 'views')
            ],
            [
                path.resolve(__dirname, 'locale', 'locale1.json'),
                path.resolve(__dirname, 'locale', 'locale2.json')
            ]
        );

        expect(render.dictionary).to.eql({
            test1: 'foo',
            test2: 'baz'
        });
    });

    it('reads locales dictionary directory', () => {
        render = nunjucksTest.renderer(
            [
                path.resolve(__dirname, 'views')
            ],
            [
                path.resolve(__dirname, 'locale')
            ]
        );

        expect(render.dictionary).to.eql({
            base: {
                key: 'value'
            },
            locale1: {
                test1: 'foo',
                test2: 'bar'
            },
            locale2: {
                test2: 'baz'
            },
            obj: {
                obj2: {
                    name: 'jsonvalue'
                }
            }
        });
    });
});

describe('nunjucks render', () => {
    let render;

    beforeEach(() => {
        render = nunjucksTest.renderer(
            [
                path.resolve(__dirname, 'views')
            ],
            [
                path.resolve(__dirname, 'locale', 'locale1.json'),
                path.resolve(__dirname, 'locale', 'locale2.json')
            ]
        );
    });

    it('renders a component', () => {
        let $ = render({
            component: 'testComponent',
            params: {
                a: 1,
                b: 2
            },
            ctx: true,
            ignore: true
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<pre>{"a":1,"b":2}</pre><p>[test2]</p><p>[test3]</p>');
    });

    it('renders a component with caller', () => {
        let $ = render({
            component: 'callerComponent',
            caller: 'caller text'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<pre>caller text</pre>');
    });

    it('renders a template', () => {
        let $ = render('test.html');
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<p>html [test1]</p>');
    });

    it('renders a string', () => {
        let $ = render({
            string: '<b>string {{translate("test2")}}</b>',
            translate: true
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string baz</b>');
    });

    it('renders only the first key', () => {
        let $ = render({
            string: '<b>string {{translate(["test2", "test1"])}}</b>'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string [test2]</b>');
    });

    it('renders a throws an error if translation not found', () => {
        expect(() => {
            render({
                component: 'testComponent',
                ctx: true
            });
        }).to.throw('Error: Translation not found for test3');
    });

    it('formats a string', () => {
        let $ = render({
            string: '<p><b>string {{translate("test2")}}</b></p>',
            translate: true
        });
        let html = nunjucksTest.formatHtml($('body'));

        expect(html).to.equal('<p><b>string baz</b>\n</p>');
    });
});

describe('nunjucks realsitic render', () => {
    let render;

    beforeEach(() => {
        render = nunjucksTest.renderer(
            [
                path.resolve(__dirname, 'views')
            ],
            [
                path.resolve(__dirname, 'locale', 'locale1.json'),
                path.resolve(__dirname, 'locale', 'locale2.json')
            ],
            undefined,
            undefined,
            true
        );
    });

    it('renders a component', () => {
        let $ = render({
            component: 'testComponent',
            params: {
                a: 1,
                b: 2
            },
            ctx: true
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<pre>{"a":1,"b":2}</pre><p>baz</p><p>test3</p>');
    });

    it('renders a template', () => {
        let $ = render('test.html');
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<p>html foo</p>');
    });

    it('renders a string', () => {
        let $ = render({
            string: '<b>string {{translate("test2")}}</b>'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string baz</b>');
    });

    it('renders only the first found key', () => {
        let $ = render({
            string: '<b>string {{translate(["test3", "test2", "test1"])}}</b>'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string baz</b>');
    });

    it('renders default if not found', () => {
        let $ = render({
            string: '<b>string {{translate(["test3"], { default: "a default" })}}</b>'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string a default</b>');
    });

    it('renders nothing if not found and self is false', () => {
        let $ = render({
            string: '<b>string {{translate(["test3"], { self: false }) or "falsey"}}</b>'
        });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string falsey</b>');
    });

    it('formats a string', () => {
        let $ = render({
            string: '<p><b>string {{translate("test2")}}</b></p>',
            translate: true
        });
        let html = nunjucksTest.formatHtml($('body'));

        expect(html).to.equal('<p><b>string baz</b>\n</p>');
    });
});
