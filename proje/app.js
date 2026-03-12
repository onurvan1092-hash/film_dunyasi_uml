(function () {
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  loadDb().then(function () {
    loadList('popular');
  });
})();
