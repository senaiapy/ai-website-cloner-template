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

  // Fallback for remaining remote videos to a downloaded local fallback video
  result = result.replace(
    /https:\/\/assets\.cdn\.filesafe\.space\/[^\s"']+\.mp4/g,
    "/videos/358a9b8d-0c19-4015-9db1-3cf1d41a6ca9.mp4"
  );

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

export function getManualViewData(viewKey: string): ManualViewPayload | null {
  const manual = loadManualFile();
  const groups = manual.views?.[viewKey];
  if (!groups || groups.length === 0) return null;

  const sections: Record<string, string> = {};
  for (const g of groups) {
    for (const item of g.items) {
      if (manual.sections[item.id]) {
        sections[item.id] = sanitizeAndLocalizeHtml(manual.sections[item.id]);
      }
    }
  }

  return {
    viewKey,
    groups,
    sections,
  };
}

