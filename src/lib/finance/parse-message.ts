import type { FinanceTransactionType } from "@/types/finance";

export interface ParsedFinanceMessage {
  tipo: FinanceTransactionType;
  valor: number;
  categoria: string | null;
  descricao: string | null;
}

const DESPESA_KEYWORDS = ["gastei", "paguei", "comprei", "gasto", "saiu", "gastar"];
const RECEITA_KEYWORDS = ["recebi", "entrou", "ganhei", "caiu", "receita", "vendi", "faturei"];

const DESPESA_CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Alimentação", ["mercado", "comida", "restaurante", "lanche", "padaria", "ifood", "açougue", "acougue", "supermercado"]],
  ["Transporte", ["posto", "gasolina", "uber", "combustível", "combustivel", "pedágio", "pedagio", "ônibus", "onibus"]],
  ["Moradia", ["luz", "água", "agua", "aluguel", "conta", "internet", "condominio", "condomínio", "gás", "gas"]],
  ["Saúde", ["farmácia", "farmacia", "remedio", "remédio", "medico", "médico", "academia", "consulta"]],
  ["Lazer", ["cinema", "bar", "show", "viagem", "lazer", "balada", "festa"]],
  ["Assinaturas", ["netflix", "spotify", "assinatura", "streaming"]],
  ["Educação", ["curso", "livro", "escola", "faculdade"]],
];

// Letras (incl. acentuadas) usadas pra simular \b sem cair na armadilha do
// \b nativo do JS, que não reconhece acento como "caractere de palavra" —
// sem isso, "gastei" batia com a palavra-chave "gas" (de "gás").
const WORD_CHARS = "a-zà-öø-ÿ0-9";

function findFirstKeyword(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    const re = new RegExp(`(?<![${WORD_CHARS}])${kw}(?![${WORD_CHARS}])`, "i");
    if (re.test(text)) return kw;
  }
  return null;
}

/**
 * Interpreta uma mensagem curta em português ("gastei 50 no posto") e
 * extrai tipo/valor/categoria/descrição. Heurística simples baseada em
 * palavras-chave — suficiente pro uso de lançamento rápido via WhatsApp;
 * casos ambíguos ficam sem categoria pro usuário ajustar depois no painel.
 */
export function parseFinanceMessage(raw: string): ParsedFinanceMessage | { error: string } {
  const text = raw.trim().toLowerCase();
  if (!text) return { error: "Mensagem vazia." };

  const valorMatch = text.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!valorMatch) {
    return {
      error: "Não encontrei um valor na mensagem. Ex: 'gastei 50 no mercado' ou 'entrou 200 de aula'.",
    };
  }
  const valor = Number(valorMatch[1].replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Valor inválido." };
  }

  const despesaKw = findFirstKeyword(text, DESPESA_KEYWORDS);
  const receitaKw = findFirstKeyword(text, RECEITA_KEYWORDS);
  const tipo: FinanceTransactionType = receitaKw && !despesaKw ? "receita" : "despesa";

  let descricao: string | null = text
    .replace(valorMatch[0], "")
    .replace(new RegExp(`\\b(${[...DESPESA_KEYWORDS, ...RECEITA_KEYWORDS].join("|")})\\b`, "g"), "")
    .replace(/\bde\b|\bno\b|\bna\b|\bem\b|\bcom\b|\breais?\b|r\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  descricao = descricao ? descricao[0].toUpperCase() + descricao.slice(1) : null;

  let categoria: string | null = null;
  if (tipo === "despesa") {
    for (const [nome, keywords] of DESPESA_CATEGORY_KEYWORDS) {
      if (findFirstKeyword(text, keywords)) {
        categoria = nome;
        break;
      }
    }
  } else {
    categoria = findFirstKeyword(text, ["salário", "salario"]) ? "Salário" : "Renda extra";
  }

  return { tipo, valor, categoria, descricao };
}
