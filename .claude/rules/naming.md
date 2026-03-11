# Rule: descriptive naming — no cryptic short names

This rule applies when writing ANY new code and when refactoring existing code.

## Core principle

Every name must be understandable without surrounding context. A reader should never need to scroll up or check another file to understand what a variable holds.

## Forbidden patterns

### Single/two/three-letter variables (except standard idioms)

```ts
// ❌ Bad
const t = getTasks();
const g = goals.find(g => g.id === id);
const ctx = getContext();
const cat = getCategory();
const cb = () => handleSubmit();
const res = await fetch(url);
const err = new Error("fail");
const val = input.value;
const idx = items.indexOf(item);
const btn = document.querySelector("button");
const msg = "Something went wrong";
const el = ref.current;
const cfg = loadConfig();
const evt = new CustomEvent("sync");
```

```ts
// ✅ Good
const tasks = getTasks();
const matchedGoal = goals.find(goal => goal.id === targetId);
const currentContext = getContext();
const category = getCategory();
const onSubmit = () => handleSubmit();
const response = await fetch(apiUrl);
const validationError = new Error("fail");
const inputValue = input.value;
const itemIndex = items.indexOf(item);
const submitButton = document.querySelector("button");
const errorMessage = "Something went wrong";
const containerElement = ref.current;
const appConfig = loadConfig();
const syncEvent = new CustomEvent("sync");
```

### Allowed short names (exceptions)

- `i`, `j`, `k` — only in simple `for` loops with numeric index
- `x`, `y` — coordinates or math
- `id` — when meaning is obvious from context
- `db` — established Dexie instance name (`db.ts`)
- `e` — in catch blocks: `catch (e)` and inline event handlers: `onClick={(e) => ...}`
- `_` — unused parameter placeholder
- `T`, `K`, `V` — generic type parameters

### Vague generic names

```ts
// ❌ Bad — what data? what info? what item?
const data = await pullChanges();
const info = getUserInfo();
const item = list[0];
const result = processTask(task);
const temp = calculateScore();
const obj = JSON.parse(raw);
const stuff = getFilteredItems();
```

```ts
// ✅ Good — says exactly what it holds
const serverChanges = await pullChanges();
const userProfile = getUserInfo();
const firstTask = list[0];
const completionStatus = processTask(task);
const totalScore = calculateScore();
const parsedSettings = JSON.parse(raw);
const filteredTasks = getFilteredItems();
```

## Function and method names

- Start with a verb: `get`, `set`, `create`, `update`, `delete`, `fetch`, `parse`, `validate`, `handle`, `format`, `build`, `check`, `is`, `has`, `should`
- Be specific about what the function does:

```ts
// ❌ Bad
function process(tasks: Task[]): Task[]
function handle(event: SyncEvent): void
function check(goal: Goal): boolean
function doStuff(): void

// ✅ Good
function filterCompletedTasks(tasks: Task[]): Task[]
function handleSyncConflict(event: SyncEvent): void
function isGoalCompleted(goal: Goal): boolean
function recalculateSortOrder(): void
```

## Boolean names

- Prefix with `is`, `has`, `should`, `can`, `was`, `will`:

```ts
// ❌ Bad
const open = true;
const sync = false;
const valid = checkEmail(email);
const loading = true;

// ✅ Good
const isOpen = true;
const isSyncing = false;
const isValidEmail = checkEmail(email);
const isLoading = true;
```

## Collections

- Always plural nouns:

```ts
// ❌ Bad
const taskList = useTasks();
const goalArray = getGoals();

// ✅ Good
const tasks = useTasks();
const goals = getGoals();
```

## Callbacks and handlers

- Event handlers: `onEventName` or `handleEventName`
- Callbacks: describe what happens, not that it's a callback

```ts
// ❌ Bad
const cb = () => { ... };
const fn = (task: Task) => { ... };

// ✅ Good
const onTaskComplete = () => { ... };
const handleTaskComplete = (task: Task) => { ... };
```

## Mandatory self-check

After writing code, check every name:
1. Could someone understand this name without seeing surrounding code? If no → rename
2. Is it a single letter (not in exceptions list)? → rename
3. Is it a generic word like `data`, `info`, `item`, `result`, `temp`? → make specific
4. Does the function name start with a verb? If no → rename
5. Is a boolean missing `is`/`has`/`should` prefix? → rename
