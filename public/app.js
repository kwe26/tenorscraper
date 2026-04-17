const $ = (id) => document.getElementById(id);

const samples = {
  curl: `curl "https://randomscrapapi.kwe26.tech/search?q=onk&page=1"
curl "https://randomscrapapi.kwe26.tech/view?url=https%3A%2F%2Ftenor.com%2Fview%2Fwell-done-done-okay-okay-saumensaha-ok-baby-gif-17342975178417556997"`,
  javascript: `const search = await fetch('https://randomscrapapi.kwe26.tech/search?q=onk&page=1');
console.log(await search.json());

const view = await fetch(
  'https://randomscrapapi.kwe26.tech/view?url=' + encodeURIComponent('https://tenor.com/view/well-done-done-okay-okay-saumensaha-ok-baby-gif-17342975178417556997')
);
console.log(await view.json());`,
  python: `import requests

search = requests.get('https://randomscrapapi.kwe26.tech/search', params={'q': 'onk', 'page': 1})
print(search.json())

view = requests.get('https://randomscrapapi.kwe26.tech/view', params={
  'url': 'https://tenor.com/view/well-done-done-okay-okay-saumensaha-ok-baby-gif-17342975178417556997'
})
print(view.json())`,
  php: `$search = file_get_contents('https://randomscrapapi.kwe26.tech/search?q=onk&page=1');
echo $search;

$url = urlencode('https://tenor.com/view/well-done-done-okay-okay-saumensaha-ok-baby-gif-17342975178417556997');
$view = file_get_contents('https://randomscrapapi.kwe26.tech/view?url=' . $url);
echo $view;`
};

const languages = [
  { key: 'curl', label: 'cURL' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
  { key: 'php', label: 'PHP' }
];

let activeLang = 'curl';

function pretty(json) {
  return JSON.stringify(json, null, 2);
}

function setOutput(el, value) {
  el.textContent = value;
}

async function runSearch() {
  const query = $('searchQuery').value.trim();
  const page = Number($('searchPage').value || 1);
  if (!query || page < 1) {
    setOutput($('searchOutput'), 'Provide query and page >= 1');
    return;
  }

  setOutput($('searchOutput'), 'Loading...');

  try {
    const response = await fetch(`/search?q=${encodeURIComponent(query)}&page=${page}`);
    const data = await response.json();
    setOutput(
      $('searchOutput'),
      pretty({
        status: response.status,
        cache: response.headers.get('x-cache'),
        data
      })
    );
  } catch (error) {
    setOutput($('searchOutput'), error.message || 'Request failed');
  }
}

async function runView() {
  const url = $('viewUrl').value.trim();
  if (!url) {
    setOutput($('viewOutput'), 'Provide a Tenor view URL');
    return;
  }

  setOutput($('viewOutput'), 'Loading...');

  try {
    const response = await fetch(`/view?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    setOutput(
      $('viewOutput'),
      pretty({
        status: response.status,
        cache: response.headers.get('x-cache'),
        data
      })
    );
  } catch (error) {
    setOutput($('viewOutput'), error.message || 'Request failed');
  }
}

async function runCacheStats() {
  setOutput($('cacheOutput'), 'Loading...');
  try {
    const response = await fetch('/cache/stats');
    const data = await response.json();
    setOutput($('cacheOutput'), pretty(data));
  } catch (error) {
    setOutput($('cacheOutput'), error.message || 'Request failed');
  }
}

function renderLangTabs() {
  const container = $('langTabs');
  container.innerHTML = '';

  for (const lang of languages) {
    const btn = document.createElement('button');
    btn.className = `lang-btn ${lang.key === activeLang ? 'lang-btn-active' : ''}`;
    btn.textContent = lang.label;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      activeLang = lang.key;
      renderLangTabs();
      setOutput($('codeOutput'), samples[activeLang]);
    });
    container.appendChild(btn);
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(samples[activeLang]);
    $('copyCodeBtn').textContent = 'Copied';
    window.setTimeout(() => {
      $('copyCodeBtn').textContent = 'Copy Sample';
    }, 1000);
  } catch (error) {
    $('copyCodeBtn').textContent = 'Clipboard blocked';
    window.setTimeout(() => {
      $('copyCodeBtn').textContent = 'Copy Sample';
    }, 1200);
  }
}

function init() {
  $('searchBtn').addEventListener('click', runSearch);
  $('viewBtn').addEventListener('click', runView);
  $('cacheBtn').addEventListener('click', runCacheStats);
  $('copyCodeBtn').addEventListener('click', copyCode);

  renderLangTabs();
  setOutput($('codeOutput'), samples[activeLang]);
  runSearch();
  runView();
  runCacheStats();
}

init();
