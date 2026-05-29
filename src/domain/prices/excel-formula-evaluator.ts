import type {
  BudgetTemplateItem,
  ExcelWorkbookCellValue,
} from "./price-import";

type CellValue = number | string | null;

type WorkbookCell = {
  valueNumber: number | null;
  valueText: string | null;
  formula: string | null;
};

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "cell"; value: string }
  | { type: "operator"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "comma"; value: "," }
  | { type: "colon"; value: ":" };

type CalculationContext = {
  currentSheet: string;
  currentItem: BudgetTemplateItem;
  inputValues: Record<string, number>;
  workbookCells: Map<string, WorkbookCell>;
  memo: Map<string, number>;
  stack: Set<string>;
};

const CURRENT_SHEET = "PRESUPUESTO";

function normalizeAddress(address: string) {
  return address.replace(/\$/g, "").toUpperCase();
}

function makeCellKey(sheetName: string, cellAddress: string) {
  return `${sheetName.toUpperCase()}!${normalizeAddress(cellAddress)}`;
}

function columnToNumber(column: string) {
  return column.split("").reduce((acc, char) => {
    return acc * 26 + char.charCodeAt(0) - 64;
  }, 0);
}

function numberToColumn(value: number) {
  let column = "";
  let next = value;

  while (next > 0) {
    const remainder = (next - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    next = Math.floor((next - 1) / 26);
  }

  return column;
}

function splitAddress(address: string) {
  const normalized = normalizeAddress(address);
  const match = /^([A-Z]+)(\d+)$/.exec(normalized);

  if (!match) {
    throw new Error(`Referencia de celda no soportada: ${address}`);
  }

  return {
    column: match[1],
    row: Number(match[2]),
  };
}

function parseCellReference(reference: string, currentSheet: string) {
  const clean = reference.replace(/\$/g, "");
  const [sheetPart, addressPart] = clean.includes("!")
    ? clean.split("!")
    : [currentSheet, clean];

  return {
    sheetName: sheetPart.replace(/^'|'$/g, ""),
    cellAddress: normalizeAddress(addressPart),
  };
}

function tokenize(formula: string): Token[] {
  const cleanFormula = formula.trim().replace(/^=/, "");
  const tokens: Token[] = [];
  let index = 0;

  while (index < cleanFormula.length) {
    const char = cleanFormula[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const twoChars = cleanFormula.slice(index, index + 2);
    if ([">=", "<=", "<>"].includes(twoChars)) {
      tokens.push({ type: "operator", value: twoChars });
      index += 2;
      continue;
    }

    if ("+-*/^%=<>".includes(char)) {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma", value: "," });
      index += 1;
      continue;
    }

    if (char === ":") {
      tokens.push({ type: "colon", value: ":" });
      index += 1;
      continue;
    }

    if (/\d|\./.test(char)) {
      let end = index + 1;
      while (end < cleanFormula.length && /[\d.]/.test(cleanFormula[end])) {
        end += 1;
      }
      tokens.push({
        type: "number",
        value: Number(cleanFormula.slice(index, end)),
      });
      index = end;
      continue;
    }

    if (/[A-Za-z_'$]/.test(char)) {
      let end = index + 1;
      while (
        end < cleanFormula.length &&
        /[A-Za-z0-9_.$!'\s]/.test(cleanFormula[end])
      ) {
        const nextChar = cleanFormula[end];
        if (["+", "-", "*", "/", "^", "%", "=", "<", ">", "(", ")", ",", ":"].includes(nextChar)) {
          break;
        }
        end += 1;
      }

      const value = cleanFormula.slice(index, end).trim();
      const withoutSheet = value.includes("!")
        ? value.split("!").at(-1) ?? value
        : value;

      if (/^\$?[A-Za-z]{1,3}\$?\d+$/.test(withoutSheet)) {
        tokens.push({ type: "cell", value });
      } else {
        tokens.push({ type: "identifier", value: value.toUpperCase() });
      }

      index = end;
      continue;
    }

    throw new Error(`Token no soportado en formula: ${char}`);
  }

  return tokens;
}

class FormulaParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly context: CalculationContext
  ) {}

  parse() {
    const value = this.parseComparison();

    if (this.peek()) {
      throw new Error(`Formula no soportada cerca de ${JSON.stringify(this.peek())}`);
    }

    return value;
  }

  private peek() {
    return this.tokens[this.index] ?? null;
  }

  private consume() {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private matchOperator(values: string[]) {
    const token = this.peek();
    if (token?.type === "operator" && values.includes(token.value)) {
      this.consume();
      return token.value;
    }

    return null;
  }

  private parseComparison(): number {
    const left = this.parseAdditive();
    const operator = this.matchOperator(["=", "<>", ">=", "<=", ">", "<"]);

    if (!operator) return left;

    const right = this.parseAdditive();
    switch (operator) {
      case "=":
        return left === right ? 1 : 0;
      case "<>":
        return left !== right ? 1 : 0;
      case ">=":
        return left >= right ? 1 : 0;
      case "<=":
        return left <= right ? 1 : 0;
      case ">":
        return left > right ? 1 : 0;
      case "<":
        return left < right ? 1 : 0;
      default:
        return 0;
    }
  }

  private parseAdditive(): number {
    let value = this.parseMultiplicative();

    while (true) {
      const operator = this.matchOperator(["+", "-"]);
      if (!operator) return value;

      const right = this.parseMultiplicative();
      value = operator === "+" ? value + right : value - right;
    }
  }

  private parseMultiplicative(): number {
    let value = this.parsePower();

    while (true) {
      const operator = this.matchOperator(["*", "/"]);
      if (!operator) return value;

      const right = this.parsePower();
      value = operator === "*" ? value * right : right === 0 ? 0 : value / right;
    }
  }

  private parsePower(): number {
    let value = this.parseUnary();

    while (true) {
      const operator = this.matchOperator(["^"]);
      if (!operator) return value;

      value = value ** this.parseUnary();
    }
  }

  private parseUnary(): number {
    const operator = this.matchOperator(["+", "-"]);
    if (!operator) return this.parsePostfix();

    const value = this.parseUnary();
    return operator === "-" ? -value : value;
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();

    while (this.matchOperator(["%"])) {
      value /= 100;
    }

    return value;
  }

  private parsePrimary(): number {
    const token = this.consume();

    if (!token) {
      throw new Error("Formula incompleta.");
    }

    if (token.type === "number") return token.value;

    if (token.type === "cell") {
      const next = this.peek();
      if (next?.type === "colon") {
        throw new Error("Rango usado fuera de una funcion.");
      }

      return getNumericCellValue(this.context, token.value);
    }

    if (token.type === "identifier") {
      const next = this.peek();
      if (next?.type !== "paren" || next.value !== "(") {
        throw new Error(`Identificador no soportado: ${token.value}`);
      }

      this.consume();
      return this.parseFunction(token.value);
    }

    if (token.type === "paren" && token.value === "(") {
      const value = this.parseComparison();
      const closing = this.consume();
      if (closing?.type !== "paren" || closing.value !== ")") {
        throw new Error("Falta parentesis de cierre.");
      }
      return value;
    }

    throw new Error(`Token no soportado: ${JSON.stringify(token)}`);
  }

  private parseFunction(name: string) {
    const args = this.parseArguments();

    switch (name) {
      case "SUM":
        return args.flat().reduce((acc, value) => acc + value, 0);
      case "MAX":
        return Math.max(...args.flat());
      case "MIN":
        return Math.min(...args.flat());
      case "ROUNDUP": {
        const [value, digits = 0] = args.flat();
        const factor = 10 ** digits;
        return Math.ceil(value * factor) / factor;
      }
      case "IF": {
        const flatArgs = args.flat();
        return flatArgs[0] ? flatArgs[1] ?? 0 : flatArgs[2] ?? 0;
      }
      case "NOW":
        return Date.now();
      default:
        throw new Error(`Funcion no soportada: ${name}`);
    }
  }

  private parseArguments(): number[][] {
    const args: number[][] = [];

    if (this.peek()?.type === "paren" && this.peek()?.value === ")") {
      this.consume();
      return args;
    }

    while (true) {
      const firstToken = this.peek();
      const secondToken = this.tokens[this.index + 1] ?? null;
      if (firstToken?.type === "cell" && secondToken?.type === "colon") {
        const consumed = this.consume();
        this.consume();
        const endToken = this.consume();
        if (endToken?.type !== "cell") {
          throw new Error("Rango con final invalido.");
        }
        args.push(
          getRangeValues(
            this.context,
            String(consumed.value),
            String(endToken.value)
          )
        );
      } else {
        args.push([this.parseComparison()]);
      }

      const next = this.peek();
      if (next?.type === "comma") {
        this.consume();
        continue;
      }

      if (next?.type === "paren" && next.value === ")") {
        this.consume();
        break;
      }

      throw new Error("Argumentos de funcion invalidos.");
    }

    return args;
  }
}

function buildWorkbookCellMap(cells: ExcelWorkbookCellValue[]) {
  return new Map(
    cells.map((cell) => [
      makeCellKey(cell.sheetName, cell.cellAddress),
      {
        valueNumber: cell.valueNumber,
        valueText: cell.valueText,
        formula: cell.formula,
      },
    ])
  );
}

function coerceNumber(value: CellValue) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getCurrentItemCellValue(
  context: CalculationContext,
  cellAddress: string
): CellValue | undefined {
  const { column, row } = splitAddress(cellAddress);
  if (row !== context.currentItem.sourceRow) return undefined;

  const input = context.currentItem.inputs.find((entry) => entry.column === column);
  if (input) {
    return context.inputValues[column] ?? context.inputValues[input.key] ?? input.defaultValue;
  }

  const formula = context.currentItem.formulas.find(
    (entry) => entry.column === column
  );
  if (formula) {
    return evaluateFormula(context, CURRENT_SHEET, cellAddress, formula.formula);
  }

  return context.currentItem.defaults[column];
}

function getNumericCellValue(context: CalculationContext, reference: string) {
  const { sheetName, cellAddress } = parseCellReference(
    reference,
    context.currentSheet
  );
  const key = makeCellKey(sheetName, cellAddress);

  if (context.memo.has(key)) return context.memo.get(key) ?? 0;

  if (context.stack.has(key)) {
    throw new Error(`Referencia circular detectada en ${key}.`);
  }

  context.stack.add(key);

  let value: CellValue | undefined;
  if (sheetName.toUpperCase() === CURRENT_SHEET) {
    value = getCurrentItemCellValue(context, cellAddress);
  }

  if (value === undefined) {
    const cell = context.workbookCells.get(key);
    if (cell?.formula) {
      value = evaluateFormula(context, sheetName, cellAddress, cell.formula);
    } else {
      value = cell?.valueNumber ?? cell?.valueText ?? null;
    }
  }

  const numeric = coerceNumber(value ?? null);
  context.memo.set(key, numeric);
  context.stack.delete(key);
  return numeric;
}

function getRangeValues(
  context: CalculationContext,
  startRef: string,
  endRef: string
) {
  const start = parseCellReference(startRef, context.currentSheet);
  const end = parseCellReference(endRef, start.sheetName);
  const startAddress = splitAddress(start.cellAddress);
  const endAddress = splitAddress(end.cellAddress);
  const values: number[] = [];

  for (
    let row = Math.min(startAddress.row, endAddress.row);
    row <= Math.max(startAddress.row, endAddress.row);
    row += 1
  ) {
    for (
      let column = Math.min(
        columnToNumber(startAddress.column),
        columnToNumber(endAddress.column)
      );
      column <=
      Math.max(columnToNumber(startAddress.column), columnToNumber(endAddress.column));
      column += 1
    ) {
      values.push(
        getNumericCellValue(context, `${start.sheetName}!${numberToColumn(column)}${row}`)
      );
    }
  }

  return values;
}

function evaluateFormula(
  context: CalculationContext,
  sheetName: string,
  cellAddress: string,
  formula: string
) {
  const previousSheet = context.currentSheet;
  context.currentSheet = sheetName;
  const key = makeCellKey(sheetName, cellAddress);

  if (context.memo.has(key)) return context.memo.get(key) ?? 0;

  const parser = new FormulaParser(tokenize(formula), context);
  const value = parser.parse();

  context.memo.set(key, value);
  context.currentSheet = previousSheet;
  return value;
}

export function calculateBudgetTemplateItem(input: {
  item: BudgetTemplateItem;
  cells: ExcelWorkbookCellValue[];
  inputValues: Record<string, number>;
}) {
  const context: CalculationContext = {
    currentSheet: CURRENT_SHEET,
    currentItem: input.item,
    inputValues: input.inputValues,
    workbookCells: buildWorkbookCellMap(input.cells),
    memo: new Map(),
    stack: new Set(),
  };

  const results: Record<string, number> = {};

  input.item.formulas.forEach((formula) => {
    results[formula.column] = evaluateFormula(
      context,
      CURRENT_SHEET,
      `${formula.column}${input.item.sourceRow}`,
      formula.formula
    );
  });

  return {
    costTotal: results.J ?? 0,
    markup: results.K ?? 0,
    sellTotal: results.L ?? 0,
    profit: results.M ?? 0,
    results,
  };
}
