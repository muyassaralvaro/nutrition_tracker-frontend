export function highlightInvalid(form: HTMLFormElement, notify: () => void) {
  form.dataset.attempted = "true";
  if (form.dataset.invalidToast) return;
  form.dataset.invalidToast = "true";
  notify();
  setTimeout(() => { delete form.dataset.invalidToast; }, 0);
}
