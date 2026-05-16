export interface FactCheckIssue {
  field: string;
  matched: string;
  reason: string;
  suggestion?: string;
}

const EM_DASH_RE = /[–—]/g;

const FORBIDDEN_PATTERNS: { regex: RegExp; reason: string; suggestion?: string }[] = [
  {
    regex: /\bmigliore in assoluto\b/i,
    reason: "Superlative absoluto vietato.",
    suggestion: "Riformula con un parametro misurabile o rimuovi.",
  },
  {
    regex: /\brivoluzionari[ao]\b/i,
    reason: "Claim 'rivoluzionario' vietato.",
    suggestion: "Descrivi cosa cambia in modo concreto.",
  },
  {
    regex: /\bmiracolos[ao]\b/i,
    reason: "Claim miracolistico vietato.",
    suggestion: "Rimuovi.",
  },
  {
    regex: /\bcura la pelle\b/i,
    reason: "Claim medico/cosmetico non dimostrato.",
    suggestion: "Riformula come 'è progettata per' o rimuovi.",
  },
  {
    regex: /\b100\s*%\s*sosten/i,
    reason: "Claim ambientale assoluto non dimostrato.",
    suggestion: "Sostituisci con la certificazione specifica.",
  },
  {
    regex: /\bil pi[uù]\s+\w+\b/i,
    reason: "Superlativo relativo non dimostrato.",
    suggestion: "Riformula con qualifier ('tra i più …, secondo la certificazione X').",
  },
  {
    regex: /\bguarisc[ea]\b/i,
    reason: "Claim medico vietato.",
  },
  {
    regex: /\bringiovan/i,
    reason: "Claim medico/cosmetico vietato.",
  },
  {
    regex: /\bwellness\b/i,
    reason: "Lessico wellness vietato.",
    suggestion: "Riformula in registro editoriale.",
  },
];

const NUMERIC_HINT_RE = /\b\d{1,5}(?:[.,]\d+)?\s*(?:%|\b(?:mm|cm|m|gr|kg|ore|giorni|notti|fili|volte)\b)/i;

export interface CopyFragment {
  field: string;
  value: string;
}

export function findEmDashes(fragments: CopyFragment[]): FactCheckIssue[] {
  const out: FactCheckIssue[] = [];
  for (const f of fragments) {
    const matches = f.value.match(EM_DASH_RE);
    if (matches && matches.length > 0) {
      out.push({
        field: f.field,
        matched: matches.join(""),
        reason: "Em dash vietato nel copy finale.",
        suggestion: "Sostituisci con virgola, due punti o punto fermo.",
      });
    }
  }
  return out;
}

export function findForbiddenPatterns(fragments: CopyFragment[]): FactCheckIssue[] {
  const out: FactCheckIssue[] = [];
  for (const f of fragments) {
    for (const rule of FORBIDDEN_PATTERNS) {
      const m = f.value.match(rule.regex);
      if (m) {
        out.push({
          field: f.field,
          matched: m[0],
          reason: rule.reason,
          suggestion: rule.suggestion,
        });
      }
    }
  }
  return out;
}

export function findUncontextualizedNumbers(
  fragments: CopyFragment[],
  contextualizedFields: Set<string>,
): FactCheckIssue[] {
  const out: FactCheckIssue[] = [];
  for (const f of fragments) {
    if (contextualizedFields.has(f.field)) continue;
    const m = f.value.match(NUMERIC_HINT_RE);
    if (m) {
      out.push({
        field: f.field,
        matched: m[0],
        reason: "Dato numerico non contestualizzato (manca DATA_DARK o spiegazione).",
        suggestion: "Sposta in DATA_DARK con unit + context, oppure rimuovi.",
      });
    }
  }
  return out;
}

export function stripEmDashes(text: string): string {
  return text.replace(EM_DASH_RE, ",").replace(/\s*,\s*/g, ", ").replace(/,\s*\./g, ".");
}
