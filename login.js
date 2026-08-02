(() => {
  const form = document.getElementById('login-form');
  const status = document.getElementById('login-status');
  const submitButton = form.querySelector('button[type="submit"]');

  function apiUrl(path) {
    const baseUrl = localStorage.getItem('simpelappi.apiBaseUrl') || '';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    status.textContent = 'Memverifikasi akun...';

    try {
      const response = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.elements.username.value.trim(),
          password: form.elements.password.value
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.errors?.[0]?.message || 'Login gagal.');
      }

      localStorage.setItem('simpelappi.accessToken', body.data.accessToken);
      localStorage.setItem('simpelappi.refreshToken', body.data.refreshToken);
      localStorage.setItem('simpelappi.user', JSON.stringify(body.data.user));
      window.location.href = 'index.html';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Login gagal.';
      submitButton.disabled = false;
    }
  });
})();
