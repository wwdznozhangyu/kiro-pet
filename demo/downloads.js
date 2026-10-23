/* Download section — resolve real .exe/.dmg assets from the latest GitHub Release.
 * Gracefully degrades: if the API is unreachable or no matching asset exists, the
 * buttons stay pointed at the Releases page (never a broken/404 download link). */
(function () {
  'use strict';

  var OWNER = 'wwdznozhangyu';
  var REPO = 'kiro-pet';
  var RELEASES_PAGE = 'https://github.com/' + OWNER + '/' + REPO + '/releases';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';

  var dlWin = document.getElementById('dlWin');
  var dlMac = document.getElementById('dlMac');
  var dlWinHint = document.getElementById('dlWinHint');
  var dlMacHint = document.getElementById('dlMacHint');
  var dlNote = document.getElementById('dlNote');

  function isWinAsset(name) {
    return /\.(exe|msi)$/i.test(name) || /win|windows|setup/i.test(name) && /\.exe$/i.test(name);
  }
  function isMacAsset(name) {
    return /\.(dmg|pkg)$/i.test(name) || /\.(app\.zip)$/i.test(name);
  }

  function setButton(a, hintEl, url, label) {
    a.href = url;
    hintEl.textContent = label;
    a.classList.add('dl-btn--ready');
  }
  function setFallback(a) {
    a.href = RELEASES_PAGE;
  }

  function sizeMB(bytes) {
    return bytes ? ' (' + (bytes / 1048576).toFixed(1) + ' MB)' : '';
  }

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rel) {
      var assets = (rel && rel.assets) || [];
      var tag = (rel && rel.tag_name) || '';
      var win = null;
      var mac = null;
      assets.forEach(function (a) {
        if (!win && isWinAsset(a.name)) win = a;
        if (!mac && isMacAsset(a.name)) mac = a;
      });

      if (win) {
        setButton(dlWin, dlWinHint, win.browser_download_url, win.name + sizeMB(win.size));
      } else {
        setFallback(dlWin);
        dlWinHint.textContent = '前往 Releases';
      }
      if (mac) {
        setButton(dlMac, dlMacHint, mac.browser_download_url, mac.name + sizeMB(mac.size));
      } else {
        setFallback(dlMac);
        dlMacHint.textContent = '前往 Releases';
      }

      if (win || mac) {
        dlNote.textContent = '最新版本：' + (tag || '未命名') + '，点击上方按钮直接下载。';
      } else {
        dlNote.innerHTML =
          '最新 Release（' + (tag || '—') +
          '）尚未上传安装包。可前往 Releases 页面查看，或从源码自行构建。';
      }
    })
    .catch(function () {
      // API blocked/offline/no release: keep buttons pointed at the Releases page.
      setFallback(dlWin);
      setFallback(dlMac);
      dlWinHint.textContent = '前往 Releases';
      dlMacHint.textContent = '前往 Releases';
      dlNote.innerHTML =
        '无法自动获取安装包信息，请前往 <a href="' + RELEASES_PAGE +
        '" target="_blank" rel="noopener">Releases 页面</a> 下载或查看构建说明。';
    });
})();
