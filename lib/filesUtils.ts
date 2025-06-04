import { useGlobalState } from '@/hooks/global-state';
import { BASE_DEPENDENCIES, mergeDependencies } from '@/constant/dependencies';
import { REACT_TEMPLATE_FILES, SHADCN_TEMPLATE_FILES } from '@/constant/templateFiles';

export function generatePackageJson(dependencies = {}) {
  return JSON.stringify(
    {
      name: "shadcn-ui-app",
      version: "0.1.0",
      private: true,
      dependencies: dependencies,
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

// Default files with dynamic package.json
export const defaultFiles = {
  ...REACT_TEMPLATE_FILES,
  "package.json": generatePackageJson(BASE_DEPENDENCIES),
  ...SHADCN_TEMPLATE_FILES,
};

// Function to update dependencies in defaultFiles
export function updateDefaultFiles(externalPackages: string[]) {
  const store = useGlobalState.getState();
  const newDependencies = mergeDependencies(store.dependencies, externalPackages);
  store.setDependencies(newDependencies);
  defaultFiles["package.json"] = generatePackageJson(newDependencies);
  return defaultFiles;
}

// Function to get current dependencies
export function getCurrentDependencies() {
  return useGlobalState.getState().dependencies;
}

// Function to check if a dependency exists
export function hasDependency(depName: string) {
  const deps = getCurrentDependencies();
  return !!deps[depName];
}

// Function to get dependency version
export function getDependencyVersion(depName: string) {
  const deps = getCurrentDependencies();
  return deps[depName];
}