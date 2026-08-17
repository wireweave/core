import { defineConfig } from 'vitepress'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import type { LanguageRegistration } from 'shiki'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load custom wireframe language definition for Shiki
const wireframeLang = JSON.parse(
  readFileSync(resolve(__dirname, 'wireframe.tmLanguage.generated.json'), 'utf-8'),
) as LanguageRegistration

export default defineConfig({
  title: 'Wireweave',
  description: 'AI-powered wireframe generation with a simple DSL',
  cleanUrls: true,
  sitemap: {
    hostname: 'https://docs.wireweave.org',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Wireweave Docs' }],
    ['meta', { property: 'og:image', content: 'https://docs.wireweave.org/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://docs.wireweave.org' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://docs.wireweave.org/og-image.png' }],
    // JSON-LD Structured Data - WebSite
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Wireweave Documentation',
        url: 'https://docs.wireweave.org',
        description: 'Official documentation for Wireweave - a DSL for creating wireframes',
        inLanguage: ['en', 'ko', 'ja'],
        publisher: {
          '@type': 'Organization',
          name: 'Wireweave',
          url: 'https://wireweave.org',
        },
      }),
    ],
    // GA4 Measurement ID for Docs stream (Property: Wireweave, ID: 521202767)
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-0EC63VCF4R' }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-0EC63VCF4R');
// Set site name for cross-domain tracking
gtag('set', { 'site_name': 'docs' });

// Analytics Event Tracking for Docs
function trackEvent(name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, params);
  }
}

