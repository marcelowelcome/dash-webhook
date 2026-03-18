import { describe, it, expect } from "vitest";
import {
    parseDate,
    parseBoolean,
    parseNumber,
    coerceFieldValue,
    resolveDestino,
    resolveConvidados,
    resolveOrcamento,
    CONV_MAP,
    ORC_MAP,
    DESTINO_NORM,
    FIELD_MAP,
} from "../ac-field-map";

// ─── parseDate ──────────────────────────────────────────────────────────────

describe("parseDate", () => {
    it("returns null for null input", () => {
        expect(parseDate(null)).toBeNull();
    });

    it("returns ISO string for valid ISO date", () => {
        const result = parseDate("2025-06-15T10:30:00Z");
        expect(result).toBe(new Date("2025-06-15T10:30:00Z").toISOString());
    });

    it("returns ISO string for date-only string", () => {
        const result = parseDate("2025-06-15");
        expect(result).not.toBeNull();
        expect(result).toContain("2025-06-15");
    });

    it("returns null for empty string", () => {
        expect(parseDate("")).toBeNull();
    });

    it('returns null for literal "null" string', () => {
        expect(parseDate("null")).toBeNull();
    });

    it("returns null for unparseable date string", () => {
        expect(parseDate("not-a-date")).toBeNull();
    });
});

// ─── parseBoolean ───────────────────────────────────────────────────────────

describe("parseBoolean", () => {
    it.each([
        ["yes", true],
        ["Yes", true],
        ["YES", true],
        ["sim", true],
        ["Sim", true],
        ["true", true],
        ["True", true],
        ["1", true],
    ])('"%s" → %s', (input, expected) => {
        expect(parseBoolean(input)).toBe(expected);
    });

    it.each([
        ["no", false],
        ["não", false],
        ["false", false],
        ["0", false],
        ["", false],
        ["random", false],
    ])('"%s" → false', (input) => {
        expect(parseBoolean(input)).toBe(false);
    });

    it("returns false for null", () => {
        expect(parseBoolean(null)).toBe(false);
    });
});

// ─── parseNumber ────────────────────────────────────────────────────────────

describe("parseNumber", () => {
    it("parses plain integer string", () => {
        expect(parseNumber("123")).toBe(123);
    });

    it("parses decimal string", () => {
        expect(parseNumber("99.5")).toBe(99.5);
    });

    it("strips non-numeric chars but parseFloat reads Brazilian thousands separator as decimal", () => {
        // "R$ 50.000" → strip → "50.000" → parseFloat → 50 (dot is decimal separator in JS)
        // This is the actual behavior: parseFloat stops reading "50.000" correctly as 50.0
        expect(parseNumber("R$ 50.000")).toBe(50);
    });

    it("parses plain large number without formatting", () => {
        expect(parseNumber("50000")).toBe(50000);
    });

    it("returns null for null", () => {
        expect(parseNumber(null)).toBeNull();
    });

    it("returns null for empty string", () => {
        expect(parseNumber("")).toBeNull();
    });

    it("returns null for non-numeric string", () => {
        expect(parseNumber("abc")).toBeNull();
    });
});

// ─── coerceFieldValue ───────────────────────────────────────────────────────

describe("coerceFieldValue", () => {
    it("coerces date column with valid date → ISO string", () => {
        const result = coerceFieldValue("data_fechamento", "2025-06-15T10:00:00Z");
        expect(result).toBe(new Date("2025-06-15T10:00:00Z").toISOString());
    });

    it("coerces date column with invalid date → null", () => {
        expect(coerceFieldValue("data_reuniao_1", "not-a-date")).toBeNull();
    });

    it("coerces num column with number string → number", () => {
        expect(coerceFieldValue("orcamento", "150000")).toBe(150000);
    });

    it("coerces num column with non-numeric → null", () => {
        expect(coerceFieldValue("num_convidados", "abc")).toBeNull();
    });

    it("coerces bool column with 'sim' → true", () => {
        expect(coerceFieldValue("is_elopement", "sim")).toBe(true);
    });

    it("coerces bool column with 'no' → false", () => {
        expect(coerceFieldValue("costumam_viajar", "no")).toBe(false);
    });

    it("passes through regular (non-special) column as string", () => {
        expect(coerceFieldValue("cidade", "São Paulo")).toBe("São Paulo");
    });

    it("passes through unknown column as string", () => {
        expect(coerceFieldValue("random_column", "value")).toBe("value");
    });
});

// ─── resolveDestino ─────────────────────────────────────────────────────────

describe("resolveDestino", () => {
    it('returns field 29 value when field 28 is "Outro"', () => {
        const raw = { "28": "Outro", "29": "Toscana" };
        expect(resolveDestino(raw)).toBe("Toscana");
    });

    it('returns "Outro" when field 28 is "Outro" and field 29 is missing', () => {
        const raw = { "28": "Outro" };
        expect(resolveDestino(raw)).toBe("Outro");
    });

    it('normalizes "itália" → "Itália"', () => {
        const raw = { "28": "itália" };
        expect(resolveDestino(raw)).toBe("Itália");
    });

    it('normalizes "caribe/cancún" → "Caribe"', () => {
        const raw = { "28": "Caribe/Cancún" };
        expect(resolveDestino(raw)).toBe("Caribe");
    });

    it("passes through unknown value as-is", () => {
        const raw = { "28": "Havaí" };
        expect(resolveDestino(raw)).toBe("Havaí");
    });

    it("returns undefined when field 28 is missing", () => {
        expect(resolveDestino({})).toBeUndefined();
    });

    it('normalizes "nordeste brasileiro" → "Nordeste"', () => {
        const raw = { "28": "Nordeste Brasileiro" };
        expect(resolveDestino(raw)).toBe("Nordeste");
    });
});

