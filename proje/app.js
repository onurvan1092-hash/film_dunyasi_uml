(function () {
  'use strict';

  // ===== Auth (localStorage) =====
  const STORAGE_USERS_KEY = 'film_dunyasi_users_v1';
  const STORAGE_SESSION_KEY = 'film_dunyasi_session_v1';
  const ADMIN_SESSION_ROLE = 'admin';
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = '1234';

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

  const adminUsername = document.getElementById('admin-username');
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

  const authState = {
    users: [],
    currentUser: null,
    role: 'user'
  };

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
      } else {
        if (registerName) registerName.focus();
      }
    }, 0);
  }

  function showLoggedOut(defaultTab) {
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

  function showAdminLoggedIn(statusMessage) {
    authState.currentUser = { id: 'admin', name: 'Admin', email: 'admin' };
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
    renderAdminPanel();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAdminPanel() {
    if (authState.role !== ADMIN_SESSION_ROLE) return;
    authState.users = loadUsers();
    if (adminUsersCount) adminUsersCount.textContent = String(authState.users.length);
    if (adminMoviesCount) adminMoviesCount.textContent = String(allMovies.length || 0);

    if (adminUsersTbody) {
      adminUsersTbody.innerHTML = '';
      authState.users.forEach(function (u) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(u.name || '—') + '</td>' +
          '<td>' + escapeHtml(u.email || '—') + '</td>' +
          '<td>' + escapeHtml(formatDate(u.createdAt)) + '</td>' +
          '<td style="text-align:right;">' +
            '<button type="button" class="auth-btn admin-danger" data-admin-action="delete-user" data-user-id="' + escapeHtml(u.id) + '">Sil</button>' +
          '</td>';
        adminUsersTbody.appendChild(tr);
      });
    }

    if (adminMoviesTbody) {
      adminMoviesTbody.innerHTML = '';
      (allMovies || []).slice(0, 60).forEach(function (m) {
        const tr = document.createElement('tr');
        const rating = m.vote_average != null && m.vote_average > 0 ? m.vote_average.toFixed(1) : '—';
        tr.innerHTML =
          '<td>' + escapeHtml(m.title || '—') + '</td>' +
          '<td>' + escapeHtml(m.category || '—') + '</td>' +
          '<td>' + escapeHtml(m.release_date || '—') + '</td>' +
          '<td>' + escapeHtml(rating) + '</td>';
        adminMoviesTbody.appendChild(tr);
      });
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
    if (profileId) profileId.textContent = user.id || '—';
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

  function handleAdminLogin(e) {
    e.preventDefault();
    clearError();
    clearSuccess();

    const u = (adminUsername && adminUsername.value || '').trim();
    const p = adminPassword && adminPassword.value;

    if (!u || !p) {
      showError('Admin kullanıcı adı ve şifre zorunludur.');
      return;
    }

    if (u !== ADMIN_USERNAME || p !== ADMIN_PASSWORD) {
      showError('Admin bilgileri hatalı.');
      return;
    }

    persistSession({ role: ADMIN_SESSION_ROLE });
    showAdminLoggedIn('Admin girişi başarılı.');
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

    if (adminRefreshBtn) adminRefreshBtn.addEventListener('click', renderAdminPanel);

    if (adminUsersTbody) {
      adminUsersTbody.addEventListener('click', function (ev) {
        const btn = ev.target && ev.target.closest ? ev.target.closest('button[data-admin-action]') : null;
        if (!btn) return;
        const action = btn.getAttribute('data-admin-action');
        if (action !== 'delete-user') return;
        const userId = btn.getAttribute('data-user-id');
        if (!userId) return;
        const users = loadUsers().filter(function (u) { return u.id !== userId; });
        saveUsers(users);
        authState.users = users;
        renderAdminPanel();
      });
    }
  }

  function initAuth() {
    authState.users = loadUsers();
    const session = loadSession();
    if (session && session.role === ADMIN_SESSION_ROLE) {
      showAdminLoggedIn();
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
  const modal = document.getElementById('movie-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');

  const TITLES = {
    popular: 'Popüler Filmler',
    top_rated: 'En İyi Filmler',
    upcoming: 'Yakında',
    search: 'Arama Sonuçları'
  };

  let allMovies = [];

  var FALLBACK_MOVIES = [{"id":1,"title":"Esaretin Bedeli","release_date":"1994","vote_average":9.3,"overview":"Masum olduğu halde hapse düşen bir bankacı, cezaevinde hayata tutunmayı ve umudu kaybetmemeyi öğrenir.","poster":"https://picsum.photos/seed/m1/500/750","runtime":142,"category":"top_rated"},{"id":2,"title":"Baba","release_date":"1972","vote_average":9.2,"overview":"New York'lu mafya ailesinin lideri Don Corleone'nin iktidar ve aile arasındaki dengede verdiği mücadele.","poster":"https://picsum.photos/seed/m2/500/750","runtime":175,"category":"top_rated"},{"id":3,"title":"Kara Şövalye","release_date":"2008","vote_average":9.0,"overview":"Batman, Joker'in Gotham'ı kaosa sürüklemesini engellemek için son bir mücadeleye girişir.","poster":"https://picsum.photos/seed/m3/500/750","runtime":152,"category":"popular"},{"id":4,"title":"12 Öfkeli Adam","release_date":"1957","vote_average":8.9,"overview":"Jüri odasında tek bir jüri üyesi, diğerlerini masum bir sanığı yeniden değerlendirmeye ikna eder.","poster":"https://picsum.photos/seed/m4/500/750","runtime":96,"category":"top_rated"},{"id":5,"title":"Forrest Gump","release_date":"1994","vote_average":8.8,"overview":"Düşük IQ'lu Forrest Gump, Amerikan tarihinin önemli anlarına tanıklık ederek hayat hikayesini anlatır.","poster":"https://picsum.photos/seed/m5/500/750","runtime":142,"category":"popular"},{"id":6,"title":"Başlangıç","release_date":"2010","vote_average":8.7,"overview":"Rüyalara girip fikir çalabilen bir hırsız, imkansız görünen bir görev için ekibini toplar.","poster":"https://picsum.photos/seed/m6/500/750","runtime":148,"category":"popular"},{"id":7,"title":"Dövüş Kulübü","release_date":"1999","vote_average":8.6,"overview":"Uykusuzluk çeken bir ofis çalışanı, sabun satıcısı Tyler Durden ile tanışır ve hayatı değişir.","poster":"https://picsum.photos/seed/m7/500/750","runtime":139,"category":"popular"},{"id":8,"title":"Yüzüklerin Efendisi: Kralın Dönüşü","release_date":"2003","vote_average":8.9,"overview":"Frodo ve Sam son bir hamleyle Yüzük'ü yok etmeye giderken, Gondor'da büyük savaş başlar.","poster":"https://picsum.photos/seed/m8/500/750","runtime":201,"category":"popular"},{"id":9,"title":"Piyanist","release_date":"2002","vote_average":8.5,"overview":"II. Dünya Savaşı'nda Varşova gettosunda hayatta kalmaya çalışan Yahudi bir piyanistin hikayesi.","poster":"https://picsum.photos/seed/m9/500/750","runtime":150,"category":"top_rated"},{"id":10,"title":"Yeşil Yol","release_date":"1999","vote_average":8.6,"overview":"Death Row gardiyanı ile idam mahkumu arasında gelişen sıra dışı dostluk ve mucize hikayesi.","poster":"https://picsum.photos/seed/m10/500/750","runtime":189,"category":"top_rated"},{"id":11,"title":"Yıldızlararası","release_date":"2014","vote_average":8.6,"overview":"Dünya çökerken bir grup kaşif, insanlığın kurtuluşu için uzayda yeni bir yuva arar.","poster":"https://picsum.photos/seed/m11/500/750","runtime":169,"category":"popular"},{"id":12,"title":"Matrix","release_date":"1999","vote_average":8.7,"overview":"Bilgisayar korsanı Neo, gerçek dünyanın aslında bir simülasyon olduğunu keşfeder.","poster":"https://picsum.photos/seed/m12/500/750","runtime":136,"category":"popular"},{"id":13,"title":"Yedinci Mühür","release_date":"1957","vote_average":8.2,"overview":"Haçlı seferinden dönen bir şövalye, Ölüm ile satranç oynayarak hayatı sorgular.","poster":"https://picsum.photos/seed/m13/500/750","runtime":96,"category":"top_rated"},{"id":14,"title":"Parazit","release_date":"2019","vote_average":8.5,"overview":"Yoksul bir aile, zengin bir ailenin evine sızarak hayatlarını değiştirmeye çalışır.","poster":"https://picsum.photos/seed/m14/500/750","runtime":132,"category":"popular"},{"id":15,"title":"Joker","release_date":"2019","vote_average":8.4,"overview":"Başarısız bir komedyen, toplum tarafından dışlanınca karanlık bir dönüşüm geçirir.","poster":"https://picsum.photos/seed/m15/500/750","runtime":122,"category":"popular"},{"id":16,"title":"Uzay Yolu: Yeni Nesil","release_date":"2025","vote_average":0,"overview":"Uzay Yolu evreninde yeni nesil maceralar. Keşif ve diplomasi yolculuğu devam ediyor.","poster":"https://picsum.photos/seed/m16/500/750","runtime":0,"category":"upcoming"},{"id":17,"title":"Avatar: Suyun Yolu","release_date":"2025","vote_average":0,"overview":"Pandora'da Jake Sully ve ailesi yeni tehditlerle karşılaşır. Su kabileleriyle ittifak kurulur.","poster":"https://picsum.photos/seed/m17/500/750","runtime":0,"category":"upcoming"},{"id":18,"title":"Süpermen: Yeni Gün","release_date":"2025","vote_average":0,"overview":"DC evreninde Süpermen'in yeni bir yorumu. Kahramanlık ve kimlik temaları işleniyor.","poster":"https://picsum.photos/seed/m18/500/750","runtime":0,"category":"upcoming"},{"id":19,"title":"Karayip Korsanları: Yeni Serüven","release_date":"2025","vote_average":0,"overview":"Denizlerde yeni bir efsane. Korsanlar, hazineler ve unutulmaz maceralar geri dönüyor.","poster":"https://picsum.photos/seed/m19/500/750","runtime":0,"category":"upcoming"},{"id":20,"title":"Mission: Impossible 9","release_date":"2025","vote_average":0,"overview":"Ethan Hunt ve ekibi bu sefer dünyayı tehdit eden en tehlikeli düşmanla yüzleşecek.","poster":"https://picsum.photos/seed/m20/500/750","runtime":0,"category":"upcoming"}];

  async function loadDb() {
    try {
      const res = await fetch('db.json');
      if (!res.ok) throw new Error('Veri yüklenemedi');
      const data = await res.json();
      allMovies = data.movies || [];
      return allMovies;
    } catch (e) {
      allMovies = FALLBACK_MOVIES.slice();
      return allMovies;
    }
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

  function getMovieById(id) {
    return allMovies.find(function (m) { return m.id === parseInt(id, 10); });
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
      card.href = '#';
      card.dataset.id = movie.id;
      const poster = movie.poster || IMAGE_PLACEHOLDER;
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
      card.addEventListener('click', function (e) {
        e.preventDefault();
        openDetail(movie.id);
      });
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

  function openDetail(id) {
    const movie = getMovieById(id);
    if (!movie) return;
    modal.setAttribute('aria-hidden', 'false');
    const poster = movie.poster || IMAGE_PLACEHOLDER;
    const date = movie.release_date || '';
    const runtime = movie.runtime ? movie.runtime + ' dk' : '';
    const meta = [date, runtime].filter(Boolean).join(' · ');
    modalBody.innerHTML =
      '<div class="movie-detail">' +
        '<img class="movie-detail-poster" src="' + poster + '" alt="">' +
        '<div class="movie-detail-info">' +
          '<h3>' + escapeHtml(movie.title) + '</h3>' +
          '<p class="movie-detail-meta">' + (meta || '—') + '</p>' +
          '<p class="movie-detail-overview">' + escapeHtml(movie.overview || 'Özet bulunamadı.') + '</p>' +
        '</div>' +
      '</div>';
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
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

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);

  if (profileBackdrop) profileBackdrop.addEventListener('click', closeProfile);
  if (profileClose) profileClose.addEventListener('click', closeProfile);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
    if (e.key === 'Escape' && profileModal && profileModal.getAttribute('aria-hidden') === 'false') closeProfile();
  });

  let moviesStarted = false;
  function startMoviesApp() {
    if (moviesStarted) return;
    moviesStarted = true;
    loadDb().then(function () {
      if (authState.role === ADMIN_SESSION_ROLE) renderAdminPanel();
      loadList('popular');
    });
  }

  initAuth();
})();
