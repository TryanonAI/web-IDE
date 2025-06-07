import { BASE_DEPENDENCIES } from '@/constant/dependencies';
import { REACT_TEMPLATE_FILES, SHADCN_TEMPLATE_FILES } from '@/constant/templateFiles';

export const defaultFiles = {
  ...REACT_TEMPLATE_FILES,
  "package.json": generatePackageJson(),
  ...SHADCN_TEMPLATE_FILES,
};

export function generatePackageJson() {

  return JSON.stringify(
    {
      name: "anon-app",
      version: "0.1.0",
      private: true,
      dependencies: {
        ...BASE_DEPENDENCIES,
      },
      scripts: {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      }
    },
    null,
    2
  );
}