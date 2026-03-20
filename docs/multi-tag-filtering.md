# Recipe Filter, Selection & Shopping List Plan

## Goal

A single interactive page where you can:

1. Filter recipes by tag (multiple tags at once)
2. Add individual recipes to a personal list
3. Click "View my list" to see only the selected recipes in full
4. Generate a categorised shopping list from all selected recipes, ready to copy-paste

No navigation changes, no PDF, no new dependencies. All state lives client-side in a single Preact component.

---

## Architecture

Astro handles data fetching at build time. Preact handles all interactivity.

### What Astro does (build time)

- Fetches all recipes via content collections
- Renders each recipe's full HTML content
- Pre-renders everything into the page (selected recipes are hidden until needed)
- Passes recipe data + rendered HTML to the Preact component as props

### What Preact does (runtime)

- Manages `selectedTags` state (Set) — for filtering
- Manages `myList` state (Set of recipe IDs) — for the curated list
- Toggles between "browse" view, "my list" view, and "shopping list" view

---

## Recipe frontmatter structure

Ingredients live in frontmatter as a flat array (not in the markdown body). The markdown body contains only the method.

```yaml
---
title: Pasta Carbonara
shortName: Carbonara
tags: ["pasta", "quick", "italian"]
ingredients:
  - 200g spaghetti
  - 2 eggs
  - 100g pancetta
  - 50g pecorino
  - black pepper
image:
  url: /images/carbonara.jpg
  alt: Pasta carbonara in a bowl
---

## Method
1. Boil the pasta in salted water...
```

The layout component (`MarkdownPostLayout.astro`) renders `frontmatter.ingredients` as a list on the recipe page. The markdown body renders below as the method. Nothing in the frontmatter appears on the page unless the layout explicitly renders it.

Update `src/content.config.ts` to include the new fields in the schema:

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    shortName: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({ url: z.string(), alt: z.string() }),
    tags: z.array(z.string()),
    ingredients: z.array(z.string()),
  })
});
```

---

## Shopping list: category map

Categories are defined once in a global map file rather than tagging each ingredient individually. Matching is done by substring — "100g pancetta" matches "pancetta" in the map.

### `src/data/categories.js`

```js
// Ingredients that match are silently dropped from the shopping list
export const ignore = [
  "water",
  "salt",
  "pepper",
  "black pepper",
  "white pepper",
];

export const categories = {
  "meat & fish": {
    keywords: ["pancetta", "chicken", "beef", "lamb", "salmon", "bacon", "mince"],
    exclude: ["chicken stock", "beef stock", "fish sauce"],
  },
  "dairy": {
    keywords: ["pecorino", "parmesan", "cream", "butter", "milk", "cheese", "eggs"],
    exclude: [],
  },
  "pasta & grains": {
    keywords: ["spaghetti", "pasta", "rice", "flour", "breadcrumbs"],
    exclude: [],
  },
  "vegetables": {
    keywords: ["onion", "garlic", "tomato", "carrot", "celery", "spinach", "courgette"],
    exclude: ["tomato paste", "tomato puree", "tinned tomatoes"],
  },
  "tins & jars": {
    keywords: ["tinned tomatoes", "tomato paste", "tomato puree", "stock", "passata", "chickpeas", "lentils"],
    exclude: [],
  },
  "herbs & spices": {
    keywords: ["chilli", "cumin", "oregano", "basil", "thyme", "paprika", "coriander"],
    exclude: [],
  },
  "oils & condiments": {
    keywords: ["olive oil", "oil", "vinegar", "soy sauce", "fish sauce"],
    exclude: [],
  },
  "other": {
    keywords: [],
    exclude: [],
  },
};
```

- `keywords` — substring matched against the ingredient string
- `exclude` — checked first; if matched, the category is skipped entirely (allowing a more specific category to catch it instead)
- `ignore` — ingredients matching any entry are dropped from the shopping list completely (pantry staples like salt, pepper, water). Uses **exact match** so "water" is ignored but "coconut water" is not. Convention: write ignored ingredients as bare names with no quantity (e.g. "salt" not "1 tsp salt")

Add new keywords as your recipe collection grows. An ingredient matching nothing lands in "other".

### Categorisation logic (in `RecipeBrowser.jsx`)

```js
import { categories, ignore } from '../data/categories.js';

