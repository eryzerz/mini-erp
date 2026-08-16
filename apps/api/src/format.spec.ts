import { formatPhone, formatTaxId } from "@repo/common";

describe("formatPhone", () => {
  it("normalizes a raw mobile number", () => {
    expect(formatPhone("6281234567891")).toBe("+62 812 3456 7891");
    expect(formatPhone("081234567890")).toBe("+62 812 3456 7890");
  });

  it("groups landlines as area + local number", () => {
    expect(formatPhone("0215550134")).toBe("+62 21 555 0134");
  });

  it("round-trips already-formatted values", () => {
    expect(formatPhone("+62 21 555 0134")).toBe("+62 21 555 0134");
    expect(formatPhone("+62 812 3456 7890")).toBe("+62 812 3456 7890");
  });

  it("handles empty and partial input", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("0812345")).toBe("+62 812 345");
  });
});

describe("formatTaxId", () => {
  it("lays out raw digits as an NPWP", () => {
    expect(formatTaxId("012341414124")).toBe("01.234.141.4-124");
    expect(formatTaxId("012345678901234")).toBe("01.234.567.8-901.234");
  });

  it("round-trips the formatted shape", () => {
    expect(formatTaxId("01.234.567.8-901.000")).toBe("01.234.567.8-901.000");
  });

  it("handles empty and partial input", () => {
    expect(formatTaxId("")).toBe("");
    expect(formatTaxId("01234")).toBe("01.234");
  });
});
