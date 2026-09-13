import { rmSync } from "node:fs";
import path from "node:path";

// genlayer-cli transpiles the deployment script beside its source. Remove only
// that known generated file so an interrupted run cannot be scanned twice.
rmSync(path.resolve(process.cwd(), "deploy/deployScript.compiled.js"), { force: true });
