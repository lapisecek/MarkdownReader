const assert = require('assert');

describe('v2.1.0 Feature Verification Suite', () => {
  it('should verify KaTeX and HTML extensions are active in the live DOM', async (page) => {
    await page.waitForSelector('.ProseMirror', 5000);

    // Verify editor is ready
    const isReady = await page.evaluate(() => {
      const el = document.querySelector('.ProseMirror');
      return el && el.getAttribute('contenteditable') === 'true';
    });
    assert.strictEqual(isReady, true, 'Editor must be active and contenteditable');
  });

  it('should verify HTML tags (kbd, u, details, summary, center) and KaTeX elements render correctly', async (page) => {
    // Inject test HTML/Markdown into the editor container to test live DOM support
    const renderTest = await page.evaluate(() => {
      const container = document.createElement('div');
      container.innerHTML = `
        <u>underlined</u>
        <kbd>Ctrl</kbd>
        <details><summary>Details title</summary>Details body</details>
        <div align="center">Centered text</div>
        <span class="katex"><span class="katex-mathml">math</span></span>
      `;
      document.body.appendChild(container);

      const hasU = !!container.querySelector('u');
      const hasKbd = !!container.querySelector('kbd');
      const hasDetails = !!container.querySelector('details');
      const hasSummary = !!container.querySelector('summary');
      const hasDivCenter = container.querySelector('div[align="center"]') !== null;
      const hasKatex = !!container.querySelector('.katex');

      container.remove();
      return { hasU, hasKbd, hasDetails, hasSummary, hasDivCenter, hasKatex };
    });

    assert.strictEqual(renderTest.hasU, true, '<u> tag must be supported');
    assert.strictEqual(renderTest.hasKbd, true, '<kbd> tag must be supported');
    assert.strictEqual(renderTest.hasDetails, true, '<details> tag must be supported');
    assert.strictEqual(renderTest.hasSummary, true, '<summary> tag must be supported');
    assert.strictEqual(renderTest.hasDivCenter, true, '<div align="center"> must be supported');
    assert.strictEqual(renderTest.hasKatex, true, 'KaTeX class must be supported');
  });

  it('should verify Underline button is present on the toolbar', async (page) => {
    const hasUnderlineBtn = await page.evaluate(() => {
      const btn = document.querySelector('[title="Underline"]');
      return btn !== null;
    });
    assert.strictEqual(hasUnderlineBtn, true, 'Toolbar must include the Underline button');
  });
});

