import React, { useState, useEffect } from 'react';
import { seoService } from '../services/seoService';
import { SiteSEOConfig, SEODiagnosticResult, SEOData } from '../types/seo';
import {
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Share2,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Sliders,
  Sparkles,
  Layers,
  ShieldAlert,
  Smartphone,
  Monitor,
  Check,
} from 'lucide-react';

export const AdminSeoDashboard: React.FC = () => {
  const [config, setConfig] = useState<SiteSEOConfig>(seoService.getConfig());
  const [selectedRoute, setSelectedRoute] = useState<string>('home');
  const [diagnostics, setDiagnostics] = useState<SEODiagnosticResult[]>(seoService.runSEODiagnostics());
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'twitter'>('facebook');

  const currentRouteSEO: SEOData = seoService.getRouteSEO(selectedRoute);

  const refreshDiagnostics = () => {
    setDiagnostics(seoService.runSEODiagnostics());
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    seoService.updateConfig(config);
    setSavedToast(true);
    refreshDiagnostics();
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all SEO settings to recommended defaults?')) {
      seoService.resetConfigToDefaults();
      setConfig(seoService.getConfig());
      refreshDiagnostics();
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sitemapXml = seoService.generateXMLSitemap();
  const robotsTxt = seoService.generateRobotsTxt();

  const totalPassed = diagnostics.filter((d) => d.status === 'pass').length;
  const totalWarnings = diagnostics.filter((d) => d.status === 'warning').length;
  const totalErrors = diagnostics.filter((d) => d.status === 'error').length;
  const healthScore = Math.round((totalPassed / diagnostics.length) * 100);

  return (
    <div className="space-y-10">
      {/* Top Banner & Health Score */}
      <div className="bg-[#12141f] border border-[#26283b] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#c5a059] font-cinzel text-xs uppercase tracking-wider font-semibold">
            <Search className="w-4 h-4" />
            <span>Google SEO & Discoverability Engine</span>
          </div>
          <h2 className="text-2xl font-cinzel font-bold text-[#f5efeb]">
            Search Engine Optimization & Indexing
          </h2>
          <p className="text-xs sm:text-sm text-[#a8a396] max-w-xl leading-relaxed">
            Centralized metadata management, Schema.org JSON-LD generation, XML sitemaps, and real-time Google search snippet rendering for Matthew E. Messmer's author platform.
          </p>
        </div>

        {/* Health Metric */}
        <div className="bg-[#0b0c13] border border-[#212332] rounded-xl p-5 flex items-center gap-5 shrink-0 min-w-[240px]">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1c1e2b]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={healthScore >= 90 ? 'text-emerald-500' : 'text-[#c5a059]'}
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-cinzel font-bold text-lg text-[#f5efeb]">
              {healthScore}%
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-cinzel font-bold text-[#f5efeb]">SEO Health Index</div>
            <div className="text-emerald-400 font-medium">{totalPassed} Routes Passing</div>
            {totalWarnings > 0 && <div className="text-amber-400">{totalWarnings} Minor Warnings</div>}
            {totalErrors > 0 && <div className="text-rose-400">{totalErrors} Issues Found</div>}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Preview & Route Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Route Selector */}
        <div className="lg:col-span-4 bg-[#11131c] border border-[#232635] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e202d] pb-3">
            <span className="text-xs font-cinzel font-semibold uppercase tracking-wider text-[#c5a059]">
              Indexed Routes ({diagnostics.length})
            </span>
            <button
              onClick={refreshDiagnostics}
              className="p-1 hover:text-[#c5a059] text-[#7d776a] rounded transition-colors cursor-pointer"
              title="Refresh Audits"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {diagnostics.map((diag) => {
              const isSelected = selectedRoute === diag.routeId;
              return (
                <button
                  key={diag.routeId}
                  onClick={() => setSelectedRoute(diag.routeId)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1b1e2c] border border-[#c5a059]/40 text-[#f5efeb]'
                      : 'hover:bg-[#151722] text-[#aba597]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate text-[#e2ded5]">{diag.pageTitle}</div>
                    <div className="text-[11px] text-[#757064] font-mono">{diag.path}</div>
                  </div>
                  <div>
                    {diag.status === 'pass' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Pass" />
                    )}
                    {diag.status === 'warning' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Warning" />
                    )}
                    {diag.status === 'error' && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" title="Error" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Previews & Diagnostics for Selected Route */}
        <div className="lg:col-span-8 space-y-6">
          {/* Google Search Snippet Simulation */}
          <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e202d] pb-3">
              <div className="flex items-center gap-2 text-xs font-cinzel font-semibold uppercase tracking-wider text-[#f5efeb]">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Google Search Result Snippet</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0b0c12] p-1 rounded-lg border border-[#212332]">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Simulated Google Card */}
            <div
              className={`p-5 rounded-xl bg-[#202124] text-left space-y-1.5 transition-all ${
                previewDevice === 'mobile' ? 'max-w-sm mx-auto shadow-xl' : 'w-full'
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] text-[#bdc1c6] truncate">
                <div className="w-4 h-4 rounded-full bg-[#303134] flex items-center justify-center text-[10px] text-emerald-400">
                  M
                </div>
                <div className="truncate">
                  <span className="text-[#dadce0] font-medium">{config.siteName}</span>
                  <span className="text-[#9aa0a6] mx-1">›</span>
                  <span className="text-[#9aa0a6] font-mono">{currentRouteSEO.canonicalPath}</span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg text-[#8ab4f8] hover:underline cursor-pointer font-sans leading-snug">
                {currentRouteSEO.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#bdc1c6] font-sans leading-relaxed line-clamp-2">
                {currentRouteSEO.description}
              </p>
            </div>

            {/* Snippet stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-[#0c0d12] border border-[#212332]">
                <div className="text-[11px] text-[#7d776a]">Title Length</div>
                <div className={`font-semibold ${currentRouteSEO.title.length <= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentRouteSEO.title.length} / 65 chars
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0c0d12] border border-[#212332]">
                <div className="text-[11px] text-[#7d776a]">Meta Desc Length</div>
                <div className={`font-semibold ${currentRouteSEO.description.length <= 165 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentRouteSEO.description.length} / 160 chars
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0c0d12] border border-[#212332]">
                <div className="text-[11px] text-[#7d776a]">Robots Directive</div>
                <div className="font-semibold text-emerald-400 truncate">
                  {currentRouteSEO.robots?.split(',')[0] || 'index'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0c0d12] border border-[#212332]">
                <div className="text-[11px] text-[#7d776a]">Canonical State</div>
                <div className="font-semibold text-emerald-400">Valid</div>
              </div>
            </div>
          </div>

          {/* Social Share Card Preview (OpenGraph / Twitter) */}
          <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e202d] pb-3">
              <div className="flex items-center gap-2 text-xs font-cinzel font-semibold uppercase tracking-wider text-[#f5efeb]">
                <Share2 className="w-4 h-4 text-[#c5a059]" />
                <span>Social Card Preview (OpenGraph / Twitter)</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0b0c12] p-1 rounded-lg border border-[#212332]">
                <button
                  onClick={() => setSocialPlatform('facebook')}
                  className={`px-2 py-1 rounded text-xs cursor-pointer ${
                    socialPlatform === 'facebook' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  Facebook / OG
                </button>
                <button
                  onClick={() => setSocialPlatform('twitter')}
                  className={`px-2 py-1 rounded text-xs cursor-pointer ${
                    socialPlatform === 'twitter' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  Twitter / X Card
                </button>
              </div>
            </div>

            <div className="max-w-lg mx-auto bg-[#18191a] border border-[#3a3b3c] rounded-xl overflow-hidden shadow-lg">
              <div className="aspect-[1.91/1] w-full bg-[#242526] relative flex items-center justify-center overflow-hidden">
                {currentRouteSEO.ogImage ? (
                  <img
                    src={currentRouteSEO.ogImage}
                    alt={currentRouteSEO.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                  <div className="text-white font-cinzel text-sm font-bold tracking-wider">
                    {config.siteName}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-1 text-left bg-[#242526]">
                <div className="text-[11px] uppercase tracking-wider text-[#b0b3b8] font-mono">
                  {config.canonicalDomain.replace(/^https?:\/\//, '')}
                </div>
                <div className="text-sm font-semibold text-[#e4e6eb] leading-tight line-clamp-1">
                  {currentRouteSEO.ogTitle || currentRouteSEO.title}
                </div>
                <div className="text-xs text-[#b0b3b8] line-clamp-2 leading-relaxed">
                  {currentRouteSEO.ogDescription || currentRouteSEO.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD Schema Inspector */}
      <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e202d] pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#c5a059]" />
            <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
              Schema.org Structured Data (JSON-LD) for "{currentRouteSEO.title}"
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(
                    {
                      '@context': 'https://schema.org',
                      '@graph': Array.isArray(currentRouteSEO.schema)
                        ? currentRouteSEO.schema
                        : [currentRouteSEO.schema],
                    },
                    null,
                    2
                  ),
                  'schema'
                )
              }
              className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'schema' ? 'Copied JSON-LD' : 'Copy JSON-LD'}</span>
            </button>
            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>Schema Validator</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#7f7a6f]" />
            </a>
          </div>
        </div>

        <pre className="p-4 bg-[#0a0b10] border border-[#1e202d] rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-72">
          {JSON.stringify(
            {
              '@context': 'https://schema.org',
              '@graph': Array.isArray(currentRouteSEO.schema)
                ? currentRouteSEO.schema
                : [currentRouteSEO.schema],
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Sitemaps & Robots.txt Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sitemap XML */}
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e202d] pb-3">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                XML Sitemap (/sitemap.xml)
              </h3>
              <p className="text-[11px] text-[#7d776a]">
                Googlebot discovery feed indexing all public author routes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(sitemapXml, 'sitemap')}
                className="p-1.5 bg-[#1b1e2c] hover:text-[#c5a059] rounded text-xs transition-colors cursor-pointer"
                title="Copy XML"
              >
                {copiedType === 'sitemap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => downloadFile('sitemap.xml', sitemapXml, 'application/xml')}
                className="p-1.5 bg-[#1b1e2c] hover:text-[#c5a059] rounded text-xs transition-colors cursor-pointer"
                title="Download sitemap.xml"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <pre className="p-4 bg-[#0a0b10] border border-[#1e202d] rounded-lg text-[11px] font-mono text-[#a8a396] overflow-x-auto max-h-56">
            {sitemapXml}
          </pre>
        </div>

        {/* Robots.txt */}
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e202d] pb-3">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                Robots.txt (/robots.txt)
              </h3>
              <p className="text-[11px] text-[#7d776a]">
                Crawler instructions allowing public content and protecting admin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(robotsTxt, 'robots')}
                className="p-1.5 bg-[#1b1e2c] hover:text-[#c5a059] rounded text-xs transition-colors cursor-pointer"
                title="Copy robots.txt"
              >
                {copiedType === 'robots' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => downloadFile('robots.txt', robotsTxt, 'text/plain')}
                className="p-1.5 bg-[#1b1e2c] hover:text-[#c5a059] rounded text-xs transition-colors cursor-pointer"
                title="Download robots.txt"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <pre className="p-4 bg-[#0a0b10] border border-[#1e202d] rounded-lg text-[11px] font-mono text-[#a8a396] overflow-x-auto max-h-56">
            {robotsTxt}
          </pre>
        </div>
      </div>

      {/* Centralized SEO & Domain Configuration Editor */}
      <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#1e202d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-cinzel font-bold text-lg text-[#f5efeb] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#c5a059]" />
              <span>Global Author SEO Configuration</span>
            </h3>
            <p className="text-xs text-[#8f897c] mt-1">
              Configure production domains, verification tokens, and default OpenGraph metadata without editing code.
            </p>
          </div>
          {savedToast && (
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-cinzel font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SEO Settings Applied Live</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Canonical Production Domain
              </label>
              <input
                type="text"
                value={config.canonicalDomain}
                onChange={(e) => setConfig({ ...config, canonicalDomain: e.target.value })}
                placeholder="https://matthewemessmer.com"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
              <p className="text-[11px] text-[#7d776a]">
                Used for canonical URLs, sitemaps, and Schema IDs. Defaults to current domain.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Site Title (Browser Default)
              </label>
              <input
                type="text"
                value={config.siteTitle}
                onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Author Name
              </label>
              <input
                type="text"
                value={config.authorName}
                onChange={(e) => setConfig({ ...config, authorName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Google Site Verification Token
              </label>
              <input
                type="text"
                value={config.googleSiteVerification}
                onChange={(e) => setConfig({ ...config, googleSiteVerification: e.target.value })}
                placeholder="google-site-verification=abc123xyz..."
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
              <p className="text-[11px] text-[#7d776a]">
                Injected directly into head &lt;meta name="google-site-verification"&gt;
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Google Analytics 4 Measurement ID
              </label>
              <input
                type="text"
                value={config.googleAnalyticsId}
                onChange={(e) => setConfig({ ...config, googleAnalyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
              <p className="text-[11px] text-[#7d776a]">
                Optional Google Analytics gtag.js tag injection.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Default Social Share Image (OG Image)
              </label>
              <input
                type="text"
                value={config.defaultOgImage}
                onChange={(e) => setConfig({ ...config, defaultOgImage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
              Site Description (Global Fallback)
            </label>
            <textarea
              rows={2}
              value={config.siteDescription}
              onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="pt-4 border-t border-[#1e202d] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-[#7d776a] hover:text-[#d4cfc2] underline cursor-pointer"
            >
              Reset to Recommended Defaults
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#c5a059]/10"
            >
              Save SEO Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
