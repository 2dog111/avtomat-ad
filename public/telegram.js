const link = document.querySelector('.telegram');
link.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  let timer;
  const cancel = () => {
    clearTimeout(timer);
    window.removeEventListener('blur', cancel);
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const onVisibility = () => { if (document.hidden) cancel(); };
  window.addEventListener('blur', cancel, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  timer = setTimeout(() => {
    cancel();
    if (!document.hidden) window.location.assign(link.href);
  }, 1000);
  window.location.assign('tg://resolve?domain=avtomatad');
});
