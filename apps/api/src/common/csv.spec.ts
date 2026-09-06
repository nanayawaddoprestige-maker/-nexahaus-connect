import { parseCsv, toCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple sheet into keyed rows", () => {
    const rows = parseCsv("name,city\nAma,Accra\nKojo,Kumasi\n");
    expect(rows).toEqual([
      { name: "Ama", city: "Accra" },
      { name: "Kojo", city: "Kumasi" },
    ]);
  });

  it("handles quoted fields with commas and newlines", () => {
    const rows = parseCsv('name,note\n"Mensah, K.","line one\nline two"\n');
    expect(rows[0]).toEqual({ name: "Mensah, K.", note: "line one\nline two" });
  });

  it("unescapes doubled quotes", () => {
    const rows = parseCsv('q\n"she said ""hi"""\n');
    expect(rows[0]!.q).toBe('she said "hi"');
  });

  it("trims headers and cells, skips blank lines, tolerates CRLF", () => {
    const rows = parseCsv(" a , b \r\n 1 , 2 \r\n\r\n 3 , 4 \r\n");
    expect(rows).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("fills missing trailing cells with empty strings", () => {
    const rows = parseCsv("a,b,c\n1,2\n");
    expect(rows[0]).toEqual({ a: "1", b: "2", c: "" });
  });

  it("returns [] for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });
});

describe("toCsv", () => {
  it("serialises with the given column order and escapes as needed", () => {
    const csv = toCsv(["name", "note"], [{ name: "A, B", note: 'x"y' }]);
    expect(csv).toBe('name,note\n"A, B","x""y"');
  });
});
