type ToastType = 'error' | 'success';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (item: ToastItem) => void;

let listeners: Listener[] = [];
let nextId = 1;

function emit(message: string, type: ToastType) {
  const item: ToastItem = { id: nextId++, message, type };
  listeners.forEach((l) => l(item));
}

export const toast = {
  error: (message: string) => emit(message, 'error'),
  success: (message: string) => emit(message, 'success'),
  _subscribe: (fn: Listener) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
};
