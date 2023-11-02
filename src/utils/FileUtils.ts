import fs from 'fs';

export function writeFile(path: string, data: string) {
  fs.writeFileSync(path, data);
}

export function readFile(path: string) {
  return fs.readFileSync(path, { encoding: 'utf-8' });
}

export function clearFile(path: string) {
  if (fileExists(path))
    fs.writeFileSync(path, '');

  throw new Error(`File ${path} does not exist`);
}

export function deleteFile(path: string) {
  fs.unlinkSync(path);
}

export function fileExists(path: string) {
  return fs.existsSync(path);
}

export function createDir(path: string, recursive: boolean = true) {
  fs.mkdirSync(path, { recursive });
}

