(function () {
  'use strict';
  // Once per tab session. Returning from login/reloading must not add another wait.
  var key = 'fi-entry-splash-v1';
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (_) {}
  if (!document.body || document.getElementById('fiEntrySplash')) return;
  var cover = document.createElement('div');
  cover.id = 'fiEntrySplash'; cover.className = 'fi-entry-splash';
  cover.setAttribute('aria-hidden', 'true');
  cover.innerHTML = '<div class="fi-entry-brand"><svg class="fi-entry-mark" viewBox="0 0 200 172" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle class="fi-sun" cx="139" cy="36" r="14" fill="#dfbb71"/><g class="fi-island"><ellipse cx="100" cy="144" rx="65" ry="8" fill="#739f9622"/><path d="M35 101 100 80 165 101 140 129 102 144 63 127Z" fill="#91b3a0"/><path d="M35 101 100 117 102 144 63 127Z" fill="#608e7a"/><path d="M100 117 165 101 140 129 102 144Z" fill="#467660"/><path d="M35 101 64 83 104 76 144 86 165 101 100 118Z" fill="#c1d5a6"/><path d="M60 61Q81 54 100 66Q119 54 140 61V100Q119 93 100 106Q81 93 60 100Z" fill="#fffdf1" stroke="#386854" stroke-width="3" stroke-linejoin="round"/><path d="M100 67V105M69 72Q81 69 92 74M69 81Q81 78 92 83M108 74Q119 69 131 72M108 83Q119 78 131 81" fill="none" stroke="#88a88d" stroke-width="2" stroke-linecap="round"/><path d="M100 61V42M100 51Q83 51 83 36Q98 35 100 51M100 46Q102 30 118 30Q118 45 100 46" fill="#608d65" stroke="#386854" stroke-width="2" stroke-linejoin="round"/></g></svg><h1 class="fi-entry-title">File Island</h1><p class="fi-entry-subtitle">STUDY</p><div class="fi-entry-rule"></div></div>';
  // Fixed text slots avoid layout shifts while each letter is written in.
  var letterIndex = 0;
  function lettering(text, className) {
    return '<span class="' + className + '">' + text.split('').map(function (letter) {
      return '<span class="fi-entry-letter" style="--letter:' + letterIndex++ + '">' + letter + '</span>';
    }).join('') + '</span>';
  }
  cover.querySelector('.fi-entry-title').innerHTML = lettering('FILE', 'fi-word-file') + ' ' + lettering('ISLAND', 'fi-word-island');
  cover.querySelector('.fi-entry-subtitle').innerHTML = lettering('STUDY', 'fi-word-study');
  document.body.appendChild(cover);
  function dismiss() { cover.remove(); document.removeEventListener('focusin', dismiss); document.removeEventListener('keydown', dismiss); }
  // A separate CSS timeout also makes this non-blocking if subsequent JS fails.
  setTimeout(dismiss, 2000);
  document.addEventListener('focusin', dismiss, { once: true });
  document.addEventListener('keydown', dismiss, { once: true });
}());
