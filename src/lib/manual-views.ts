import fs from "fs";
import path from "path";

export interface ManualItem {
  id: string;
  index: string;
  label: string;
}

export interface ManualGroup {
  group: string;
  items: ManualItem[];
}

export interface ManualViewPayload {
  viewKey: string;
  groups: ManualGroup[];
  sections: Record<string, string>;
}

const LOCAL_VIDEOS: Record<string, string> = {
  "6a8d89733c7881dfcfe5fee4": "/videos/6a8d89733c7881dfcfe5fee4.mp4",
  "6a8d8e10f9b062f814e2dc1f": "/videos/6a8d8e10f9b062f814e2dc1f.mp4",
  "6a8d8c83d0d6a7f1adfd852b": "/videos/6a8d8c83d0d6a7f1adfd852b.mp4",
  "6ab8ad04c13d4373c2b95add": "/videos/6ab8ad04c13d4373c2b95add.mp4",
  "6aba4b87c13d4373c2dd181b": "/videos/6aba4b87c13d4373c2dd181b.mp4",
  "6a8d85e6e1df8e540bc149e9": "/videos/6a8d85e6e1df8e540bc149e9.mp4",
  "recado-denderson": "/videos/recado-denderson.mp4",
  "skills-intro": "/videos/skills-intro.mp4",
  "358a9b8d-0c19-4015-9db1-3cf1d41a6ca9": "/videos/358a9b8d-0c19-4015-9db1-3cf1d41a6ca9.mp4",
  "a0ae3c2d-8593-46c2-9580-dd732cd9d0aa": "/videos/a0ae3c2d-8593-46c2-9580-dd732cd9d0aa.mp4",
  "9b60b865-d89a-407c-827a-779c648f8606": "/videos/9b60b865-d89a-407c-827a-779c648f8606.mp4",
};

let cachedManual: {
  views: Record<string, ManualGroup[]>;
  sections: Record<string, string>;
  catalog?: Record<string, any>;
} | null = null;

function loadManualFile() {
  if (cachedManual) return cachedManual;
  const filePath = path.join(
    process.cwd(),
    "docs/research/apostila.denderson.ai/api-_api_manual.json"
  );
  const raw = fs.readFileSync(filePath, "utf8");
  cachedManual = JSON.parse(raw);
  return cachedManual!;
}

function sanitizeAndLocalizeHtml(html: string): string {
  if (!html) return "";

  let result = html;

  // Localize known videos
  for (const [hash, localPath] of Object.entries(LOCAL_VIDEOS)) {
    const regex = new RegExp(`https://assets\\.cdn\\.filesafe\\.space/[^\\s"']*${hash}[^\\s"']*`, "g");
    result = result.replace(regex, localPath);
  }

  // Localize remote download links
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/imersao\/downloads\/dia-1\//g,
    "/downloads/dia-1/"
  );
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/imersao\/downloads\/dia-2\//g,
    "/downloads/dia-2/"
  );
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/imersao\/downloads\/instalador-hermes-plano-b\.zip/g,
    "/downloads/starter-kit-automacoes.zip"
  );

  // Localize gravacoes arquivos
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/gravacoes\/estudos-aula-3\/arquivos\/orca-configuracao-claude-code\.zip/g,
    "/downloads/orca-configuracao-claude-code.zip"
  );
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/gravacoes\/estudos-aula-3\/arquivos\/pacote-1-criacao-erp-claude-code\.zip/g,
    "/downloads/pacote-1-criacao-erp-claude-code.zip"
  );
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/gravacoes\/estudos-aula-4\/arquivos\/pacote-2-modulos-opcionais-erp\.zip/g,
    "/downloads/pacote-2-modulos-opcionais-erp.zip"
  );

  // Localize remaining gravacoes transcripts and maps to local API
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\/api\/gravacoes\//g,
    "/api/gravacoes/"
  );

  // Localize any remaining api-apostila endpoints to local origin
  result = result.replace(
    /https:\/\/api-apostila\.denderson\.ai\//g,
    "/"
  );

  // Replace missing posters with local covers
  result = result.replace(
    /poster="\/covers\/estudos-[^"]+\.webp"/g,
    'poster="/covers/grupo-20261001-orca-print.webp"'
  );

  return result;
}

