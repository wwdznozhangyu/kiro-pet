/* Kiro Pet browser demo — eye tracking, blink, word card, TTS, pet reactions. */
(function () {
  'use strict';

  var WORDS = window.DEMO_WORDS || [];
  var EXAM_LABELS = window.EXAM_LABELS || {};
  var POS_CN = window.POS_CN || {};

  var mascot = document.getElementById('mascot');
  var pet = document.getElementById('pet');
  var petSign = document.getElementById('petSign');
  var tail = document.getElementById('tail');
  var pupilL = document.getElementById('pupilL');
  var pupilR = document.getElementById('pupilR');
  var glintL = document.getElementById('glintL');
  var glintR = document.getElementById('glintR');
  var lidL = document.getElementById('lidL');
  var lidR = document.getElementById('lidR');

  var overlay = document.getElementById('cardOverlay');
  var card = document.getElementById('card');
  var examSelect = document.getElementById('examSelect');

  var EYE = { lx: 64, rx: 96, cy: 82 };

  /* ---- Eye tracking: pupils move toward the cursor ---- */
  function onMouseMove(e) {
    var rect = mascot.getBoundingClientRect();
    var scaleX = 160 / rect.width;
    var scaleY = 170 / rect.height;
    var faceCx = rect.left + rect.width / 2;
    var faceCy = rect.top + rect.height * (84 / 170);
    var dx = (e.clientX - faceCx) * scaleX;
    var dy = (e.clientY - faceCy) * scaleY;
    var dist = Math.hypot(dx, dy) || 1;
    var max = 3.5;
    var ox = (dx / dist) * Math.min(max, dist / 20);
    var oy = (dy / dist) * Math.min(max, dist / 20);
    pupilL.setAttribute('cx', EYE.lx + ox);
    pupilL.setAttribute('cy', EYE.cy + oy);
    pupilR.setAttribute('cx', EYE.rx + ox);
    pupilR.setAttribute('cy', EYE.cy + oy);
    glintL.setAttribute('cx', EYE.lx + ox - 2);
    glintL.setAttribute('cy', EYE.cy + oy - 2);
    glintR.setAttribute('cx', EYE.rx + ox - 2);
    glintR.setAttribute('cy', EYE.cy + oy - 2);
  }
  window.addEventListener('mousemove', onMouseMove);

  /* ---- Blink ---- */
  function blink() {
    lidL.setAttribute('height', '26');
    lidR.setAttribute('height', '26');
    setTimeout(function () {
      lidL.setAttribute('height', '0');
      lidR.setAttribute('height', '0');
    }, 150);
  }
  function scheduleBlink() {
    blink();
    setTimeout(scheduleBlink, 3000 + Math.random() * 4000);
  }
  setTimeout(scheduleBlink, 2500);

  /* ---- Pet animations ---- */
  function flashClass(cls, ms) {
    mascot.classList.add(cls);
    setTimeout(function () {
      mascot.classList.remove(cls);
    }, ms);
  }
  function holdSign() {
    petSign.hidden = false;
    mascot.classList.add('mascot--bounce');
  }
  function clearSign() {
    petSign.hidden = true;
    mascot.classList.remove('mascot--bounce');
  }
  function react() {
    if (Math.random() < 0.5) {
      flashClass('mascot--nod', 900);
    } else {
      tail.classList.add('mascot__tail--wag');
      setTimeout(function () {
        tail.classList.remove('mascot__tail--wag');
      }, 900);
    }
  }

  /* ---- Word selection ---- */
  function pool() {
    var exam = examSelect.value;
    if (exam === 'ALL') return WORDS;
    var filtered = WORDS.filter(function (w) {
      return w.tags.indexOf(exam) >= 0;
    });
    return filtered.length ? filtered : WORDS;
  }
  var lastWord = null;
  function pickWord() {
    var p = pool();
    var w = p[Math.floor(Math.random() * p.length)];
    if (p.length > 1 && w === lastWord) return pickWord();
    lastWord = w;
    return w;
  }

  /* ---- Text-to-speech (Web Speech API) ---- */
  function speak(text, accent) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    var voices = window.speechSynthesis.getVoices();
    var want = accent === 'uk' ? 'en-gb' : 'en-us';
    var v =
      voices.filter(function (x) { return x.lang.toLowerCase() === want; })[0] ||
      voices.filter(function (x) { return x.lang.toLowerCase().indexOf('en') === 0; })[0];
    if (v) u.voice = v;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  /* ---- Render & show the card ---- */
  function renderCard(w) {
    document.getElementById('cardWord').textContent = w.word;

    var tags = document.getElementById('cardTags');
    tags.innerHTML = '';
    w.tags.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'card__tag';
      span.textContent = EXAM_LABELS[t] || t;
      tags.appendChild(span);
    });

    var ph = document.getElementById('cardPhonetics');
    ph.innerHTML = '';
    [['uk', '英', w.ukPhonetic], ['us', '美', w.usPhonetic]].forEach(function (p) {
      if (!p[2]) return;
      var btn = document.createElement('button');
      btn.className = 'card__ph';
      btn.innerHTML =
        '<span class="card__ph-label">' + p[1] + '</span>' +
        '<span class="card__ph-ipa">/' + p[2] + '/</span>' +
        '<span class="card__speaker">🔊</span>';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        speak(w.word, p[0]);
      });
      ph.appendChild(btn);
    });

    var ml = document.getElementById('cardMeanings');
    ml.innerHTML = '';
    w.meanings.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'card__meaning';
      li.innerHTML =
        '<span class="card__pos">' + (POS_CN[m.pos] || m.pos) + '</span>' +
        '<span class="card__def">' + m.text + '</span>';
      ml.appendChild(li);
    });

    var syn = document.getElementById('cardSyn');
    var synList = document.getElementById('cardSynList');
    synList.innerHTML = '';
    if (w.synonyms && w.synonyms.length) {
      syn.hidden = false;
      w.synonyms.forEach(function (s) {
        var chip = document.createElement('span');
        chip.className = 'card__syn-chip';
        chip.textContent = s;
        synList.appendChild(chip);
      });
    } else {
      syn.hidden = true;
    }
  }

  function openCard() {
    var w = pickWord();
    renderCard(w);
    holdSign();
    overlay.hidden = false;
    // force reflow for the entrance animation
    void card.offsetWidth;
    card.classList.add('card--in');
  }

  function closeCard() {
    card.classList.remove('card--in');
    card.classList.add('card--out');
    setTimeout(function () {
      overlay.hidden = true;
      card.classList.remove('card--out');
      clearSign();
      react();
    }, 180);
  }

  /* ---- Wiring ---- */
  document.getElementById('popBtn').addEventListener('click', openCard);
  pet.addEventListener('click', openCard);
  document.getElementById('cardClose').addEventListener('click', function (e) {
    e.stopPropagation();
    closeCard();
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeCard();
  });
  card.addEventListener('click', function (e) {
    // clicking the card body (not a speaker button) also closes, matching the app
    if (e.target.closest('.card__ph')) return;
    closeCard();
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeCard();
  });

  // Warm up voices (some browsers load them async).
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () {
      window.speechSynthesis.getVoices();
    };
  }
})();
