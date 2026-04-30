(function () {
  'use strict';

  function getApiBaseUrl() {
    try {
      var h = window.location && window.location.hostname;
      if (!h) return 'http://localhost:5000/api';
      return 'http://' + h + ':5000/api';
    } catch (e) {
      return 'http://localhost:5000/api';
    }
  }

  var API_BASE_URL = getApiBaseUrl();
  const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/500x750/1a1a1a/666?text=Poster+yok';
  const STORAGE_SESSION_KEY = 'film_dunyasi_session_v1';
  /** Yerleşik oynatıcı için üst süre saniye */
  var MAX_PLAYBACK_SEC = 20 * 60;
  var selectedRating = 0;
  var currentMovie = null;

  function readIdFromLocation() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('id');
    if (raw === null || raw === '') return '';
    try {
      return decodeURIComponent(String(raw)).trim();
    } catch (e2) {
      return String(raw).trim();
    }
  }

  function sameMovieId(a, b) {
    var sa = String(a != null ? a : '').trim().toLowerCase();
    var sb = String(b != null ? b : '').trim().toLowerCase();
    return sa.length > 0 && sa === sb;
  }

  const loadingEl = document.getElementById('detail-loading');
  const errorEl = document.getElementById('detail-error');
  const contentEl = document.getElementById('detail-content');

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  const idFromUrl = readIdFromLocation();

  function showLoading(done) {
    if (!loadingEl) return;
    if (done) {
      loadingEl.classList.add('hidden');
    } else {
      loadingEl.classList.remove('hidden');
    }
  }

  function showError(message) {
    showLoading(true);
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
    if (contentEl) contentEl.hidden = true;
  }

  function categoryLabel(cat) {
    if (cat === 'top_rated') return 'En İyi';
    if (cat === 'upcoming') return 'Yakında';
    if (cat === 'popular') return 'Popüler';
    return cat || '—';
  }

  function embedSrcFromWatchUrl(raw) {
    if (!raw) return '';
    var w = String(raw).trim();
    if (!w) return '';
    try {
      var u = new URL(w, window.location.href);
      var host = u.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        var yid = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
        if (yid && /^[a-zA-Z0-9_-]{6,}$/.test(yid)) {
          return 'https://www.youtube.com/embed/' + yid + '?rel=0';
        }
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'www.youtube.com') {
        if (u.pathname.indexOf('/embed/') === 0) {
          var eid = u.pathname.slice('/embed/'.length).split(/[/?#]/)[0];
          if (eid && /^[a-zA-Z0-9_-]{6,}$/.test(eid)) {
            return 'https://www.youtube.com/embed/' + eid + '?rel=0';
          }
        }
        if (u.pathname.indexOf('/shorts/') === 0) {
          var sid = u.pathname.split('/shorts/')[1].split(/[/?#]/)[0];
          if (sid && /^[a-zA-Z0-9_-]{6,}$/.test(sid)) {
            return 'https://www.youtube.com/embed/' + sid + '?rel=0';
          }
        }
        var vid = u.searchParams.get('v');
        if (vid && /^[a-zA-Z0-9_-]{6,}$/.test(vid)) {
          return 'https://www.youtube.com/embed/' + vid + '?rel=0';
        }
      }

      if (host === 'vimeo.com') {
        var seg = u.pathname.split('/').filter(Boolean);
        var vmId = seg[0];
        if (vmId && /^\d+$/.test(vmId)) {
          return 'https://player.vimeo.com/video/' + vmId;
        }
      }
    } catch (e1) {}
    return '';
  }

  function safeExternalHttpsUrl(raw) {
    try {
      var u = new URL(String(raw).trim(), window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch (e2) {
      return '';
    }
  }

  /** Mongo/stream video doğrudan adresi (camelCase ile uyum) */
  function getMovieStreamUrl(movie) {
    if (!movie) return '';
    var cand =
      movie.videoUrl != null
        ? movie.videoUrl
        : movie.video_url != null
          ? movie.video_url
          : '';
    var s = String(cand).trim();
    if (!s) return '';
    try {
      var u = new URL(s, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch (eUrl) {
      return '';
    }
  }

  function buildPlayControlsHtml(show) {
    if (!show) return '';
    return (
      '<div class="detail-play-row">' +
      '<button type="button" class="detail-play-btn" data-detail-play>Oynat</button>' +
      '<span class="detail-play-meta">Tam ekran · en fazla 20 dk</span>' +
      '</div>'
    );
  }

  function getActiveSession() {
    try {
      var raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function buildRatingSectionHtml(movie) {
    var currentAverage =
      movie && movie.vote_average != null && movie.vote_average > 0
        ? movie.vote_average.toFixed(1)
        : '0.0';
    var voteCount = Number(movie && movie.ratingCount ? movie.ratingCount : 0);
    var stars = '';
    for (var i = 1; i <= 5; i += 1) {
      stars +=
        '<button type="button" class="detail-rate-star" data-rate-star="' +
        i +
        '" aria-label="' +
        i +
        ' yildiz ver">★</button>';
    }
    return (
      '<section class="detail-rate-block">' +
      '<h2 class="detail-overview-heading">Puanla</h2>' +
      '<p class="detail-rate-summary">Ortalama: <strong data-rating-average>' +
      escapeHtml(currentAverage) +
      '</strong> · Oy: <span data-rating-count>' +
      escapeHtml(String(voteCount)) +
      '</span></p>' +
      '<div class="detail-rate-stars" role="group" aria-label="Film puani sec">' +
      stars +
      '</div>' +
      '<button type="button" class="detail-rate-submit" data-rate-submit disabled>Puanı Gönder</button>' +
      '<p class="detail-rate-msg" data-rate-msg hidden></p>' +
      '</section>'
    );
  }

  function paintStars(value) {
    if (!contentEl) return;
    var stars = contentEl.querySelectorAll('.detail-rate-star');
    stars.forEach(function (btn) {
      var n = Number(btn.getAttribute('data-rate-star'));
      btn.classList.toggle('is-active', n <= value);
    });
  }

  function setRateMessage(msg, isError) {
    if (!contentEl) return;
    var msgEl = contentEl.querySelector('[data-rate-msg]');
    if (!msgEl) return;
    if (!msg) {
      msgEl.hidden = true;
      msgEl.textContent = '';
      msgEl.classList.remove('error');
      return;
    }
    msgEl.hidden = false;
    msgEl.textContent = msg;
    msgEl.classList.toggle('error', Boolean(isError));
  }

  async function submitRating() {
    if (!currentMovie) return;
    if (selectedRating < 1 || selectedRating > 5) {
      setRateMessage('Lutfen 1-5 arasi bir puan secin.', true);
      return;
    }
    var session = getActiveSession();
    var hasUser = session && (session.userId || session.role === 'admin');
    if (!hasUser) {
      setRateMessage('Puan vermek icin once giris yapmalisiniz.', true);
      return;
    }

    var submitBtn = contentEl && contentEl.querySelector('[data-rate-submit]');
    if (submitBtn) submitBtn.disabled = true;
    setRateMessage('Puan kaydediliyor...', false);

    try {
      var idValue = String(currentMovie._id || currentMovie.id || '').trim();
      var res = await fetch(
        API_BASE_URL + '/movies/' + encodeURIComponent(idValue) + '/rate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: selectedRating })
        }
      );
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !data.movie) {
        setRateMessage(data.message || 'Puan gonderilemedi.', true);
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      currentMovie = data.movie;
      var avgEl = contentEl.querySelector('[data-rating-average]');
      var countEl = contentEl.querySelector('[data-rating-count]');
      if (avgEl) avgEl.textContent = Number(currentMovie.vote_average || 0).toFixed(1);
      if (countEl) countEl.textContent = String(currentMovie.ratingCount || 0);
      setRateMessage('Puaniniz kaydedildi. Tesekkurler!', false);
      if (submitBtn) submitBtn.disabled = false;
    } catch (err) {
      setRateMessage('Sunucuya baglanilamadi. Backend acik mi?', true);
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function bindRatingEvents() {
    if (!contentEl) return;
    var starButtons = contentEl.querySelectorAll('.detail-rate-star');
    var submitBtn = contentEl.querySelector('[data-rate-submit]');
    if (!starButtons.length || !submitBtn) return;

    starButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextValue = Number(btn.getAttribute('data-rate-star'));
        selectedRating = nextValue;
        paintStars(selectedRating);
        submitBtn.disabled = selectedRating < 1;
        setRateMessage('', false);
      });
    });

    submitBtn.addEventListener('click', submitRating);
  }

  function exitDocumentFullscreen() {
    var ex =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.webkitCancelFullScreen ||
      document.msExitFullscreen ||
      document.mozCancelFullScreen;
    try {
      if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) ex.call(document);
    } catch (eFs) {}
  }

  /** MP4/stream URL — tam ekran + süre üst limiti */
  function openFullscreenFilmPlayer(videoUrl, titleLine) {
    var overlay = document.createElement('div');
    overlay.className = 'detail-fs-player-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML =
      '<div class="detail-fs-player-inner">' +
      '<button type="button" class="detail-fs-player-close" aria-label="Videoyu kapat">&times;</button>' +
      '<div class="detail-fs-player-stage">' +
      '<video class="detail-fs-player-video" controls playsinline preload="metadata">' +
      '</video></div>' +
      '</div>';

    var video = overlay.querySelector('video');

    video.setAttribute('title', titleLine || 'Video');

    var closed = false;
    var documentFsActive = false;

    function cleanup() {
      if (closed) return;
      closed = true;
      exitDocumentFullscreen();
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('seeked', onSeeked);
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('fullscreenchange', onDocumentFsChange);
      document.removeEventListener('webkitfullscreenchange', onDocumentFsChange);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
    }

    function onEsc(ev) {
      if (ev.key === 'Escape') cleanup();
    }

    function onDocumentFsChange() {
      if (closed) return;
      if (!documentFsActive) return;
      var fs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement;
      if (!fs) cleanup();
    }

    function clampTime() {
      if (video.currentTime >= MAX_PLAYBACK_SEC) {
        video.pause();
        if (video.currentTime > MAX_PLAYBACK_SEC)
          video.currentTime = MAX_PLAYBACK_SEC;
      }
    }

    function onTimeUpdate() {
      clampTime();
    }

    function onSeeked() {
      if (video.currentTime > MAX_PLAYBACK_SEC) video.currentTime = MAX_PLAYBACK_SEC;
    }

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('seeked', onSeeked);

    overlay.querySelector('.detail-fs-player-close').addEventListener('click', cleanup);
    document.addEventListener('keydown', onEsc);

    video.src = videoUrl;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.addEventListener('fullscreenchange', onDocumentFsChange);
    document.addEventListener('webkitfullscreenchange', onDocumentFsChange);

    var ua = navigator.userAgent || '';
    var likelyIosVideo =
      /^iPad|^iPod|^iPhone/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function tryDocumentFullscreenOverlay() {
      var req =
        overlay.requestFullscreen ||
        overlay.webkitRequestFullscreen ||
        overlay.msRequestFullscreen;
      if (!req) return Promise.resolve(null);
      return Promise.resolve(req.call(overlay)).then(function () {
        documentFsActive = true;
      });
    }

    var pp = video.play();
    function startPlaybackAndFs() {
      if (likelyIosVideo && typeof video.webkitEnterFullscreen === 'function') {
        try {
          video.webkitEnterFullscreen();
        } catch (eWf) {}
        return;
      }
      tryDocumentFullscreenOverlay().catch(function () {});
    }

    if (pp !== undefined && typeof pp.then === 'function') {
      pp.then(function () {
        startPlaybackAndFs();
      }).catch(function () {
        startPlaybackAndFs();
      });
    } else {
      startPlaybackAndFs();
    }
  }

  /** watch_url dolu ise HTML parçası; boş ise '' */
  function buildWatchSection(movie, titleLine) {
    var raw =
      movie && movie.watch_url != null ? String(movie.watch_url).trim() : '';
    if (!raw) return '';

    var embed = embedSrcFromWatchUrl(raw);
    if (embed) {
      return (
        '<section class="detail-watch-block">' +
        '<h2 class="detail-overview-heading">İzle</h2>' +
        '<div class="detail-video-wrap">' +
        '<iframe class="detail-video-iframe"' +
          ' src="' +
          escapeHtml(embed) +
          '"' +
          ' title="' +
          escapeHtml(titleLine || 'Video') +
          '"' +
          ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
          ' allowfullscreen' +
          ' loading="lazy"' +
          ' referrerpolicy="strict-origin-when-cross-origin"' +
          '></iframe></div>' +
        '</section>'
      );
    }

    var ext = safeExternalHttpsUrl(raw);
    if (!ext) return '';

    return (
      '<section class="detail-watch-block">' +
      '<h2 class="detail-overview-heading">İzle</h2>' +
      '<p class="detail-watch-hint">Video bu sayfa yerine bağlantıda açılacaktır.</p>' +
      '<a class="detail-watch-external-btn" href="' +
      escapeHtml(ext) +
      '" target="_blank" rel="noopener noreferrer">İzlemek için bağlantıyı aç</a>' +
      '</section>'
    );
  }

  function renderMovie(movie) {
    currentMovie = movie;
    selectedRating = 0;
    var poster =
      movie && movie.poster && String(movie.poster).trim()
        ? String(movie.poster).trim()
        : IMAGE_PLACEHOLDER;
    var title = movie.title || 'İsimsiz';
    var date = movie.release_date || '';
    var runtime = movie.runtime ? movie.runtime + ' dk' : '';
    var rating =
      movie.vote_average != null && movie.vote_average > 0
        ? movie.vote_average.toFixed(1)
        : '';

    document.title = title + ' | Film Dünyası';

    var catText = escapeHtml(categoryLabel(movie.category));

    var chips = [];
    if (rating) {
      chips.push(
        '<span class="detail-chip detail-chip-accent"><span class="detail-chip-star">★</span>' +
          escapeHtml(rating) +
          '</span>'
      );
    }
    if (date) chips.push('<span class="detail-chip">' + escapeHtml(date) + '</span>');
    if (runtime) chips.push('<span class="detail-chip">' + escapeHtml(runtime) + '</span>');
    var chipsHtml = chips.length
      ? '<div class="detail-chips">' + chips.join('') + '</div>'
      : '';

    var streamUrl = getMovieStreamUrl(movie);
    var playRowHtml = buildPlayControlsHtml(Boolean(streamUrl));
    var watchSectionHtml = buildWatchSection(movie, title);
    var rateSectionHtml = buildRatingSectionHtml(movie);

    if (contentEl) {
      contentEl.innerHTML =
        '<div class="detail-shell">' +
          '<div class="detail-hero" aria-hidden="true">' +
            '<img class="detail-bg-photo" src="" alt="">' +
            '<div class="detail-hero-mask"></div>' +
          '</div>' +
          '<div class="detail-body">' +
            '<div class="detail-grid">' +
              '<aside class="detail-aside">' +
                '<figure class="detail-poster-frame">' +
                  '<img class="detail-poster-photo" src="" alt="' + escapeHtml(title) + '" loading="eager" decoding="async">' +
                '</figure>' +
              '</aside>' +
              '<div class="detail-copy">' +
                '<span class="detail-category-tag">' +
                  catText +
                '</span>' +
                '<h1 class="detail-heading">' +
                  escapeHtml(title) +
                '</h1>' +
                chipsHtml +
                playRowHtml +
                '<section class="detail-overview-block">' +
                  '<h2 class="detail-overview-heading">Özet</h2>' +
                  '<p class="detail-overview-text">' +
                    escapeHtml(movie.overview || 'Özet bulunamadı.') +
                  '</p>' +
                '</section>' +
                rateSectionHtml +
                watchSectionHtml +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      contentEl.querySelectorAll('.detail-bg-photo, .detail-poster-photo').forEach(function (img) {
        img.src = poster;
      });

      var playBtn = streamUrl ? contentEl.querySelector('[data-detail-play]') : null;
      if (playBtn && streamUrl) {
        playBtn.addEventListener('click', function () {
          openFullscreenFilmPlayer(streamUrl, title);
        });
      }

      bindRatingEvents();

      contentEl.hidden = false;
    }
    showLoading(true);
    if (errorEl) errorEl.hidden = true;
  }

  async function findMovieViaList(movieIdStr) {
    var res = await fetch(API_BASE_URL + '/movies?limit=200');
    if (!res.ok) return null;
    var data = await res.json().catch(function () {
      return {};
    });
    var list = Array.isArray(data.movies) ? data.movies : [];
    var match = list.find(function (m) {
      return sameMovieId(movieIdStr, m && (m._id || m.id));
    });
    return match || null;
  }

  async function load() {
    if (!idFromUrl) {
      showError('Geçerli bir film seçilmedi.');
      return;
    }

    showLoading(false);
    if (errorEl) errorEl.hidden = true;
    if (contentEl) contentEl.hidden = true;

    try {
      var detailUrl =
        API_BASE_URL + '/movies/' + encodeURIComponent(idFromUrl);
      var res = await fetch(detailUrl);

      if (res.ok) {
        var data = await res.json().catch(function () {
          return null;
        });
        if (data && data.movie) {
          renderMovie(data.movie);
          return;
        }
      }

      var found = await findMovieViaList(idFromUrl);
      if (found) {
        renderMovie(found);
        return;
      }

      if (res.status === 404) {
        showError('Film bulunamadı. Ana sayfadan tekrar seçin veya veritabanını güncelleyin (npm run seed).');
        return;
      }
      if (res.status === 400) {
        var errBody = await res.json().catch(function () {
          return {};
        });
        showError(errBody.message || 'Geçersiz film kimliği.');
        return;
      }
      if (!res.ok) {
        showError('Film bilgileri alınamadı (HTTP ' + res.status + ').');
        return;
      }

      showError('Film verisi beklenenden farklı.');
    } catch (err) {
      showError(
        err && err.message
          ? err.message
          : 'Sunucuya bağlanılamadı. Backend (port 5000) açık mı?'
      );
    }
  }

  load();
})();