function decorateSection(html: string, id: string, catalog?: Record<string, any>): string {
  if (!html) return "";
  const cat = catalog?.[id];
  if (!cat) return html;

  // PREMIUM ITEMS DECORATION
  if (cat.kind === "premium" && cat.slug) {
    const slug = cat.slug;
    const premDownloadHtml = `
<div class="prem-unlocked" style="margin-top: 24px; padding: 18px 20px; background: var(--paper-cream); border: 2px solid var(--linha); border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
  <div class="prem-unlocked-msg" style="font-size: 13.5px; line-height: 1.5; color: var(--ink);"><b>Liberado!</b> Baixe o arquivo .zip e envie para a sua Naia no Telegram para instalar.</div>
  <a class="skill-download btn" href="/api/premium/${encodeURIComponent(slug)}/download" download style="display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; text-decoration: none;">
    <span class="skill-download-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6.5 11.5 12 17l5.5-5.5M5 20h14"/></svg></span> Baixe o Pacote Premium (.zip)
  </a>
</div>`;

    let decorated = html;
    const lastDivIdx = decorated.lastIndexOf("</div>");
    if (lastDivIdx !== -1) {
      decorated = decorated.slice(0, lastDivIdx) + premDownloadHtml + "\n" + decorated.slice(lastDivIdx);
    } else {
      decorated += premDownloadHtml;
    }
    return decorated;
  }

  // REGULAR SKILLS DECORATION
  const kind = cat.kind || "skill";
  const installed = cat.status === "installed";
  const slug = cat.slug;

  // 1. Seal
  let sealText = "";
  if (kind === "subagent") {
    sealText = '<span class="skill-seal-dot"></span> Já vem com a sua Naia (subagente)';
  } else if (kind === "builtin") {
    sealText = '<span class="skill-seal-dot"></span> Já vem com a sua Naia';
  } else if (installed) {
    sealText = '<span class="skill-seal-dot"></span> Liberado · já vem instalada na sua Naia';
  } else {
    sealText = '<span class="skill-seal-dot"></span> Liberar · baixe e instale na sua Naia';
  }
  const sealHtml = `<div class="skill-seal is-green">${sealText}</div>`;

  // 2. Footer with download button
  let footHtml = "";
  if (kind !== "subagent" && kind !== "builtin" && slug) {
    let ativarHtml = "";
    let btnLabel = "Baixe a Skill";
    if (kind === "guide") {
      ativarHtml = "<b>Como instalar:</b> baixe o setup abaixo e cole no seu Claude Code ou Codex. Ele instala na sua VPS pra você, igual fez com a sua Naia.";
      btnLabel = "Baixe o setup";
    } else if (installed) {
      ativarHtml = "<b>Como ativar:</b> essa skill já vem instalada na sua Naia, é só pedir pra ela (veja o exemplo acima). O download abaixo é caso você queira o pacote pra guardar ou reinstalar.";
      btnLabel = "Baixe a Skill";
    } else {
      ativarHtml = "<b>Como ativar:</b> baixe o .zip abaixo e mande pra sua Naia no Telegram dizendo <i>\"instala essa skill\"</i>. Ela instala sozinha e a partir daí é só pedir.";
      btnLabel = "Baixe a Skill";
    }

    footHtml = `
<div class="skill-foot" style="margin-top: 28px; padding-top: 20px; border-top: 2px dashed var(--linha); display: flex; flex-direction: column; gap: 14px;">
  <div class="skill-activate" style="font-size: 13.5px; line-height: 1.5; color: var(--ink);">${ativarHtml}</div>
  <a class="skill-download btn" href="/api/skills/${encodeURIComponent(slug)}/download" download style="display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; text-decoration: none;">
    <span class="skill-download-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6.5 11.5 12 17l5.5-5.5M5 20h14"/></svg></span> ${btnLabel} (.zip)
  </a>
</div>`;
  }

  let decorated = html;
  // Place seal after cap__head
  if (decorated.includes('class="cap__head"')) {
    decorated = decorated.replace(/(<div class="cap__head">[\s\S]*?<\/div>)/, `$1\n${sealHtml}`);
  } else {
    decorated = `${sealHtml}\n${decorated}`;
  }

  // Place footer before closing tag
  if (footHtml) {
    const lastDivIdx = decorated.lastIndexOf("</div>");
    if (lastDivIdx !== -1) {
      decorated = decorated.slice(0, lastDivIdx) + footHtml + "\n" + decorated.slice(lastDivIdx);
    } else {
      decorated += footHtml;
    }
  }

  return decorated;
}

export function getManualViewData(viewKey: string): ManualViewPayload | null {
  const manual = loadManualFile();
  const groups = manual.views?.[viewKey];
  if (!groups || groups.length === 0) return null;

  const sections: Record<string, string> = {};
  for (const g of groups) {
    for (const item of g.items) {
      if (manual.sections[item.id]) {
        let content = sanitizeAndLocalizeHtml(manual.sections[item.id]);
        content = decorateSection(content, item.id, manual.catalog);
        sections[item.id] = content;
      }
    }
  }

  return {
    viewKey,
    groups,
    sections,
  };
}

