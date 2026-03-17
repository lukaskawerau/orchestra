import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, resolve } from "node:path";
import { z } from "zod";
import type { WorkspaceConfig } from "$lib/workspace/manager";

type ParsedYamlValue =
  | string
  | number
  | boolean
  | null
  | ParsedYamlValue[]
  | { [key: string]: ParsedYamlValue };

type ParsedYamlObject = { [key: string]: ParsedYamlValue };

interface ParserState {
  index: number;
}

export interface WorkflowConfigOptions {
  baseDir?: string;
  homeDir?: string;
}

export class WorkflowConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowConfigError";
  }
}

// Parses the subset of Symphony WORKFLOW.md frontmatter Orchestra currently cares about:
// workspace root plus typed workspace hook commands/timeouts.
const workflowHookCommandMap = {
  after_create: "afterCreate",
  before_run: "beforeRun",
  after_run: "afterRun",
  before_remove: "beforeRemove",
} as const satisfies Record<string, keyof NonNullable<WorkspaceConfig["hooks"]>>;

type WorkflowHookCommandName = keyof typeof workflowHookCommandMap;

const supportedHookCommandNames = Object.keys(
  workflowHookCommandMap
) as WorkflowHookCommandName[];

const supportedHookConfigKeys = [...supportedHookCommandNames, "timeout_ms"] as const;

const rawWorkflowSchema = z
  .object({
    workspace: z.object({
      root: z
        .string({ required_error: "workspace.root is required" })
        .min(1, "workspace.root is required"),
    }),
    hooks: z.record(z.unknown()).optional(),
  })
  .passthrough();

function countIndent(line: string): number {
  let indent = 0;

  while (indent < line.length && line[indent] === " ") {
    indent += 1;
  }

  return indent;
}

function nextMeaningfulLine(lines: string[], startIndex: number): number | null {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index]?.trim() !== "") {
      return index;
    }
  }

  return null;
}

function parseScalar(rawValue: string): ParsedYamlValue {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);

  return value;
}

function parseBlockScalar(
  lines: string[],
  state: ParserState,
  parentIndent: number
): string {
  const blockLines: string[] = [];
  let minIndent = Number.POSITIVE_INFINITY;

  while (state.index < lines.length) {
    const line = lines[state.index] ?? "";

    if (line.trim() === "") {
      blockLines.push("");
      state.index += 1;
      continue;
    }

    const indent = countIndent(line);
    if (indent <= parentIndent) {
      break;
    }

    minIndent = Math.min(minIndent, indent);
    blockLines.push(line);
    state.index += 1;
  }

  if (!Number.isFinite(minIndent)) {
    return "";
  }

  return blockLines
    .map((line) => (line === "" ? "" : line.slice(minIndent)))
    .join("\n");
}

function parseNode(
  lines: string[],
  state: ParserState,
  currentIndent: number
): ParsedYamlValue {
  const nextIndex = nextMeaningfulLine(lines, state.index);
  if (nextIndex === null) {
    return {};
  }

  const nextLine = lines[nextIndex] ?? "";
  const nextIndent = countIndent(nextLine);
  if (nextIndent < currentIndent) {
    return {};
  }

  state.index = nextIndex;
  if (nextLine.slice(nextIndent).startsWith("- ")) {
    return parseArray(lines, state, nextIndent);
  }

  return parseObject(lines, state, nextIndent);
}

function parseArray(
  lines: string[],
  state: ParserState,
  currentIndent: number
): ParsedYamlValue[] {
  const items: ParsedYamlValue[] = [];

  while (state.index < lines.length) {
    const line = lines[state.index] ?? "";
    if (line.trim() === "") {
      state.index += 1;
      continue;
    }

    const indent = countIndent(line);
    if (indent < currentIndent) {
      break;
    }
    if (indent > currentIndent) {
      throw new WorkflowConfigError(`Invalid YAML indentation near: ${line.trim()}`);
    }

    const trimmed = line.slice(indent);
    if (!trimmed.startsWith("- ")) {
      break;
    }

    const rest = trimmed.slice(2).trimStart();
    state.index += 1;

    if (rest === "") {
      const nestedIndex = nextMeaningfulLine(lines, state.index);
      if (nestedIndex === null || countIndent(lines[nestedIndex] ?? "") <= currentIndent) {
        items.push({});
      } else {
        items.push(parseNode(lines, state, countIndent(lines[nestedIndex] ?? "")));
      }
      continue;
    }

    items.push(parseScalar(rest));
  }

  return items;
}

