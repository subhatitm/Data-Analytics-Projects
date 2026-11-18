// Resolve the palette before the stylesheet paints, including on bookmarked routes.
(() => {
  const key = 'analystpath.theme.v1';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  let picker;

  function apply(value) {
    preference = value === 'light' || value === 'dark' ? value : 'system';
    const dark = preference === 'dark' || (preference === 'system' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#15201b' : '#fbfcf9';
    if (picker) picker.value = preference;
  }

  try {
    apply(localStorage.getItem(key));
  } catch {
    apply('system');
  }

  system.addEventListener('change', () => {
    if (preference === 'system') apply('system');
  });
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && (event.key === key || event.key === null)) {
      apply(localStorage.getItem(key));
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    picker = document.getElementById('theme-preference');
    picker.value = preference;
    picker.addEventListener('change', () => {
      apply(picker.value);
      try {
        localStorage.setItem(key, preference);
      } catch {
        toast('Theme applied for this visit. Browser storage is unavailable.');
      }
    });
  });
})();
