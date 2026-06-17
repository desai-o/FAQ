const { extractKeywords } = require("../services/syncService");

describe("syncService.extractKeywords", () => {
  test("extracts useful keywords and removes common words", () => {
    const keywords = extractKeywords("How do I upload the signed NOC document?");

    expect(keywords).toContain("upload");
    expect(keywords).toContain("signed");
    expect(keywords).toContain("noc");
    expect(keywords).not.toContain("how");
    expect(keywords).not.toContain("the");
  });
});
