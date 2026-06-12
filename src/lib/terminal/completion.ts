import type { CommandRegistry } from './registry';

export interface CompletionOption {
  /** Línea de entrada completa resultante ('news ai'). */
  value: string;
  description: string;
}

export interface CompletionResult {
  options: CompletionOption[];
  /** Prefijo común de todas las opciones (línea completa). */
  commonPrefix: string;
}

const EMPTY: CompletionResult = { options: [], commonPrefix: '' };

const longestCommonPrefix = (values: string[]): string => {
  if (values.length === 0) return '';
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
};

export const getCompletions = (input: string, registry: CommandRegistry): CompletionResult => {
  const trimmed = input.trimStart().toLowerCase();
  if (!trimmed) return EMPTY;

  const completingArg = /\s/.test(trimmed);

  if (!completingArg) {
    const options = registry
      .visibleTokens()
      .filter(token => token.startsWith(trimmed))
      .map(token => ({
        value: token,
        description: registry.resolveToken(token)?.description ?? '',
      }));
    return { options, commonPrefix: longestCommonPrefix(options.map(o => o.value)) };
  }

  const [first, partialArg = '', ...extra] = trimmed.split(/\s+/);
  const spec = registry.resolveToken(first);
  if (!spec || !spec.choices || spec.restOfLine || extra.length > 0) return EMPTY;

  const options = spec.choices
    .filter(choice => choice.startsWith(partialArg))
    .map(choice => ({ value: `${first} ${choice}`, description: spec.description }));
  return { options, commonPrefix: longestCommonPrefix(options.map(o => o.value)) };
};
