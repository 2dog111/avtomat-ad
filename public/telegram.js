const link = document.querySelector('.telegram');
let cancelPending = () => {};

link.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  cancelPending();
  let timer;
  const cancel = () => {
    clearTimeout(timer);
    window.removeEventListener('blur', cancel);
    window.removeEventListener('pagehide', cancel);
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const onVisibility = () => { if (document.hidden) cancel(); };
  const fallback = () => {
    cancel();
    if (!document.hidden) window.location.assign(link.href);
  };
  cancelPending = cancel;
  window.addEventListener('blur', cancel, { once: true });
  window.addEventListener('pagehide', cancel, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  timer = setTimeout(fallback, 1000);
  try {
    window.location.assign('tg://resolve?domain=avtomatad');
  } catch {
    fallback();
  }
});
