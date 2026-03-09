// ─────────────────────────────────────────────────────────────────
//  LESSON: React Trap Questions
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_REACT_TRAPS = {
  category: "Language & Framework Fundamentals",
  tag: "React Trap Questions",
  title: "The Bugs That Only Appear After You Ship",
  intro: "Raj opens a CodeSandbox. There's a counter on screen. 'Click the button three times fast,' he says. You click. The count shows 1. 'Now tell me why it's not 3.'",
  scenes: [

    // ── State batching ──
    {
      speaker: "raj",
      text: `"What's your first guess?"`
    },
    {
      speaker: "you",
      text: `"The click handler is only firing once?"`
    },
    {
      speaker: "raj",
      text: `"It fires three times. Look at the handler."`
    },
    {
      speaker: "you",
      text: `"It calls setCount(count + 1) three times... oh. Each call reads the same stale value of count."`
    },
    {
      speaker: "raj",
      text: `"Exactly. State in React is a snapshot — count doesn't change during the render. When you call setCount(count + 1) three times in one event handler, all three calls close over the same count value from the current render. You're computing 0+1, 0+1, 0+1, not 0+1, 1+1, 2+1. React batches all three updates and applies the last one — still 1. The fix is the functional update form: setCount(prev => prev + 1). Each callback receives the actual latest pending value, not the snapshot from the render. This is the form you should default to whenever the new state depends on the old state."`
    },
    {
      type: "analogy",
      text: "React state is a photograph, not a live feed. When your event handler runs, count is a frozen value from when the component last rendered. Calling setCount(count + 1) three times is like writing '0 + 1' on three sticky notes using the same photograph. The functional form — setCount(prev => prev + 1) — is like passing a baton: each runner gets the baton from the previous one, not from a photo of lap one."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// STATE BATCHING + STALE CLOSURES
// ─────────────────────────────────────────────────────

// ✗ All three read the same stale count from the render snapshot
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1); // count = 0 → schedules 1
    setCount(count + 1); // count = 0 → schedules 1 (same!)
    setCount(count + 1); // count = 0 → schedules 1 (same!)
    // React batches → applies last scheduled value: 1
  };

  return <button onClick={handleClick}>{count}</button>;
}

// ✓ Functional update — each callback receives latest pending value
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1); // prev=0 → 1
    setCount(prev => prev + 1); // prev=1 → 2
    setCount(prev => prev + 1); // prev=2 → 3
    // Result: 3 ✓
  };

  return <button onClick={handleClick}>{count}</button>;
}

// ── React 18 automatic batching ──
// React 18 batches ALL state updates — even inside setTimeout, fetch callbacks, promises
// React 17 only batched inside React event handlers

// React 18 — both setUser and setLoading trigger ONE re-render:
setTimeout(() => {
  setUser(data);    // batched
  setLoading(false); // batched
  // one render with both updates applied
}, 1000);

