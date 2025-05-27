import axios from 'axios';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Repository name validation: only ASCII letters, digits, and the characters ., - and _
function validateProjectName(name: string) {
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(name);
};

interface ValidationResult {
  status: boolean;
  name?: string;
  latestVersion?: string;
}

// NPM Package Validation
const validateNpmPackage = async (
  packageName: string
): Promise<ValidationResult> => {
  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`
    );

    if (response?.status === 200) {
      return {
        status: true,
        name: response.data.name,
        latestVersion: response.data['dist-tags'].latest,
      };
    } else {
      console.warn(
        `Package validation failed for ${packageName}:`,
        response.status
      );
      return { status: false };
    }
  } catch (error) {
    console.error(`Error validating package ${packageName}:`, error);
    return { status: false };
  }
};

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
export { cn, validateProjectName, validateNpmPackage, convertToFilePathCodeMap };