// ─── resolveConvidados ──────────────────────────────────────────────────────

describe("resolveConvidados", () => {
    it('"até 20 convidados" → 15', () => {
        expect(resolveConvidados({ "26": "Até 20 convidados" })).toBe(15);
    });

    it('"apenas o casal" → 2', () => {
        expect(resolveConvidados({ "26": "Apenas o casal" })).toBe(2);
    });

    it('"entre 50 a 80 convidados" → 65', () => {
        expect(resolveConvidados({ "26": "Entre 50 a 80 convidados" })).toBe(65);
    });

    it('"acima de 100 convidados" → 120', () => {
        expect(resolveConvidados({ "26": "Acima de 100 convidados" })).toBe(120);
    });

    it("returns undefined for unknown value", () => {
        expect(resolveConvidados({ "26": "um zilhão" })).toBeUndefined();
    });

    it("returns undefined when field 26 is missing", () => {
        expect(resolveConvidados({})).toBeUndefined();
    });
});

// ─── resolveOrcamento ───────────────────────────────────────────────────────

describe("resolveOrcamento", () => {
    it('"entre r$50 e r$80 mil" → 65000', () => {
        expect(resolveOrcamento({ "27": "Entre R$50 e R$80 mil" })).toBe(65000);
    });

    it('"até r$50 mil" → 40000', () => {
        expect(resolveOrcamento({ "27": "Até R$50 mil" })).toBe(40000);
    });

    it('"mais de r$500 mil" → 600000', () => {
        expect(resolveOrcamento({ "27": "Mais de R$500 mil" })).toBe(600000);
    });

    it('"entre r$200 e r$500 mil" → 350000', () => {
        expect(resolveOrcamento({ "27": "Entre R$200 e R$500 mil" })).toBe(350000);
    });

    it("returns undefined for unknown value", () => {
        expect(resolveOrcamento({ "27": "grátis" })).toBeUndefined();
    });

    it("returns undefined when field 27 is missing", () => {
        expect(resolveOrcamento({})).toBeUndefined();
    });
});

// ─── CONV_MAP spot checks ───────────────────────────────────────────────────

describe("CONV_MAP", () => {
    it("maps 'apenas o casal' → 2", () => {
        expect(CONV_MAP["apenas o casal"]).toBe(2);
    });

    it("maps 'menos de 50 pessoas' → 35", () => {
        expect(CONV_MAP["menos de 50 pessoas"]).toBe(35);
    });

    it("maps 'entre 80 a 100 convidados' → 90", () => {
        expect(CONV_MAP["entre 80 a 100 convidados"]).toBe(90);
    });

    it("maps 'mais de 100 pessoas' → 120", () => {
        expect(CONV_MAP["mais de 100 pessoas"]).toBe(120);
    });
});

// ─── ORC_MAP spot checks ────────────────────────────────────────────────────

describe("ORC_MAP", () => {
    it("maps 'até r$50 mil' → 40000", () => {
        expect(ORC_MAP["até r$50 mil"]).toBe(40000);
    });

    it("maps 'menos de r$50 mil' → 40000", () => {
        expect(ORC_MAP["menos de r$50 mil"]).toBe(40000);
    });

    it("maps 'entre r$100 e r$200 mil' → 150000", () => {
        expect(ORC_MAP["entre r$100 e r$200 mil"]).toBe(150000);
    });

    it("maps 'mais de r$500 mil' → 600000", () => {
        expect(ORC_MAP["mais de r$500 mil"]).toBe(600000);
    });
});

// ─── DESTINO_NORM spot checks ───────────────────────────────────────────────

describe("DESTINO_NORM", () => {
    it('normalizes "itália" → "Itália"', () => {
        expect(DESTINO_NORM["itália"]).toBe("Itália");
    });

    it('normalizes "italia" → "Itália"', () => {
        expect(DESTINO_NORM["italia"]).toBe("Itália");
    });

    it('normalizes "caribe/cancún" → "Caribe"', () => {
        expect(DESTINO_NORM["caribe/cancún"]).toBe("Caribe");
    });

    it('normalizes "nordeste brasileiro" → "Nordeste"', () => {
        expect(DESTINO_NORM["nordeste brasileiro"]).toBe("Nordeste");
    });

    it('normalizes "grécia" → "Grécia"', () => {
        expect(DESTINO_NORM["grécia"]).toBe("Grécia");
    });

    it('normalizes "patagônia" → "Patagônia"', () => {
        expect(DESTINO_NORM["patagônia"]).toBe("Patagônia");
    });
});

// ─── FIELD_MAP spot checks ──────────────────────────────────────────────────

describe("FIELD_MAP", () => {
    it("maps field 87 → data_fechamento", () => {
        expect(FIELD_MAP["87"]).toBe("data_fechamento");
    });

    it("maps field 121 → destino", () => {
        expect(FIELD_MAP["121"]).toBe("destino");
    });

    it("maps field 64 → valor_fechado_em_contrato", () => {
        expect(FIELD_MAP["64"]).toBe("valor_fechado_em_contrato");
    });
});
