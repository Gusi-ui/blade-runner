const STORAGE_KEY = 'nexus-history';
const MAX_ENTRIES = 100;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const defaultStorage = (): StorageLike | null =>
  typeof localStorage === 'undefined' ? null : localStorage;

export class CommandHistory {
  private entries: string[] = [];
  private index = 0;
  private storage: StorageLike | null;

  constructor(storage: StorageLike | null = defaultStorage()) {
    this.storage = storage;
    this.load();
  }

  private load(): void {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        this.entries = parsed.filter((e): e is string => typeof e === 'string');
      }
    } catch {
      this.entries = [];
    }
    this.index = this.entries.length;
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // almacenamiento lleno o deshabilitado: el historial sigue en memoria
    }
  }

  add(command: string): void {
    const trimmed = command.trim();
    if (trimmed && trimmed !== this.entries[this.entries.length - 1]) {
      this.entries.push(trimmed);
      if (this.entries.length > MAX_ENTRIES) {
        this.entries = this.entries.slice(-MAX_ENTRIES);
      }
      this.save();
    }
    this.index = this.entries.length;
  }

  /** Navega hacia atrás (ArrowUp). Devuelve null si no hay más entradas. */
  prev(): string | null {
    if (this.index <= 0) return null;
    this.index--;
    return this.entries[this.index];
  }

  /** Navega hacia delante (ArrowDown). Devuelve '' al pasar la última entrada. */
  next(): string | null {
    if (this.index >= this.entries.length) return null;
    this.index++;
    return this.index === this.entries.length ? '' : this.entries[this.index];
  }

  resetNavigation(): void {
    this.index = this.entries.length;
  }

  list(): string[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.index = 0;
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // sin almacenamiento disponible
    }
  }
}