function categorise(ingredient) {
  const lower = ingredient.toLowerCase();
  for (const [category, { keywords, exclude }] of Object.entries(categories)) {
    if (exclude.some(ex => lower.includes(ex))) continue;
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'other';
}

function buildShoppingList(selectedRecipes) {
  const grouped = {};

  for (const recipe of selectedRecipes) {
    for (const ingredient of recipe.ingredients) {
      const lower = ingredient.toLowerCase();
      if (ignore.some(ig => lower === ig)) continue;
      const category = categorise(ingredient);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(`${ingredient} (${recipe.shortName})`);
    }
  }

  return Object.entries(grouped)
    .map(([cat, items]) => `${cat.toUpperCase()}\n${items.join('\n')}`)
    .join('\n\n');
}
```

### Output example

```
MEAT & FISH
100g pancetta (carbonara)
2 chicken thighs (thai curry)

DAIRY
50g pecorino (carbonara)
2 eggs (carbonara)
4 eggs (omelette)

PASTA & GRAINS
200g spaghetti (carbonara)
```

Displayed in a `<textarea>` so it's instantly selectable and copy-pasteable.

---

## Implementation

### 1. Astro page (`src/pages/blog.astro`)

```astro
---
import { getCollection, render } from "astro:content";
import RecipeBrowser from '../components/RecipeBrowser';

const allPosts = await getCollection("blog");

const recipeData = await Promise.all(allPosts.map(async (post) => {
  const { Content } = await render(post);
  return {
    id: post.id,
    title: post.data.title,
    tags: post.data.tags,
    ingredients: post.data.ingredients,
    shortName: post.data.shortName,
    // Content rendered into hidden divs server-side, referenced by ID
  };
}));
---
<RecipeBrowser recipes={recipeData} client:load />
```

> Note: full recipe HTML (method etc.) is pre-rendered into hidden `<div>` elements server-side by Astro, referenced by recipe ID. The Preact component shows/hides them — no client-side fetching needed.

### 2. `src/components/RecipeBrowser.jsx`

```jsx
import { useState } from 'preact/hooks';
import { buildShoppingList } from '../data/categories.js';

export default function RecipeBrowser({ recipes }) {
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [myList, setMyList] = useState(new Set());
  const [view, setView] = useState('browse'); // 'browse' | 'list' | 'shopping'

  const allTags = [...new Set(recipes.flatMap(r => r.tags))];
  const myListRecipes = recipes.filter(r => myList.has(r.id));

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const toggleMyList = (id) => {
    setMyList(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visibleRecipes = view !== 'browse'
    ? myListRecipes
    : selectedTags.size === 0
      ? recipes
      : recipes.filter(r => r.tags.some(t => selectedTags.has(t)));

  return (
    <>
      {/* Tag filter — only shown in browse view */}
      {view === 'browse' && (
        <div class="tags">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              class={selectedTags.has(tag) ? 'tag active' : 'tag'}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* View controls */}
      <div>
        <button onClick={() => setView('browse')}>Browse</button>
        <button onClick={() => setView('list')}>My list ({myList.size})</button>
        <button onClick={() => setView('shopping')}>Shopping list</button>
      </div>

      {/* Browse / My list view */}
      {view !== 'shopping' && (
        <ul>
          {visibleRecipes.map(recipe => (
            <li key={recipe.id}>
              <a href={`/posts/${recipe.id}/`}>{recipe.title}</a>
              <button onClick={() => toggleMyList(recipe.id)}>
                {myList.has(recipe.id) ? 'Remove' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Shopping list view */}
      {view === 'shopping' && (
        <textarea
          rows={20}
          value={buildShoppingList(myListRecipes)}
          readOnly
        />
      )}
    </>
  );
}
```

---

## File changes summary

| File | Action |
|---|---|
| `src/pages/blog.astro` | Add data mapping, render `<RecipeBrowser>` |
| `src/components/RecipeBrowser.jsx` | New file — tags, list, shopping list |
| `src/data/categories.js` | New file — category keyword map |
| `src/content.config.ts` | Add `ingredients` to schema |
| `src/layouts/MarkdownPostLayout.astro` | Render `frontmatter.ingredients` as a list |
| `src/pages/tags/index.astro` | Can be retired |
| `src/pages/tags/[tag].astro` | Optional — keep for direct-link access |

---

## Future ideas

- Persist `myList` to `localStorage` so selections survive page refresh
- Add recipe metadata to frontmatter: `prepTime`, `cookTime`, `servings`
- Full-width hero image on mobile for each recipe
- Duplicate ingredients are handled naturally — each line is labelled with its `shortName`, so "2 eggs (carbonara)" and "4 eggs (omelette)" appear as separate lines, making it easy to calculate totals at a glance