// Track docs entry on page load
(function() {
  var params = new URLSearchParams(window.location.search);
  var source = params.get('utm_source') || (document.referrer.includes('wireweave.org/dashboard') ? 'dashboard' :
               document.referrer.includes('wireweave.org') ? 'landing' : 'direct');
  var medium = params.get('utm_medium') || 'organic';
  var campaign = params.get('utm_campaign') || 'none';

  trackEvent('docs_enter', {
    entry_source: source,
    entry_medium: medium,
    entry_campaign: campaign,
    referrer: document.referrer || 'direct',
    landing_page: window.location.pathname,
    locale: window.location.pathname.match(/^\\/(ko|ja)\\//)?.[1] || 'en'
  });
})();

document.addEventListener('DOMContentLoaded', function() {
  // Search Usage Tracking
  const searchInput = document.querySelector('.DocSearch-Button');
  if (searchInput) {
    searchInput.addEventListener('click', function() {
      trackEvent('docs_search_open', { page_path: window.location.pathname });
    });
  }

  // Scroll Depth Tracking
  const thresholds = [25, 50, 75, 100];
  const tracked = new Set();
  let timeout = null;

  function trackScroll() {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);
      thresholds.forEach(function(t) {
        if (percent >= t && !tracked.has(t)) {
          tracked.add(t);
          trackEvent('scroll_' + t, { depth_percentage: t, page_path: window.location.pathname });
        }
      });
    }, 100);
  }
  window.addEventListener('scroll', trackScroll, { passive: true });

  // TOC (Table of Contents) Click Tracking
  document.querySelectorAll('.VPDocOutlineItem a').forEach(function(el) {
    el.addEventListener('click', function() {
      trackEvent('toc_click', {
        section: el.textContent?.trim().slice(0, 50) || 'unknown',
        page_path: window.location.pathname
      });
    });
  });

  // External Link Tracking
  document.querySelectorAll('a[href^="http"]').forEach(function(el) {
    var href = el.getAttribute('href') || '';
    if (href.includes('wireweave.org') || href.includes('docs.wireweave.org')) return;
    el.addEventListener('click', function() {
      trackEvent('external_link_click', {
        link_url: href,
        link_text: el.textContent?.trim().slice(0, 50) || 'unknown'
      });
    });
  });

  // Sidebar Navigation Tracking
  document.querySelectorAll('.VPSidebarItem a').forEach(function(el) {
    el.addEventListener('click', function() {
      trackEvent('sidebar_nav_click', {
        nav_item: el.textContent?.trim() || 'unknown',
        destination: el.getAttribute('href') || 'unknown'
      });
    });
  });

  // Language Switch Tracking
  document.querySelectorAll('.VPNavBarMenuLink').forEach(function(el) {
    var href = el.getAttribute('href') || '';
    if (href.match(/^\\/(ko|ja)\\//)) {
      el.addEventListener('click', function() {
        var locale = href.match(/^\\/(ko|ja)\\//)?.[1] || 'unknown';
        trackEvent('language_switch', {
          target_locale: locale,
          source_page: window.location.pathname
        });
      });
    }
  });

  // Code Copy Button Tracking
  document.querySelectorAll('.vp-code-copy').forEach(function(el) {
    el.addEventListener('click', function() {
      trackEvent('code_copy', { page_path: window.location.pathname });
    });
  });

  // CTA Link Tracking (Dashboard links)
  document.querySelectorAll('a[href*="wireweave.org"]').forEach(function(el) {
    el.addEventListener('click', function() {
      var href = el.getAttribute('href') || '';
      trackEvent('cta_click', {
        cta_name: 'dashboard',
        cta_location: 'docs',
        destination: href,
        source_page: window.location.pathname
      });
    });
  });
});`,
    ],
  ],

  markdown: {
    languages: [wireframeLang],
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      link: '/ko/',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/getting-started' },
          { text: '레퍼런스', link: '/ko/reference/grammar' },
          { text: '대시보드', link: 'https://wireweave.org/dashboard' },
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '소개',
              items: [
                { text: 'Wireweave란?', link: '/ko/guide/what-is-wireweave' },
                { text: '시작하기', link: '/ko/guide/getting-started' },
              ],
            },
            {
              text: '핵심 개념',
              items: [
                { text: '페이지', link: '/ko/guide/pages' },
                { text: '컴포넌트', link: '/ko/guide/components' },
                { text: '레이아웃', link: '/ko/guide/layouts' },
                { text: '스타일링', link: '/ko/guide/styling' },
                { text: '어노테이션', link: '/ko/guide/annotation' },
              ],
            },
            {
              text: '연동',
              items: [
                { text: 'CLI', link: '/ko/guide/cli' },
                { text: 'Claude Code 플러그인', link: '/ko/guide/claude-code-plugin' },
                { text: 'MCP 서버', link: '/ko/guide/mcp-server' },
                { text: 'VS Code 확장', link: '/ko/guide/vscode-extension' },
                { text: '마크다운 플러그인', link: '/ko/guide/markdown-plugin' },
              ],
            },
          ],
          '/ko/mcp/': [
            {
              text: 'MCP 클라이언트 설정',
              items: [
                { text: '개요', link: '/ko/mcp/' },
                { text: 'Claude Desktop', link: '/ko/mcp/claude-desktop' },
                { text: 'Cursor', link: '/ko/mcp/cursor' },
                { text: 'VS Code', link: '/ko/mcp/vscode' },
              ],
            },
          ],
          '/ko/reference/': [
            {
              text: '레퍼런스',
              items: [
                { text: '문법', link: '/ko/reference/grammar' },
                { text: '컴포넌트', link: '/ko/reference/components' },
                { text: 'API', link: '/ko/reference/api' },
              ],
            },
          ],
        },
        outline: {
          level: [2, 3],
          label: '목차',
        },
      },
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
      themeConfig: {
        nav: [
          { text: 'ガイド', link: '/ja/guide/getting-started' },
          { text: 'リファレンス', link: '/ja/reference/grammar' },
          { text: 'ダッシュボード', link: 'https://wireweave.org/dashboard' },
        ],
        sidebar: {
          '/ja/guide/': [
            {
              text: 'はじめに',
              items: [
                { text: 'Wireweaveとは？', link: '/ja/guide/what-is-wireweave' },
                { text: 'はじめる', link: '/ja/guide/getting-started' },
              ],
            },
            {
              text: 'コアコンセプト',
              items: [
                { text: 'ページ', link: '/ja/guide/pages' },
                { text: 'コンポーネント', link: '/ja/guide/components' },
                { text: 'レイアウト', link: '/ja/guide/layouts' },
                { text: 'スタイリング', link: '/ja/guide/styling' },
                { text: 'アノテーション', link: '/ja/guide/annotation' },
              ],
            },
            {
              text: '連携',
              items: [
                { text: 'CLI', link: '/ja/guide/cli' },
                { text: 'Claude Code プラグイン', link: '/ja/guide/claude-code-plugin' },
                { text: 'MCPサーバー', link: '/ja/guide/mcp-server' },
                { text: 'VS Code拡張', link: '/ja/guide/vscode-extension' },
                { text: 'Markdownプラグイン', link: '/ja/guide/markdown-plugin' },
              ],
            },
          ],
          '/ja/mcp/': [
            {
              text: 'MCPクライアント設定',
              items: [
                { text: '概要', link: '/ja/mcp/' },
                { text: 'Claude Desktop', link: '/ja/mcp/claude-desktop' },
                { text: 'Cursor', link: '/ja/mcp/cursor' },
                { text: 'VS Code', link: '/ja/mcp/vscode' },
              ],
            },
          ],
          '/ja/reference/': [
            {
              text: 'リファレンス',
              items: [
                { text: '文法', link: '/ja/reference/grammar' },
                { text: 'コンポーネント', link: '/ja/reference/components' },
                { text: 'API', link: '/ja/reference/api' },
              ],
            },
          ],
        },
        outline: {
          level: [2, 3],
          label: '目次',
        },
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/grammar' },
      { text: 'Dashboard', link: 'https://wireweave.org/dashboard' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Wireweave?', link: '/guide/what-is-wireweave' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Pages', link: '/guide/pages' },
            { text: 'Components', link: '/guide/components' },
            { text: 'Layouts', link: '/guide/layouts' },
            { text: 'Styling', link: '/guide/styling' },
            { text: 'Annotations', link: '/guide/annotation' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Claude Code Plugin', link: '/guide/claude-code-plugin' },
            { text: 'MCP Server', link: '/guide/mcp-server' },
            { text: 'VS Code Extension', link: '/guide/vscode-extension' },
            { text: 'Markdown Plugin', link: '/guide/markdown-plugin' },
          ],
        },
      ],
      '/mcp/': [
        {
          text: 'MCP Client Setup',
          items: [
            { text: 'Overview', link: '/mcp/' },
            { text: 'Claude Desktop', link: '/mcp/claude-desktop' },
            { text: 'Cursor', link: '/mcp/cursor' },
            { text: 'VS Code', link: '/mcp/vscode' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Grammar', link: '/reference/grammar' },
            { text: 'Components', link: '/reference/components' },
            { text: 'API', link: '/reference/api' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/wireweave/core' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026 Wireweave',
    },

    search: {
      provider: 'local',
    },
  },
})
