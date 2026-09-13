"use strict";

const REPO = "MacroPhase/App";
const API = "https://api.github.com/repos/" + REPO + "/releases/latest";
const FALLBACK_APK =
  "https://github.com/MacroPhase/App/releases/download/v1.0.100075/MacroPhase-v1.0.100076-beta.apk";

function parseChangelogMarkdown(markdown) {
  if (!markdown) return "No changelog details provided.";

  let html = markdown.replace(/\r\n/g, "\n");
  html = html.replace(/\b[0-9a-f]{7,8}\b/gi, "");
  html = html.replace(/^###\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gs, "<ul>$1</ul>");
  html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" rel="noopener">$1</a>');

  return html
    .split(/\n\s*\n/)
    .map(function (section) {
      const s = section.trim();
      if (!s) return "";
      if (s.startsWith("<ul") || s.startsWith("<h")) return s;
      return "<p>" + s.replace(/\n/g, "<br>") + "</p>";
    })
    .join("");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

async function fetchLatestRelease() {
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error("release fetch failed");
    const data = await response.json();
    if (!data || !data.tag_name) throw new Error("no release");

    let downloadUrl = "";
    if (data.assets && data.assets.length) {
      const apk = data.assets.find(function (asset) {
        return asset.name && asset.name.toLowerCase().endsWith(".apk");
      });
      if (apk) downloadUrl = apk.browser_download_url;
    }
    if (!downloadUrl) {
      downloadUrl =
        "https://github.com/" +
        REPO +
        "/releases/download/" +
        data.tag_name +
        "/MacroPhase-" +
        data.tag_name +
        "-beta.apk";
    }

    document.querySelectorAll("[data-download]").forEach(function (link) {
      link.href = downloadUrl;
    });

    setText("version-label", data.tag_name);
    setText("changelog-version", data.tag_name);

    if (data.published_at) {
      const formatted = new Date(data.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      setText("release-date", formatted);
      setText("changelog-date", formatted);
    }

    const body = document.getElementById("changelog-body");
    if (body && data.body) body.innerHTML = parseChangelogMarkdown(data.body);

    const details = document.getElementById("changelog");
    if (details) details.hidden = false;
  } catch (error) {
    console.warn("Could not retrieve latest version dynamically.", error);
    document.querySelectorAll("[data-download]").forEach(function (link) {
      if (!link.getAttribute("href")) link.href = FALLBACK_APK;
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  fetchLatestRelease();
});
