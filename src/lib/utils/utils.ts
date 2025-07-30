
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ADDITIONAL_DEPENDENCIES } from '../../constant/dependencies';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Repository name validation: only ASCII letters, digits, and the characters ., - and _
function validateProjectName(name: string) {
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(name);
};

function mergeDependencies(baseDeps: { [key: string]: string }, newDeps: string[]): { [key: string]: string } {
  const result = { ...baseDeps };
  const missingDeps: string[] = [];

  newDeps.forEach(dep => {
    const scopedMatch = dep.match(/@([^/]+)\/([^/]+)/);
    if (scopedMatch) {
      const scope = scopedMatch[1];
      const packageName = scopedMatch[2];

      // Find matching dependencies
      const matchingDeps = Object.keys(ADDITIONAL_DEPENDENCIES).filter(key =>
        key.startsWith(`@${scope}/`) && key.includes(packageName)
      );

      if (matchingDeps.length > 0) {
        matchingDeps.forEach(matchingDep => {
          result[matchingDep] = ADDITIONAL_DEPENDENCIES[matchingDep];
        });
      } else {
        missingDeps.push(dep);
      }
    } else if (ADDITIONAL_DEPENDENCIES[dep]) {
      result[dep] = ADDITIONAL_DEPENDENCIES[dep];
    } else {
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    console.warn('Missing dependencies:', missingDeps);
  }

  return result;
}

const convertToFilePathCodeMap = (
  // @ts-expect-error ino
  input: CodebaseType
): Record<string, string> => {
  const output: Record<string, string> = {};

  for (const [filePath, data] of Object.entries(input)) {
    // @ts-expect-error ignore
    output[filePath] = data.code;
  }

  return output;
};

function generateSrcDocFromCodebase(codebase: Record<string, string>): string {
  let html = codebase["/index.html"] || "<!DOCTYPE html><html><head></head><body></body></html>";
  const css = codebase["/style.css"] || "";
  const js = codebase["/script.js"] || "";

  // 1. Remove script tag with type="module" and src="./script.js"
  html = html.replace(
    /<script\s+type=["']module["']\s+src=["']\.\/script\.js["']><\/script>/gi,
    ""
  );

  // 2. Inject <style> into <head>
  const headInjection = css ? `<style>${css}</style>` : "";

  // 3. Inject <script> into <body>
  const bodyInjection = js ? `<script type="module">${js}</script>` : "";

  // 4. Place them in the correct spots
  html = html.replace("</head>", `${headInjection}</head>`);
  html = html.replace("</body>", `${bodyInjection}</body>`);

  return html;
}


export const trackPageView = (url: string) => {
  // @ts-expect-error ino
  window.dataLayer = window.dataLayer || []
  // @ts-expect-error ino
  window.dataLayer.push({
    event: 'pageview',
    page: url,
  })
}


export { cn, validateProjectName, convertToFilePathCodeMap, mergeDependencies, generateSrcDocFromCodebase };