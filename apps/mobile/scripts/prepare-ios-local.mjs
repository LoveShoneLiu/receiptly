import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const scriptPath = path.resolve(
  'node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh',
);
const workspaceDerivedData = 'DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"';
const temporaryDerivedData =
  'DERIVED_DATA_PATH="${TMPDIR:-/tmp}/receiptly-expo-modules-jsi-derived-data"';

const source = await readFile(scriptPath, 'utf8');
if (source.includes(temporaryDerivedData)) process.exit(0);
if (!source.includes(workspaceDerivedData)) {
  throw new Error(
    'Unsupported expo-modules-jsi build script. Review the local iOS workaround before building.',
  );
}

await writeFile(
  scriptPath,
  source.replace(workspaceDerivedData, temporaryDerivedData),
);
