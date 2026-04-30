(function () {
  'use strict';

  // ===== Auth (localStorage) =====
  const STORAGE_USERS_KEY = 'film_dunyasi_users_v1';
  const STORAGE_SESSION_KEY = 'film_dunyasi_session_v1';
  const ADMIN_SESSION_ROLE = 'admin';
  function getApiBaseUrl() {
    try {
      var h = typeof window !== 'undefined' && window.location && window.location.hostname;
      if (!h) return 'http://localhost:5000/api';
      return 'http://' + h + ':5000/api';
    } catch (e) {
      return 'http://localhost:5000/api';
    }
  }
  var API_BASE_URL = getApiBaseUrl();

  const appView = document.getElementById('app-view');
  const authOverlay = document.getElementById('auth-overlay');
  const authCloseBtn = document.getElementById('auth-close');
  const authError = document.getElementById('auth-error');
  const authSuccess = document.getElementById('auth-success');
  const panelStatus = document.getElementById('panel-status');

  const authActions = document.getElementById('auth-actions');
  const userActions = document.getElementById('user-actions');
  const logoutBtn = document.getElementById('logout-btn');
  const profileBtn = document.getElementById('profile-btn');

  const openLoginBtn = document.getElementById('open-login');
  const openRegisterBtn = document.getElementById('open-register');

  const tabLoginBtn = document.getElementById('tab-login');
  const tabRegisterBtn = document.getElementById('tab-register');

  const loginForm = document.getElementById('login-form');
  const adminForm = document.getElementById('admin-form');
  const registerForm = document.getElementById('register-form');

  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');

  const adminEmail = document.getElementById('admin-email');
  const adminPassword = document.getElementById('admin-password');
  const openAdminLoginBtn = document.getElementById('open-admin-login');
  const openUserLoginBtn = document.getElementById('open-user-login');
  const openUserLoginBtn2 = document.getElementById('open-user-login-2');

  const registerName = document.getElementById('register-name');
  const registerEmail = document.getElementById('register-email');
  const registerPassword = document.getElementById('register-password');
  const registerConfirmPassword = document.getElementById('register-confirm-password');

  // Admin panel elements
  const adminPanel = document.getElementById('admin-panel');
  const adminRefreshBtn = document.getElementById('admin-refresh');
  const adminUsersCount = document.getElementById('admin-users-count');
  const adminMoviesCount = document.getElementById('admin-movies-count');
  const adminUsersTbody = document.getElementById('admin-users-tbody');
  const adminMoviesTbody = document.getElementById('admin-movies-tbody');
  const adminAddMovieForm = document.getElementById('admin-add-movie-form');
  const adminPanelMsg = document.getElementById('admin-panel-msg');

  const authState = {
    users: [],
    currentUser: null,
    role: 'user',
    token: null
  };

  function setAdminPanelMsg(message) {
    if (!adminPanelMsg) return;
    if (!message) {
      adminPanelMsg.hidden = true;
      adminPanelMsg.textContent = '';
      return;
    }
    adminPanelMsg.hidden = false;
    adminPanelMsg.textContent = message;
  }

  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  function createUserId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function randomSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  async function hashPassword(password, salt) {
    return sha256Hex(salt + ':' + password);
  }

  function loadUsers() {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  function loadSession() {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function persistSession(session) {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }

  function showError(message) {
    if (!authError) return;
    authError.hidden = false;
    authError.textContent = message;
  }

  function clearError() {
    if (!authError) return;
    authError.hidden = true;
    authError.textContent = '';
  }

  function showSuccess(message) {
    if (!authSuccess) return;
    authSuccess.hidden = false;
    authSuccess.textContent = message;
  }

  function clearSuccess() {
    if (!authSuccess) return;
    authSuccess.hidden = true;
    authSuccess.textContent = '';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('tr-TR');
    } catch (e) {
      return iso;
    }
  }

  function setAuthTab(tab) {
    const isLogin = tab === 'login';
    const isRegister = tab === 'register';
    const isAdmin = tab === 'admin';

    if (tabLoginBtn) tabLoginBtn.classList.toggle('active', isLogin);
    if (tabRegisterBtn) tabRegisterBtn.classList.toggle('active', isRegister);

    if (loginForm) loginForm.hidden = !isLogin;
    if (registerForm) registerForm.hidden = !isRegister;
    if (adminForm) adminForm.hidden = !isAdmin;
  }

  function switchAuthView(tab) {
    authState.currentUser = null;
    authState.role = 'user';
    if (authActions) authActions.hidden = false;
    if (userActions) userActions.hidden = true;
    if (adminPanel) adminPanel.hidden = true;

    // Ana ekranı kapat, popup'ı açık tut.
    if (appView) appView.hidden = true;
    if (authOverlay) {
      authOverlay.hidden = false;
      authOverlay.setAttribute('aria-hidden', 'false');
    }

    document.body.classList.add('auth-locked');
    setAuthTab(tab || 'login');
    clearError();
    clearSuccess();

    // Kullanıcının hemen form alanına yazabilmesi için otomatik focus.
    setTimeout(function () {
      if (tab === 'login') {
        if (loginEmail) loginEmail.focus();
      } else if (tab === 'admin') {
        if (adminEmail) adminEmail.focus();
      } else {
        if (registerName) registerName.focus();
      }
    }, 0);
  }

  function showLoggedOut(defaultTab) {
    authState.token = null;
    moviesStarted = false;
    switchAuthView(defaultTab || 'login');
  }

  function closeAuthOverlay() {
    if (authOverlay) {
      authOverlay.hidden = true;
      authOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('auth-locked');

    // Paneli kapatınca ana ekran görünsün (kayıt olmak istemeyenler için).
    if (appView) appView.hidden = false;
    startMoviesApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showLoggedIn(user, statusMessage) {
    authState.token = null;
    authState.currentUser = user;
    authState.role = 'user';
    if (authActions) authActions.hidden = true;
    if (userActions) userActions.hidden = false;
    if (appView) appView.hidden = false;
    if (adminPanel) adminPanel.hidden = true;
    if (authOverlay) {
      authOverlay.hidden = true;
      authOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('auth-locked');
    clearSuccess();

    if (panelStatus) {
      if (statusMessage) {
        panelStatus.hidden = false;
        panelStatus.textContent = statusMessage;
        window.setTimeout(function () {
          if (!panelStatus) return;
          panelStatus.hidden = true;
        }, 2200);
      } else {
        panelStatus.hidden = true;
        panelStatus.textContent = '';
      }
    }

    startMoviesApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showAdminLoggedIn(statusMessage, options) {
    const silent = options && options.silent;
    authState.role = ADMIN_SESSION_ROLE;
    if (authActions) authActions.hidden = true;
    if (userActions) userActions.hidden = false;
    if (appView) appView.hidden = false;
    if (adminPanel) adminPanel.hidden = false;
    if (authOverlay) {
      authOverlay.hidden = true;
      authOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('auth-locked');
    clearSuccess();
    setAdminPanelMsg('');
    if (panelStatus) {
      if (statusMessage && !silent) {
        panelStatus.hidden = false;
        panelStatus.textContent = statusMessage;
        window.setTimeout(function () {
          if (!panelStatus) return;
          panelStatus.hidden = true;
        }, 2200);
      } else {
        panelStatus.hidden = true;
        panelStatus.textContent = '';
      }
    }
    startMoviesApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function renderAdminPanel() {
    if (authState.role !== ADMIN_SESSION_ROLE || !authState.token) return;

    try {
      const headers = { Authorization: 'Bearer ' + authState.token };
      const dashRes = await fetch(API_BASE_URL + '/admin/dashboard', { headers: headers });
      if (dashRes.status === 401) {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('login');
        showError('Oturum suresi doldu veya yetki yok. Admin olarak tekrar girin.');
        return;
      }
      const usersRes = await fetch(API_BASE_URL + '/admin/users', { headers: headers });
      if (usersRes.status === 401) {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('login');
        showError('Oturum suresi doldu veya yetki yok. Admin olarak tekrar girin.');
        return;
      }

      let stats = null;
      if (dashRes.ok) {
        const dash = await dashRes.json();
        stats = dash && dash.stats ? dash.stats : null;
      }
      if (stats && adminUsersCount) adminUsersCount.textContent = String(stats.users);
      if (stats && adminMoviesCount) adminMoviesCount.textContent = String(stats.movies);

      let dbUsers = [];
      if (usersRes.ok) {
        const ud = await usersRes.json();
        dbUsers = Array.isArray(ud.users) ? ud.users : [];
      }

      if (!dashRes.ok && adminMoviesCount && allMovies.length) {
        adminMoviesCount.textContent = String(allMovies.length);
      }

      if (adminUsersTbody) {
        adminUsersTbody.innerHTML = '';
        dbUsers.forEach(function (u) {
          var uid = u._id != null ? String(u._id) : '';
          var isAdminUser = u.role === 'admin';
          var btn = '';
          if (!isAdminUser && uid) {
            btn = '<button type="button" class="auth-btn admin-danger" data-delete-db-user="' + escapeHtml(uid) + '">Sil</button>';
          } else if (isAdminUser) {
            btn = '<span style="color:var(--text-muted);font-size:0.85rem;">Admin</span>';
          }
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + escapeHtml(u.name || '—') + '</td>' +
            '<td>' + escapeHtml(u.email || '—') + '</td>' +
            '<td>' + escapeHtml(formatDate(u.createdAt)) + '</td>' +
            '<td style="text-align:right;">' + btn + '</td>';
          adminUsersTbody.appendChild(tr);
        });
      }

      if (adminMoviesTbody) {
        adminMoviesTbody.innerHTML = '';
        (allMovies || []).forEach(function (m) {
          var mid = getMovieIdValue(m);
          var rating = m.vote_average != null && m.vote_average > 0 ? m.vote_average.toFixed(1) : '—';
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + escapeHtml(m.title || '—') + '</td>' +
            '<td>' + escapeHtml(m.category || '—') + '</td>' +
            '<td>' + escapeHtml(m.release_date || '—') + '</td>' +
            '<td>' + escapeHtml(rating) + '</td>' +
            '<td style="text-align:right;">' +
              '<button type="button" class="auth-btn admin-danger" data-delete-movie="' + escapeHtml(mid) + '">Sil</button>' +
            '</td>';
          adminMoviesTbody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error(err);
      if (adminMoviesCount && allMovies.length) {
        adminMoviesCount.textContent = String(allMovies.length);
      }
    }
  }

  // ===== Profile modal =====
  const profileModal = document.getElementById('profile-modal');
  const profileBackdrop = document.getElementById('profile-backdrop');
  const profileClose = document.getElementById('profile-close');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileCreatedAt = document.getElementById('profile-created-at');
  const profileId = document.getElementById('profile-id');

  function fillProfile(user) {
    if (!user) return;
    if (profileName) profileName.textContent = user.name || '—';
    if (profileEmail) profileEmail.textContent = user.email || '—';
    if (profileCreatedAt) profileCreatedAt.textContent = formatDate(user.createdAt);
    if (profileId) profileId.textContent = user.id != null ? String(user.id) : '—';
  }

  function openProfile() {
    if (!profileModal) return;
    fillProfile(authState.currentUser);
    profileModal.setAttribute('aria-hidden', 'false');
  }

  function closeProfile() {
    if (!profileModal) return;
    profileModal.setAttribute('aria-hidden', 'true');
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearError();

    const name = (registerName && registerName.value || '').trim();
    const email = normalizeEmail(registerEmail && registerEmail.value);
    const password = registerPassword && registerPassword.value;
    const confirm = registerConfirmPassword && registerConfirmPassword.value;

    if (!name || !email || !password || !confirm) {
      showError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirm) {
      showError('Şifreler eşleşmiyor.');
      return;
    }

    const users = authState.users;
    if (users.some(function (u) { return u.email === email; })) {
      showError('Bu e-posta ile zaten kayıtlı bir kullanıcı var.');
      return;
    }

    try {
      if (!crypto || !crypto.subtle) {
        showError('Bu tarayıcıda şifreleme desteklenmiyor.');
        return;
      }

      const salt = randomSalt();
      const passwordHash = await hashPassword(password, salt);

      const user = {
        id: createUserId(),
        name: name,
        email: email,
        salt: salt,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };

      users.push(user);
      saveUsers(users);

      // Kayıttan sonra otomatik giriş yapma; giriş ekranını göster.
      if (loginEmail) loginEmail.value = email;
      if (loginPassword) loginPassword.value = '';

      showLoggedOut('login');
    } catch (err) {
      // crypto.subtle bazı tarayıcılarda sadece secure context'te çalışır.
      const msg = err && err.message ? err.message : 'Şifre işlenirken hata oluştu.';
      showError(msg);
      console.error(err);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearError();
    clearSuccess();

    const email = normalizeEmail(loginEmail && loginEmail.value);
    const password = loginPassword && loginPassword.value;

    if (!email || !password) {
      showError('E-posta ve şifre zorunludur.');
      return;
    }

    const users = authState.users;
    const user = users.find(function (u) { return u.email === email; });
    if (!user) {
      showError('Kayıtlı kullanıcı bulunamadı. Önce kayıt olun.');
      return;
    }

    try {
      if (!crypto || !crypto.subtle) {
        showError('Bu tarayıcıda şifreleme desteklenmiyor.');
        return;
      }

      const candidateHash = await hashPassword(password, user.salt);
      if (candidateHash !== user.passwordHash) {
        showError('E-posta veya şifre hatalı.');
        return;
      }

      persistSession({ userId: user.id, role: 'user' });
      // Hemen ana ekrana geç.
      showLoggedIn(user, 'Giriş başarılı! Hoş geldin.');
    } catch (err) {
      const msg = err && err.message ? err.message : 'Giriş işlemi sırasında hata oluştu.';
      showError(msg);
      console.error(err);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    clearError();
    clearSuccess();

    const email = normalizeEmail(adminEmail && adminEmail.value);
    const password = adminPassword && adminPassword.value;

    if (!email || !password) {
      showError('Admin e-posta ve sifre zorunludur.');
      return;
    }

    try {
      const res = await fetch(API_BASE_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        showError(data.message || 'Admin girisi basarisiz.');
        return;
      }
      if (!data.user || data.user.role !== 'admin') {
        showError('Bu hesap admin yetkisine sahip degil. Veritabaninda admin olusturdugunuz hesapla girin.');
        return;
      }
      authState.token = data.token;
      authState.currentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        createdAt: data.user.createdAt
      };
      persistSession({
        role: ADMIN_SESSION_ROLE,
        token: data.token,
        adminUser: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt
        }
      });
      showAdminLoggedIn('Admin girisi basarili.');
    } catch (err) {
      var msg = err && err.message ? err.message : 'Sunucuya baglanilamadi (backend kapali mi?).';
      showError(msg);
      console.error(err);
    }
  }

  async function handleAdminAddMovie(e) {
    e.preventDefault();
    if (authState.role !== ADMIN_SESSION_ROLE || !authState.token) return;
    setAdminPanelMsg('');
    var titleEl = document.getElementById('admin-movie-title');
    var catEl = document.getElementById('admin-movie-category');
    var relEl = document.getElementById('admin-movie-release');
    var rateEl = document.getElementById('admin-movie-rating');
    var runEl = document.getElementById('admin-movie-runtime');
    var postEl = document.getElementById('admin-movie-poster');
    var overEl = document.getElementById('admin-movie-overview');
    var watchEl = document.getElementById('admin-movie-watch');
    var videoUrlEl = document.getElementById('admin-movie-video');

    var title = (titleEl && titleEl.value || '').trim();
    if (!title) {
      setAdminPanelMsg('Baslik zorunlu.');
      return;
    }

    var payload = {
      title: title,
      category: catEl && catEl.value ? catEl.value : 'popular',
      release_date: relEl && relEl.value ? String(relEl.value).trim() : '',
      overview: overEl && overEl.value ? String(overEl.value).trim() : '',
      poster: postEl && postEl.value ? String(postEl.value).trim() : ''
    };
    if (watchEl && watchEl.value && String(watchEl.value).trim())
      payload.watch_url = String(watchEl.value).trim();
    if (videoUrlEl && videoUrlEl.value && String(videoUrlEl.value).trim())
      payload.videoUrl = String(videoUrlEl.value).trim();
    if (rateEl && rateEl.value !== '') {
      var rv = parseFloat(rateEl.value, 10);
      if (!isNaN(rv)) payload.vote_average = rv;
    }
    if (runEl && runEl.value !== '') {
      var ru = parseInt(runEl.value, 10);
      if (!isNaN(ru)) payload.runtime = ru;
    }

    try {
      var res = await fetch(API_BASE_URL + '/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authState.token
        },
        body: JSON.stringify(payload)
      });
      var out = await res.json().catch(function () {
        return {};
      });
      if (res.status === 401) {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('login');
        showError('Oturum suresi doldu. Tekrar admin girisi yapin.');
        return;
      }
      if (!res.ok) {
        setAdminPanelMsg(out.message || 'Film eklenemedi.');
        return;
      }
      if (adminAddMovieForm) adminAddMovieForm.reset();
      setAdminPanelMsg('Film veritabanina eklendi.');
      await loadDb();
      await renderAdminPanel();
      var activeBtn = document.querySelector('.nav-link.active');
      loadList(activeBtn && activeBtn.dataset.filter ? activeBtn.dataset.filter : 'popular');
    } catch (err) {
      setAdminPanelMsg(err && err.message ? err.message : 'Baglanti hatasi.');
      console.error(err);
    }
  }

  async function handleAdminMovieRowClick(ev) {
    var delBtn = ev.target && ev.target.closest ? ev.target.closest('button[data-delete-movie]') : null;
    if (!delBtn) return;
    var movieIdStr = delBtn.getAttribute('data-delete-movie');
    if (!movieIdStr || !authState.token) return;
    if (!window.confirm('Bu filmi veritabanindan silmek istediginize emin misiniz?')) return;
    try {
      var res = await fetch(API_BASE_URL + '/admin/movies/' + encodeURIComponent(movieIdStr), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authState.token }
      });
      if (res.status === 401) {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('login');
        showError('Oturum suresi doldu.');
        return;
      }
      var out = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        setAdminPanelMsg(out.message || 'Film silinemedi.');
        return;
      }
      setAdminPanelMsg('Film veritabanindan silindi.');
      await loadDb();
      await renderAdminPanel();
      var activeBtn2 = document.querySelector('.nav-link.active');
      loadList(activeBtn2 && activeBtn2.dataset.filter ? activeBtn2.dataset.filter : 'popular');
    } catch (err) {
      setAdminPanelMsg(err && err.message ? err.message : 'Baglanti hatasi.');
      console.error(err);
    }
  }

  async function handleAdminUserRowClick(ev) {
    var delBtn = ev.target && ev.target.closest ? ev.target.closest('button[data-delete-db-user]') : null;
    if (!delBtn) return;
    var userIdStr = delBtn.getAttribute('data-delete-db-user');
    if (!userIdStr || !authState.token) return;
    if (!window.confirm('Bu kullaniciyi veritabanindan silmek istediginize emin misiniz?')) return;
    try {
      var res = await fetch(API_BASE_URL + '/admin/users/' + encodeURIComponent(userIdStr), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authState.token }
      });
      if (res.status === 401) {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('login');
        showError('Oturum suresi doldu.');
        return;
      }
      var out = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        setAdminPanelMsg(out.message || 'Kullanici silinemedi.');
        return;
      }
      await renderAdminPanel();
    } catch (err) {
      setAdminPanelMsg(err && err.message ? err.message : 'Baglanti hatasi.');
      console.error(err);
    }
  }

  function bindAuthEvents() {
    // Header butonları sadece form ekranını değiştirir; popup açık kalır.
    if (openLoginBtn) openLoginBtn.addEventListener('click', function () { switchAuthView('login'); });
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', function () { switchAuthView('register'); });

    if (tabLoginBtn) tabLoginBtn.addEventListener('click', function () { setAuthTab('login'); clearError(); });
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', function () { setAuthTab('register'); clearError(); });

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (adminForm) adminForm.addEventListener('submit', handleAdminLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        authState.token = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('register');
      });
    }

    if (profileBtn) {
      profileBtn.addEventListener('click', function () {
        if (!authState.currentUser) return;
        openProfile();
      });
    }

    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', function () {
        closeAuthOverlay();
      });
    }

    if (openAdminLoginBtn) openAdminLoginBtn.addEventListener('click', function () { switchAuthView('admin'); });
    if (openUserLoginBtn) openUserLoginBtn.addEventListener('click', function () { switchAuthView('login'); });
    if (openUserLoginBtn2) openUserLoginBtn2.addEventListener('click', function () { switchAuthView('login'); });

    if (adminRefreshBtn) {
      adminRefreshBtn.addEventListener('click', function () {
        renderAdminPanel();
      });
    }

    if (adminAddMovieForm) {
      adminAddMovieForm.addEventListener('submit', handleAdminAddMovie);
    }

    if (adminMoviesTbody) {
      adminMoviesTbody.addEventListener('click', handleAdminMovieRowClick);
    }

    if (adminUsersTbody) {
      adminUsersTbody.addEventListener('click', handleAdminUserRowClick);
    }
  }

  function initAuth() {
    authState.users = loadUsers();
    const session = loadSession();
    if (session && session.role === ADMIN_SESSION_ROLE) {
      if (!session.token) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        showLoggedOut('register');
        return false;
      }
      authState.token = session.token;
      authState.role = ADMIN_SESSION_ROLE;
      if (session.adminUser) {
        authState.currentUser = {
          id: session.adminUser.id,
          name: session.adminUser.name,
          email: session.adminUser.email,
          createdAt: session.adminUser.createdAt
        };
      } else {
        authState.currentUser = {
          id: '',
          name: 'Admin',
          email: ''
        };
      }
      showAdminLoggedIn(null, { silent: true });
      return true;
    }

    const userId = session && session.userId;
    const user = userId ? authState.users.find(function (u) { return u.id === userId; }) : null;
    if (user) {
      showLoggedIn(user);
      return true;
    }
    // İlk açılışta kayıt ekranı gelsin.
    showLoggedOut('register');
    return false;
  }

  bindAuthEvents();

  const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/500x750/1a1a1a/666?text=Poster+yok';

  const grid = document.getElementById('movies-grid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const sectionTitle = document.getElementById('section-title');
  const searchInput = document.querySelector('.search-input');
  const navLinks = document.querySelectorAll('.nav-link');
  const TITLES = {
    popular: 'Popüler Filmler',
    top_rated: 'En İyi Filmler',
    upcoming: 'Yakında',
    search: 'Arama Sonuçları'
  };

  let allMovies = [];
  let moviesStarted = false;

  async function loadDb() {
    const res = await fetch(API_BASE_URL + '/movies');
    if (!res.ok) throw new Error('Filmler backend API uzerinden yuklenemedi.');
    const data = await res.json();
    allMovies = Array.isArray(data.movies) ? data.movies : [];
    return allMovies;
  }

  function getMoviesByFilter(filter) {
    if (!allMovies.length) return [];
    if (filter === 'popular' || filter === 'top_rated' || filter === 'upcoming') {
      return allMovies.filter(function (m) { return m.category === filter; });
    }
    return allMovies;
  }

  function searchMoviesInDb(query) {
    const q = query.trim().toLowerCase();
    if (!q) return getMoviesByFilter('popular');
    return allMovies.filter(function (m) {
      return (m.title && m.title.toLowerCase().includes(q)) ||
             (m.overview && m.overview.toLowerCase().includes(q));
    });
  }

  function getMovieIdValue(movie) {
    if (!movie) return '';
    return String(movie._id || movie.id || '');
  }

  function renderMovies(movies) {
    grid.innerHTML = '';
    if (!movies.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    movies.forEach(function (movie) {
      const card = document.createElement('a');
      card.className = 'movie-card';
      const movieId = getMovieIdValue(movie);
      card.href = movieId ? 'film-detay.html?id=' + encodeURIComponent(movieId) : '#';
      card.dataset.id = movieId;
      const poster =
        movie && movie.poster && String(movie.poster).trim()
          ? String(movie.poster).trim()
          : IMAGE_PLACEHOLDER;
      const title = movie.title || 'İsimsiz';
      const date = movie.release_date || '—';
      const rating = movie.vote_average != null && movie.vote_average > 0
        ? movie.vote_average.toFixed(1) : '—';
      card.innerHTML =
        '<img class="movie-card-poster" src="' + poster + '" alt="' + escapeHtml(title) + '" loading="lazy">' +
        '<div class="movie-card-info">' +
          '<h3 class="movie-card-title">' + escapeHtml(title) + '</h3>' +
          '<div class="movie-card-meta">' +
            '<span class="movie-card-rating">★ ' + rating + '</span>' +
            '<span>' + date + '</span>' +
          '</div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function loadList(filter) {
    grid.innerHTML = '';
    emptyState.hidden = true;
    loading.classList.remove('hidden');
    sectionTitle.textContent = TITLES[filter] || TITLES.popular;

    setTimeout(function () {
      const list = getMoviesByFilter(filter);
      loading.classList.add('hidden');
      renderMovies(list);
    }, 300);
  }

  function doSearch(query) {
    grid.innerHTML = '';
    emptyState.hidden = true;
    loading.classList.remove('hidden');
    sectionTitle.textContent = TITLES.search;

    setTimeout(function () {
      const list = searchMoviesInDb(query);
      loading.classList.add('hidden');
      renderMovies(list);
    }, 200);
  }

  navLinks.forEach(function (btn) {
    btn.addEventListener('click', function () {
      navLinks.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      searchInput.value = '';
      loadList(btn.dataset.filter);
    });
  });

  let searchTimeout;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    searchTimeout = setTimeout(function () {
      if (q) doSearch(q);
      else loadList(document.querySelector('.nav-link.active').dataset.filter);
    }, 350);
  });

  if (profileBackdrop) profileBackdrop.addEventListener('click', closeProfile);
  if (profileClose) profileClose.addEventListener('click', closeProfile);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && profileModal && profileModal.getAttribute('aria-hidden') === 'false') closeProfile();
  });

  function startMoviesApp() {
    if (moviesStarted) return;
    moviesStarted = true;
    loadDb().then(async function () {
      if (authState.role === ADMIN_SESSION_ROLE) {
        await renderAdminPanel();
      }
      loadList('popular');
    }).catch(function (err) {
      moviesStarted = false;
      showError(err && err.message ? err.message : 'Filmler yuklenemedi.');
    });
  }

  initAuth();
})();