function parseObject(
  lines: string[],
  state: ParserState,
  currentIndent: number
): ParsedYamlObject {
  const value: ParsedYamlObject = {};

  while (state.index < lines.length) {
    const line = lines[state.index] ?? "";
    if (line.trim() === "") {
      state.index += 1;
      continue;
    }

    const indent = countIndent(line);
    if (indent < currentIndent) {
      break;
    }
    if (indent > currentIndent) {
      throw new WorkflowConfigError(`Invalid YAML indentation near: ${line.trim()}`);
    }

    const trimmed = line.slice(indent);
    if (trimmed.startsWith("- ")) {
      throw new WorkflowConfigError(`Unexpected array item near: ${trimmed}`);
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new WorkflowConfigError(`Invalid YAML entry: ${trimmed}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rest = trimmed.slice(separatorIndex + 1).trimStart();
    state.index += 1;

    if (rest === "|") {
      value[key] = parseBlockScalar(lines, state, currentIndent);
      continue;
    }

    if (rest === "") {
      const nestedIndex = nextMeaningfulLine(lines, state.index);
      if (nestedIndex === null || countIndent(lines[nestedIndex] ?? "") <= currentIndent) {
        value[key] = {};
      } else {
        value[key] = parseNode(lines, state, countIndent(lines[nestedIndex] ?? ""));
      }
      continue;
    }

    value[key] = parseScalar(rest);
  }

  return value;
}

function parseFrontmatterYaml(frontmatter: string): ParsedYamlObject {
  const state: ParserState = { index: 0 };
  const parsed = parseNode(frontmatter.replace(/\r\n/g, "\n").split("\n"), state, 0);

  if (Array.isArray(parsed) || parsed === null || typeof parsed !== "object") {
    throw new WorkflowConfigError("Workflow frontmatter must be a YAML object");
  }

  return parsed as ParsedYamlObject;
}

function extractFrontmatter(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);

  if (!match?.[1]) {
    throw new WorkflowConfigError("WORKFLOW.md is missing YAML frontmatter");
  }

  return match[1];
}

function resolveWorkspaceRoot(root: string, options: WorkflowConfigOptions): string {
  const baseDir = options.baseDir ?? process.cwd();
  const homeDir = options.homeDir ?? homedir();

  if (root === "~") {
    return homeDir;
  }

  if (root.startsWith("~/")) {
    return resolve(homeDir, root.slice(2));
  }

  if (isAbsolute(root)) {
    return root;
  }

  return resolve(baseDir, root);
}

interface MappedHookConfig {
  hooks?: WorkspaceConfig["hooks"];
  hookTimeoutMs?: number;
}

function parseHookCommand(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new WorkflowConfigError(`${name} must be a non-empty string`);
  }

  return value;
}

function parseHookTimeout(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new WorkflowConfigError("hooks.timeout_ms must be a positive integer");
  }

  return value;
}

function mapHooks(rawHooks: Record<string, unknown> | undefined): MappedHookConfig {
  if (!rawHooks) {
    return {};
  }

  const unsupportedHooks = Object.keys(rawHooks).filter(
    (hookName) => !supportedHookConfigKeys.includes(hookName as (typeof supportedHookConfigKeys)[number])
  );
  if (unsupportedHooks.length > 0) {
    throw new WorkflowConfigError(
      `Unsupported workflow hook config key(s): ${unsupportedHooks.join(", ")}. Supported keys: ${supportedHookConfigKeys.join(", ")}`
    );
  }

  const hooks: NonNullable<WorkspaceConfig["hooks"]> = {};
  for (const hookName of supportedHookCommandNames) {
    const command = rawHooks[hookName];
    if (command !== undefined) {
      hooks[workflowHookCommandMap[hookName]] = parseHookCommand(
        `hooks.${hookName}`,
        command
      );
    }
  }

  const mappedHooks: MappedHookConfig = {};

  if (Object.keys(hooks).length > 0) {
    mappedHooks.hooks = hooks;
  }

  if (rawHooks.timeout_ms !== undefined) {
    mappedHooks.hookTimeoutMs = parseHookTimeout(rawHooks.timeout_ms);
  }

  return mappedHooks;
}

function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "workflow"} ${issue.message}`)
    .join("; ");
}

export function parseWorkflowConfig(
  markdown: string,
  options: WorkflowConfigOptions = {}
): WorkspaceConfig {
  const rawConfig = parseFrontmatterYaml(extractFrontmatter(markdown));
  const parsed = rawWorkflowSchema.safeParse(rawConfig);

  if (!parsed.success) {
    throw new WorkflowConfigError(formatSchemaError(parsed.error));
  }

  const root = resolveWorkspaceRoot(parsed.data.workspace.root, options);
  const { hooks, hookTimeoutMs } = mapHooks(parsed.data.hooks);

  return {
    root,
    ...(hooks ? { hooks } : {}),
    ...(hookTimeoutMs ? { hookTimeoutMs } : {}),
  };
}

export async function loadWorkspaceConfig(
  workflowPath: string,
  options: WorkflowConfigOptions = {}
): Promise<WorkspaceConfig> {
  const markdown = await readFile(workflowPath, "utf8");

  return parseWorkflowConfig(markdown, {
    ...options,
    baseDir: options.baseDir ?? dirname(workflowPath),
  });
}
