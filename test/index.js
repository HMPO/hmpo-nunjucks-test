
const path = require('path');
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

let nunjucksTest = require('../');

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
        let $ = render({ component: 'testComponent', params: { a: 1, b: 2 }, ctx: true, ignore: true });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<pre>{&quot;a&quot;:1,&quot;b&quot;:2}</pre><p>[test2]</p><p>[test3]</p>');
    });

    it('renders a template', () => {
        let $ = render('test.html');
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<p>html [test1]</p>');
    });

    it('renders a string', () => {
        let $ = render({ string: '<b>string {{translate("test2")}}</b>', translate: true });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string baz</b>');
    });

    it('renders only yhe first key', () => {
        let $ = render({ string: '<b>string {{translate(["test2", "test1"])}}</b>' });
        let html = nunjucksTest.cleanHtml($('body'));

        expect(html).to.equal('<b>string [test2]</b>');
    });

    it('renders a throws an error if translation not found', () => {
        expect(() => {
            render({ component: 'testComponent', ctx: true });
        }).to.throw('Error: Translation not found for test3');
    });

    it('formats a string', () => {
        let $ = render({ string: '<p><b>string {{translate("test2")}}</b></p>', translate: true });
        let html = nunjucksTest.formatHtml($('body'));

        expect(html).to.equal('<p><b>string baz</b>\n</p>');
    });
});
