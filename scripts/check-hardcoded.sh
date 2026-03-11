#!/bin/bash
# check-hardcoded.sh — PostToolUse hook for Claude Code
# Checks the modified file for hardcoded values
# and outputs a warning that Claude will see as feedback.

set -euo pipefail

# Read JSON input from Claude Code via stdin
INPUT=$(cat)

# Extract file path (different tool_input structures for Write/Edit/MultiEdit)
FILE_PATH=$(echo "$INPUT" | jq -r '
  .tool_input.file_path //
  .tool_input.path //
  .tool_input.file_paths[0] //
  empty
')

# If path is not defined or file does not exist — exit silently
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Only check TypeScript files
case "$FILE_PATH" in
  *.ts|*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Skip excluded files (tests, constants, configs, types)
case "$FILE_PATH" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx)
    exit 0
    ;;
  */constants/*|*/constants.ts|*/config.ts|*/config/*)
    exit 0
    ;;
  */enums/*|*/enums.ts|*/types/*|*.d.ts)
    exit 0
    ;;
  *vite.config*|*vitest.config*|*tailwind.config*|*postcss.config*)
    exit 0
    ;;
esac

ISSUES=""

# 1. Magic numbers: numbers >= 2 in logic (not in imports, not in arrays)
#    Search for numeric literals, excluding common false positives
MAGIC_NUMBERS=$(grep -nP '(?<![\w.@/\\#-])(?<!\`)(?<!\bv)\b([2-9]\d*|[1-9]\d{2,})\b(?!\s*[:\]}])(?!.*(?:import|require|from\s|version|\.length|console\.|\/\/|px\b|rem\b|em\b))' "$FILE_PATH" \
  | grep -vP '(^\s*//|^\s*/\*|\*\s|@param|@returns|eslint|TODO|FIXME)' \
  | grep -vP '(tailwind|className|class=)' \
  | head -10 || true)

if [ -n "$MAGIC_NUMBERS" ]; then
  ISSUES+="⚠️  Possible magic numbers — extract into named constants:\n"
  ISSUES+="$MAGIC_NUMBERS\n\n"
fi

# 2. Hardcoded URLs (http:// or https://)
HARDCODED_URLS=$(grep -nP 'https?://[^\s"'\''`]+' "$FILE_PATH" \
  | grep -vP '(^\s*//|^\s*/\*|\*\s|import|require|from\s|@link|@see|eslint|TODO)' \
  | head -5 || true)

if [ -n "$HARDCODED_URLS" ]; then
  ISSUES+="⚠️  Hardcoded URLs — extract into constants or config:\n"
  ISSUES+="$HARDCODED_URLS\n\n"
fi

# 3. String literals in conditions (likely candidates for enum)
#    Search for patterns: === "string", !== "string", case "string"
STRING_IN_CONDITIONS=$(grep -nP '(===?\s*["\x27]|!==?\s*["\x27]|case\s+["\x27])(?!use |strict)' "$FILE_PATH" \
  | grep -vP '(^\s*//|^\s*/\*|\*\s|typeof|\.type\s|import|test\(|describe\(|it\()' \
  | head -10 || true)

if [ -n "$STRING_IN_CONDITIONS" ]; then
  ISSUES+="⚠️  String literals in conditions — use enum instead:\n"
  ISSUES+="$STRING_IN_CONDITIONS\n\n"
fi

# 4. Google Sheets sheet names used directly (specific to Clear Progress)
SHEET_NAMES=$(grep -nP 'getSheetByName\s*\(\s*["\x27]' "$FILE_PATH" \
  | grep -vP 'SHEET_NAMES\.' \
  | head -5 || true)

if [ -n "$SHEET_NAMES" ]; then
  ISSUES+="⚠️  Hardcoded Google Sheets sheet name — use SHEET_NAMES.* constant:\n"
  ISSUES+="$SHEET_NAMES\n\n"
fi

# Output results (Claude will see this as feedback from the hook)
if [ -n "$ISSUES" ]; then
  echo ""
  echo "━━━ Hardcoded values check: $FILE_PATH ━━━"
  echo -e "$ISSUES"
  echo "Rules: .claude/rules/code-style.md"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Always exit 0 — warning only, not a blocker
exit 0