// To opt out of batching (rare — usually a smell):
import { flushSync } from 'react-dom';
flushSync(() => setUser(data));      // renders immediately
flushSync(() => setLoading(false));  // renders again immediately`
    },

    // ── useEffect dependencies ──
    {
      speaker: "raj",
      text: `"useEffect. You have an effect that fetches data when a userId changes. Show me how you'd write it — and then I'll tell you what's wrong with it."`
    },
    {
      speaker: "you",
      text: `"useEffect with the fetch inside, userId in the dependency array."`
    },
    {
      speaker: "raj",
      text: `"Good. What happens if the component unmounts while the fetch is in flight?"`
    },
    {
      speaker: "you",
      text: `"The fetch completes and tries to set state on an unmounted component?"`
    },
    {
      speaker: "raj",
      text: `"Which in older React printed a warning: 'Can't perform a state update on an unmounted component.' In React 18 it was silenced — but the underlying problem remains. If userId changes twice quickly — say the user navigates between profiles fast — you fire two fetches. The first one might resolve after the second, and you get stale data on screen. This is a race condition in your data fetching. The cleanup function in useEffect is exactly for this: return a function that cancels the in-flight work. With fetch, that's an AbortController."`
    },
    {
      speaker: "you",
      text: `"What about the exhaustive-deps lint rule? It always wants me to add things I don't want."`
    },
    {
      speaker: "raj",
      text: `"When the lint rule argues with you, that's usually a signal the effect is doing too much, or the dependency genuinely does change on every render — meaning you have a bigger problem. Suppressing the rule with an eslint-disable comment is almost always wrong. If a function is in your deps, either move it inside the effect, wrap it in useCallback, or ask why the effect depends on it at all. The rule is right more often than you are. The right response to the lint rule fighting you is to redesign the effect, not silence the linter."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// useEffect — DEPENDENCIES AND CLEANUP
// ─────────────────────────────────────────────────────

// ✗ No cleanup — race condition + state update on unmounted component
useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then(r => r.json())
    .then(data => setUser(data)); // fires even if component unmounted
}, [userId]);

// ✓ AbortController cleanup — cancels the fetch on unmount or userId change
useEffect(() => {
  const controller = new AbortController();

  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name === 'AbortError') return; // cancelled — ignore
      setError(err);
    });

  return () => controller.abort(); // cleanup: cancel on re-run or unmount
}, [userId]);

// ── The dependency array — three modes ──
useEffect(() => { /* runs after every render */ });            // no array
useEffect(() => { /* runs once on mount */ }, []);             // empty array
useEffect(() => { /* runs when userId changes */ }, [userId]); // specific deps

// ── Common dependency mistakes ──

// ✗ Object/array literal in deps — new reference every render → effect runs every time
useEffect(() => {
  fetchData(options);
}, [{ page: 1 }]); // new object created each render — never equal to previous

// ✓ Primitive values or memoised references
useEffect(() => {
  fetchData({ page });
}, [page]); // primitive — stable reference

// ✗ Function defined outside effect in deps — new reference each render
const fetchUser = () => fetch(\`/api/users/\${userId}\`);
useEffect(() => {
  fetchUser();
}, [fetchUser]); // fetchUser is new every render → infinite loop

// ✓ Move function inside effect, or useCallback
useEffect(() => {
  const fetchUser = () => fetch(\`/api/users/\${userId}\`);
  fetchUser();
}, [userId]); // only userId in deps — correct

// ── useEffect is not componentDidMount ──
// It runs after EVERY render where deps changed — not just on mount
// If you think of it as "runs once", you'll write bugs`
    },

    // ── Key prop ──
    {
      speaker: "raj",
      text: `"key prop. You have a form inside a list. User selects a different item from the list. The form fields still show the previous item's data. Why?"`
    },
    {
      speaker: "you",
      text: `"React is reusing the same component instance?"`
    },
    {
      speaker: "raj",
      text: `"React diffed the tree, saw a component in the same position, assumed it's the same instance, and kept its state. The form component's internal state was never reset because the component was never unmounted. React didn't know the item changed — it just saw 'a Form component at this position' before and after. The key prop is how you tell React: this is a different instance, not the same one. When key changes, React unmounts the old component entirely and mounts a fresh one. State is gone. The new item's data loads into a clean form."`
    },
    {
      speaker: "you",
      text: `"So key isn't just for lists?"`
    },
    {
      speaker: "raj",
      text: `"Key is for any situation where position alone doesn't distinguish identity. Lists are the most common case. But forms that depend on external data, charts that reinitialise on data change, any component where you want guaranteed fresh state when the input changes — key is the right tool. The mental model: key is React's identity signal, not a list optimisation. Using array index as key is the classic mistake — if items are reordered or inserted, the index changes but the data doesn't match what React expects, and you get scrambled state."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// KEY PROP — IDENTITY, NOT JUST LIST OPTIMISATION
// ─────────────────────────────────────────────────────

// ✗ Index as key — breaks on reorder/insert
{items.map((item, index) => (
  <ItemForm key={index} item={item} />
  // If items are reordered, React matches old state to wrong new item
))}

// ✓ Stable unique ID as key
{items.map(item => (
  <ItemForm key={item.id} item={item} />
))}

// ── Key to reset component state ──
// Without key — React reuses the component, state persists across item changes
function ItemEditor({ selectedItem }) {
  return <Form item={selectedItem} />; // form retains state when selectedItem changes
}

// ✓ With key — different selectedItem.id = fresh Form instance
function ItemEditor({ selectedItem }) {
  return <Form key={selectedItem.id} item={selectedItem} />;
  // When selectedItem.id changes, React unmounts old Form, mounts new one
  // State is clean — no stale field values from previous item
}

// ── When key changes ──
// 1. React unmounts the component with the old key (cleanup runs)
// 2. React mounts a fresh instance with the new key (no state inherited)
// This is intentional, not a workaround — it's the designed mechanism

// ── Other uses of key for forced reset ──
// Chart that should reinitialise when dataset changes:
<Chart key={datasetId} data={dataset} />

// Modal that should reset when opened for a different entity:
<EditModal key={userId} userId={userId} />`
    },

    // ── Unnecessary re-renders ──
    {
      speaker: "raj",
      text: `"A parent component has a state update. Which children re-render?"`
    },
    {
      speaker: "you",
      text: `"All of them?"`
    },
    {
      speaker: "raj",
      text: `"By default, yes. Every child re-renders when the parent does — even if the child's props didn't change. React.memo changes this: it wraps a component and tells React to skip re-rendering if props are shallowly equal to the previous render. But shallow equality is the gotcha. If you pass a new object or array literal as a prop — even with the same values inside — shallow equality fails and memo does nothing. You need useMemo to stabilise the object reference. Same with functions: inline functions create a new reference every render, so any child that receives one as a prop will re-render even with memo. useCallback stabilises function references."`
    },
    {
      speaker: "you",
      text: `"So should I memo everything?"`
    },
    {
      speaker: "raj",
      text: `"No. And that's what the interviewer wants to hear. Premature optimisation. React.memo, useMemo, and useCallback all have a cost — the comparison itself takes time, the cache takes memory. For cheap renders, memoisation is slower than just re-rendering. The signals to reach for these tools: a component is genuinely expensive to render, you can measure the problem with the React DevTools profiler, and you've confirmed the re-render is the bottleneck. Not before. 'I added memo everywhere just in case' is a red flag in a code review."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// UNNECESSARY RE-RENDERS — MEMO, USEMEMO, USECALLBACK
// ─────────────────────────────────────────────────────

// ── React.memo — skip re-render if props shallowly equal ──
// ✗ Without memo: re-renders every time parent renders
function ExpensiveChild({ value }) {
  return <div>{/* heavy render */}{value}</div>;
}

// ✓ With memo: skips render if value hasn't changed
const ExpensiveChild = React.memo(function({ value }) {
  return <div>{/* heavy render */}{value}</div>;
});

// ── The reference trap — memo does nothing if props aren't stable ──
function Parent() {
  const [count, setCount] = useState(0);

  // ✗ New object every render — memo always fails
  const config = { theme: 'dark', size: 'lg' };

  // ✗ New function every render — memo always fails
  const handleClick = () => console.log('clicked');

  return <ExpensiveChild config={config} onClick={handleClick} />;
}

function Parent() {
  const [count, setCount] = useState(0);

  // ✓ useMemo — stable object reference, only recreated when deps change
  const config = useMemo(() => ({ theme: 'dark', size: 'lg' }), []);

  // ✓ useCallback — stable function reference
  const handleClick = useCallback(() => console.log('clicked'), []);

  return <ExpensiveChild config={config} onClick={handleClick} />;
}

// ── useMemo for expensive calculations ──
// ✗ Recomputes on every render
const sorted = items.sort((a, b) => a.price - b.price);

// ✓ Only recomputes when items changes
const sorted = useMemo(
  () => [...items].sort((a, b) => a.price - b.price),
  [items]
);

// ── When NOT to memoize ──
// • Cheap renders (most components) — comparison cost > render cost
// • Dependencies change on every render anyway — memo never hits cache
// • Premature optimisation without profiler evidence
// Profile first. Memo is a tool for measured problems, not a default.

// ── Finding re-render culprits ──
// React DevTools → Profiler tab → record interaction → flame graph
// Components that re-rendered show their render time
// 'Why did this render?' shows which prop or state changed`
    },

    // ── State mutation bugs ──
    {
      speaker: "raj",
      text: `"You have an array in state. You push a new item onto it. The component doesn't re-render. Why?"`
    },
    {
      speaker: "you",
      text: `"Because push mutates the array in place — React sees the same reference and thinks nothing changed."`
    },
    {
      speaker: "raj",
      text: `"Right. React's change detection is reference equality. Same reference means same value as far as React is concerned — it doesn't do a deep comparison. Mutations are invisible to React. The rule is absolute: never mutate state directly. Always produce a new reference. This is why state updates use spread syntax, filter, map, slice — operations that return new arrays or objects. The mutation version of the bug is especially nasty in development because it sometimes appears to work — you mutate, something else triggers a re-render for a different reason, and you see the updated value. The bug only shows itself under specific render conditions."`
    },
    {
      speaker: "you",
      text: `"What about nested objects? Spread only goes one level deep."`
    },
    {
      speaker: "raj",
      text: `"That's the real trap. Shallow copy means nested objects are still shared references. If you spread the top level and then mutate a nested property, you've mutated the original state — React still doesn't see the change. You need to spread at every level you're changing. For deeply nested state this gets painful — which is a signal the state is too deep and should probably be restructured, or you should use Immer, which lets you write mutating-style code while producing correct immutable updates under the hood."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// STATE MUTATION — WHY IT BREAKS AND HOW TO FIX IT
// ─────────────────────────────────────────────────────

// ── Array mutations ──
const [items, setItems] = useState([1, 2, 3]);

// ✗ Mutates — React sees same array reference → no re-render
items.push(4);
setItems(items); // same reference!

// ✓ New array reference — React sees change → re-renders
setItems([...items, 4]);             // add to end
setItems([newItem, ...items]);       // add to start
setItems(items.filter(i => i !== 2)); // remove
setItems(items.map(i => i === 2 ? 99 : i)); // update one item

// ── Object mutations ──
const [user, setUser] = useState({ name: 'Alice', age: 30 });

// ✗ Mutates — same reference
user.age = 31;
setUser(user);

// ✓ New object reference
setUser({ ...user, age: 31 });

// ── Nested object trap — shallow copy doesn't fix deep mutation ──
const [state, setState] = useState({
  user: { name: 'Alice', address: { city: 'London' } }
});

// ✗ Shallow copy at top level — address is still shared reference
setState({ ...state, user: { ...state.user } });
state.user.address.city = 'Paris'; // mutated! shared reference

// ✓ Spread at every changed level
setState(prev => ({
  ...prev,
  user: {
    ...prev.user,
    address: {
      ...prev.user.address,
      city: 'Paris',  // only new at this level
    },
  },
}));

// ── Immer — write mutating code, get immutable output ──
import { useImmer } from 'use-immer';

const [state, updateState] = useImmer({
  user: { name: 'Alice', address: { city: 'London' } }
});

// Looks like mutation, but Immer produces a new immutable object
updateState(draft => {
  draft.user.address.city = 'Paris'; // safe — draft is a proxy
});

// ── Redux Toolkit also uses Immer internally ──
// That's why you can "mutate" state in Redux Toolkit reducers safely`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Back to the counter. You click three times fast and get 1. You know exactly why now. What's the one-line fix?"`
    },
    {
      speaker: "you",
      text: `"setCount(prev => prev + 1) instead of setCount(count + 1)."`
    },
    {
      speaker: "raj",
      text: `"One character difference. Functional update vs value update. These are the traps that don't show up in small apps — you only see them under real conditions: fast users, rapid state updates, quick navigation, large lists. The interviewer isn't asking whether you've memorised gotchas. They're asking whether you understand the mental model well enough to predict where bugs will hide. Stale closures, invisible mutations, identity confusion — they all come from the same place: not understanding that React works with snapshots and references, not with live mutable values."`
    },

    {
      type: "summary",
      points: [
        "State is a snapshot, not a live value. Calling setCount(count + 1) three times in one event handler uses the same stale count all three times. Use the functional form — setCount(prev => prev + 1) — whenever new state depends on old state.",
        "React 18 batches all state updates including those inside setTimeout and Promises — multiple setState calls in one tick produce one re-render. Use flushSync to opt out (rare).",
        "useEffect cleanup is not optional. A fetch with no AbortController causes a race condition when deps change quickly — an earlier fetch can resolve after a later one and write stale data to state.",
        "When the exhaustive-deps lint rule fights you, the effect needs redesigning — not silencing. An unstable dependency usually means a function is being recreated every render or an object literal is in the deps array.",
        "key is React's identity signal — not just a list optimisation. When key changes, React unmounts and remounts fresh. Use it to reset form state when the selected item changes. Never use array index as key in dynamic lists.",
        "By default, every child re-renders when the parent does. React.memo skips re-renders when props are shallowly equal — but inline object and function props break shallow equality every render. useMemo stabilises objects, useCallback stabilises functions.",
        "Don't memo everything. The comparison has a cost. Profile first with React DevTools, identify the actual bottleneck, then apply memo to the specific component causing the problem.",
        "Never mutate state directly. React uses reference equality — same reference means no change. Use spread, filter, map to produce new references. Mutations are invisible to React and produce intermittent bugs that only appear under specific render conditions.",
        "Spread is shallow. Nested objects in spread state are still shared references — mutating them mutates the original. Spread at every changed level, or use Immer to write mutation-style code that produces correct immutable output."
      ]
    }
  ]
};
