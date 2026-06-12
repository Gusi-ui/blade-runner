import type { CommandRegistry, CommandSpec } from './registry';

export interface ParsedCommand {
  spec: CommandSpec;
  args: string[];
  raw: string;
}

/**
 * Resuelve una línea de entrada contra el registro.
 * Primero intenta el match de la línea completa (preserva alias multi-palabra
 * como 'imagen nasa' y los atajos numéricos); si no, separa comando + argumentos.
 */
export const parseInput = (input: string, registry: CommandRegistry): ParsedCommand | null => {
  const raw = input.trim().replace(/\s+/g, ' ');
  if (!raw) return null;

  const fullMatch = registry.resolveToken(raw);
  if (fullMatch) return { spec: fullMatch, args: [], raw };

  const [first, ...rest] = raw.split(' ');
  const spec = registry.resolveToken(first);
  if (!spec) return null;

  if (spec.restOfLine) {
    const restRaw = raw.slice(first.length).trim();
    return { spec, args: restRaw ? [restRaw] : [], raw };
  }

  return { spec, args: rest.map(arg => arg.toLowerCase()), raw };
};
