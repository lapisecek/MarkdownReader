const assert = require('assert');

describe('Smoke Spec', () => {
  it('should verify the application launches and basic DOM exists', async (page) => {
    // Wait for the #app container element to be present in the document
    await page.waitForSelector('#app', 5000);

    // Evaluate that it actually exists
    const appExists = await page.evaluate(() => {
      const el = document.getElementById('app');
      return el !== null;
    });
    assert.strictEqual(appExists, true, 'The element with ID "app" must exist in the loaded document');
  });

  it('should check the document title is correct', async (page) => {
    const title = await page.evaluate(() => {
      return document.title;
    });
    assert.strictEqual(title, 'markdownreader', 'The initial window HTML title must be "markdownreader"');
  });
});
