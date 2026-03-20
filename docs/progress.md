# Recipe Filter — Progress & To-Do

## What's been built

### PDF import, UI polish & data quality (session 8)

- **PDF recipe extraction** — 5 recipes extracted from a slow cooker PDF cookbook and created as draft markdown files: Queso Chicken Mac N' Cheese, Peanut Miso Chicken Rice Bowls, Pineapple Teriyaki Pulled Pork Rice Bowls, Green Enchilada Chicken & Rice Soup, Frozen Cheesy Chicken & Rice Burritos
- **Recipe card font** — card titles changed from Crimson Pro to Space Grotesk (imported from Google Fonts) for a modern tech contrast against the serif heading font
- **Tag badge alignment** — emoji badges and `+N` overflow badge now aligned on the same baseline (`align-items: center`); `+N` font size bumped to `16px` to match emoji size
- **Tag sidebar spacing** — added en-space (`\u2002`) between emoji and tag name in sidebar for better readability
- **Tag capitalisation** — sidebar tag labels now capitalised via CSS `text-transform: capitalize`
- **Image folder** — `public/images/` created; images stored here and referenced as `/images/filename` in frontmatter. Target size: 800×600px (4:3), JPEG or PNG
- **Method step spacing** — blank lines added between numbered method steps across all 57 draft recipe files for consistent rendering
- **Temperature conversions** — all Fahrenheit-only temperatures converted to Celsius across all recipe files (files already showing both were left untouched)
- **oz conversions** — all imperial oz measurements converted to grams (solids) or ml (liquids) across all recipe files; lines already showing metric alongside oz were left untouched
- **lb conversions** — all pound/lb measurements converted to grams or kg across all recipe files; lines already showing metric alongside lb were left untouched
- **Shopping list — category keywords expanded** — `src/data/categories.js` significantly expanded with new keywords across all categories; vegetables excludes now prevent frozen items and canned tomatoes from mismatching; `garlic ... minced` excluded from meats
- **Shopping list — new Sweeteners category** — honey, maple syrup, sugar, coconut
- **Shopping list — fixed ignore logic** — previously only exact string matches were ignored (so `"1 Tbsp salt"` slipped through); now strips quantity prefix (number + unit + optional "of") before exact matching, handling formats like `"1 Tbsp salt"`, `"pinch of salt"`, `"dash of black pepper"`, `"1 1/4 tsp salt"`, `"0.5 tsp pepper"`
- **Shopping list — fixed category order** — output now always follows a fixed order: vegetables, meats, dairy, pasta & grains, tins, herbs & spices, sauces & oils, frozen, sweeteners, other; empty categories are skipped

### Recipe browser UI, bulk import & polish (session 7)

- **3-panel layout** — recipe browser redesigned as left sidebar (tag filters), main grid (recipe cards), always-visible right panel (My List); replaced old toggle-based drawer
- **Tag filter sidebar** — vertical list with border/fill selected style; emoji support per tag via `src/data/tagConfig.js`; active filter chips with × removal shown above the grid
- **Recipe cards** — image thumbnail, title, tag badges, Add/Remove button; entire card is clickable via CSS stretched link pattern; green ✓ Added state
- **Typography** — changed from Playfair Display to Crimson Pro throughout
- **Tag badge fix** — added `align-items: flex-start` to `.rb-card-tags` so short tags don't stretch vertically to match longer siblings
- **My List order** — recipes now appear in the order they were added (first added = top) rather than by their position in the source data
- **Bulk recipe import** — 57 recipes imported from URLs as draft markdown files (`src/blog/_*.md`); underscore prefix keeps them hidden from the Astro build until published
- **Tag normalisation** — standardised all tags to `"slow cooker"`, `"one pot"`, `"baked"`, `"stir fry"` across all recipe files
- **Tag emojis** — `src/data/tagConfig.js` filled in with emojis for all tags in the vocabulary
- **Recipe hero image** — individual recipe pages now show a `4:3` cropped hero image (`.recipe-hero-img`) capped at 560px wide via `object-fit: cover`; works for any image shape without manual resizing
- **My List view — image + ingredients layout** — each recipe card in "View full recipes" shows: title → ingredients & image side by side → method. Recipes with more than 8 ingredients split into two equal columns with the image as a third column (`1fr 1fr 1fr`); 8 or fewer use a `60/40` two-column split. Ingredient list borders use `align-self: start` so they don't stretch below the last item. Image uses `aspect-ratio: 4/3` with `object-fit: cover`
- **My List full-view width** — content capped at 1100px and centred so text doesn't stretch edge to edge on wide screens
- **URL import status** — full bypass/skip list documented below under "URL import status"

### Visual redesign (session 6)

- Full site redesign using CSS custom properties for both light and dark modes — all colours defined in `:root` and `html.dark` blocks in `global.css`, so the entire palette can be changed in one place
- **Light mode** — warm cream background (`#faf7f0`), grass green header and primary colour, golden amber accents
- **Dark mode** — deep charcoal brown background (`#1c1008`), warm amber primary, golden firelight accents, parchment text; dark mode is now the default for new visitors (OS light preference is still respected)
- **Typography** — Playfair Display (italic serif) for headings and the site name via Google Fonts; Lato for body text and buttons
- **Header** restructured: "Raven Recipes" is now a clickable italic brand link inside the header; on desktop the layout is a single row — site name left, nav links right, theme toggle far right
- **Active nav indicator** changed from a bottom border to a colour change (`--nav-active`); light mode uses warm peach `#fdba74`, dark mode uses golden yellow — each tuned independently via the variable
- **In-list tile border** made much more prominent: 4px border plus an outer glow box-shadow in the primary colour
- **Shopping list** improved: responsive height (`60vh`), monospace font, vertical-only resize, Copy to clipboard button with "Copied!" feedback
- **Footer** social links restyled from purple pill buttons to subtle outlined links matching the new palette
- **ThemeIcon** sun/moon colours updated to match the new palette (cream sun on green header, amber moon on dark background)
- All hardcoded colours removed from `MarkdownPostLayout.astro` — everything now flows from CSS variables

### My list recipe cards & list limit (session 5)

- Each recipe in the My list view is now wrapped in a bordered card (dark border in light mode, white in dark mode) with padding and a gap between cards
- The list is capped at 6 recipes. Once full, all Add buttons for recipes not already in the list are disabled and greyed out
- The My list view button now shows a count in the format `My list (x/6)` so the limit is visible at a glance
- The limit is controlled by a single `LIST_MAX` constant at the top of `RecipeBrowser.jsx` if it ever needs changing

### Bug fixes & Clear button improvements (session 4)

- Fixed a bug where selected tag buttons lost their visual selected state after navigating to a recipe and back. Root cause: the component is pre-rendered on the server where `localStorage` is unavailable, so the lazy state initialiser always returned empty sets. Fix: initialise with empty sets and load from `localStorage` in a `useEffect` after hydration, with a `hydrated` guard on the write effects to prevent empty state from overwriting saved data before the load has run
- Clear button now also clears selected tags and wipes both `localStorage` entries — a full reset
- Clear button renamed from "Clear list" to "Clear"
- Clear button now appears whenever there is anything to clear — selected tags, recipes in the list, or both (previously only appeared when the list had items)

### localStorage persistence & cross-page Add button (session 4)

- `myList` and `selectedTags` are now persisted to `localStorage` under the keys `raven-recipes-list` and `raven-recipes-tags`. Both survive page refresh, tab close, and browser restart. They are cleared when the Clear button is pressed
- Added `src/components/AddToListButton.jsx` — a small Preact component that appears on each individual recipe page. It reads and writes the same `localStorage` key as `RecipeBrowser`, so adding a recipe from its own page is reflected in the tile grid when you navigate back
- `MarkdownPostLayout.astro` updated to accept a `recipeId` prop and render the Add to List button
- `src/pages/recipes/[...slug].astro` updated to pass `post.id` as `recipeId` to the layout

### Active nav indicator (session 4)

- The current page's nav link gets a bottom border so it's clear where you are
- Uses `Astro.url.pathname` in `Navigation.astro` to apply an `active` class at build time — no JavaScript needed
- Recipes is highlighted for both `/recipes/` and any individual recipe page (`/recipes/<slug>/`)
- Light mode: dark border; dark mode: white border

### URL structure (session 3)

- Individual recipe pages moved from `/posts/<slug>/` to `/recipes/<slug>/` by renaming `src/pages/posts/` to `src/pages/recipes/`
- Recipe browser moved from `/blog/` to `/recipes/` by renaming `src/pages/blog.astro` to `src/pages/recipes.astro`
- All internal links updated (navigation, RSS feed, tag pages, tile links)
- File slugs (and therefore URLs) will update automatically when you rename the `.md` files in `src/blog/`

### Recipe tiles (session 3)

- The browse view was changed from a plain list to a responsive grid of tiles
- Each tile shows a 4:3 thumbnail image, the recipe title, and an Add/Remove button
- Tiles with a recipe already in your list are outlined in dark so you can see at a glance what you've picked
- Until real photos are available, recipes without a local image show a grey placeholder box with the `shortName` centred in it — no code changes needed when real images are ready, just update `image.url` in the post's frontmatter

### Tag filtering & empty state (session 3)

- Tag filtering uses AND logic — a recipe only appears if it has **all** selected tags, not just any one of them
- Added an empty-state message when the active tag combination has no results
- Selecting tags, navigating away, and returning restores the tag selection correctly (covered by localStorage fix above)

### UI & site-wide changes (session 2)

- View control buttons (Browse / My list / Shopping list) styled as solid/outlined buttons, distinct from tag filter pills
- Tag pills have clear selected (filled dark) and unselected (outlined grey) states
- Site name changed to **Raven Recipes** throughout (header, page titles)
- Nav updated: Tags removed, Blog renamed to Recipes → now **Home | About | Recipes**
- Home page rewritten: short description + "Browse recipes →" CTA button
- About page replaced with a minimal placeholder

### Initial implementation (session 1)

- Interactive recipe browser (`src/components/RecipeBrowser.jsx`) with Browse, My List, and Shopping List views
- Category map and shopping list logic (`src/data/categories.js`)
- Content schema extended with `shortName` and `ingredients` fields
- `src/pages/recipes.astro` fetches all recipes, pre-renders each post's content into a hidden `<div>`, and passes recipe data to `RecipeBrowser`
- `src/layouts/MarkdownPostLayout.astro` renders the ingredients list above the method on individual recipe pages
- All 5 placeholder posts updated with dummy `shortName` and `ingredients` to satisfy the schema

---

## To-do

### High priority

- [ ] **Publish draft recipes** — 57 drafts exist in `src/blog/_*.md`. Remove the `_` prefix from each file to publish it (the filename becomes the URL slug). Review tags/shortName before publishing.

- [ ] **Delete placeholder posts** — `src/blog/post-1.md` through `post5.md` are old test posts with junk tags. Delete them once you have enough real recipes live.

- [ ] **Add real recipe photos**
  Place image files in `public/images/` and set `image.url: /images/your-photo.jpg` in the post frontmatter. The tile grid and individual recipe page will pick them up automatically.

### Nice to have

- [ ] **Fill in the About page** — currently a placeholder. Edit `src/pages/about.astro` whenever ready.

- [ ] **Grow `src/data/categories.js`** — as you add real recipes, ingredients that don't match any keyword will fall into `other`. Add new keywords to the relevant category as needed.

- [ ] **Retire `src/pages/tags/index.astro`** — the `/tags` index page is no longer linked from the nav. Can be deleted once you're confident the recipe browser covers filtering.

- [ ] **Add recipe metadata fields** — optional future fields: `prepTime`, `cookTime`, `servings`. Add to the schema in `src/content.config.ts` and render them in `MarkdownPostLayout.astro`.

- [ ] **Lazy-load ingredients in RecipeBrowser** — currently all ingredients for all recipes are passed to the browser upfront as part of the JS payload. At scale this gets heavy. Ingredients are only needed when a recipe is added to My List, so the fix is: pass only title, tags, image, shortName to RecipeBrowser at load time, and fetch ingredients on demand when a recipe is added. Cleanest approach is a small per-recipe JSON file generated by Astro at build time. Individual recipe pages (`/recipes/<slug>/`) are unaffected — they're separate static pages with ingredients baked in.

---

## URL import status

57 recipes were successfully converted from URLs into draft markdown files.

### Not yet tried — worth attempting manually

| Recipe | URL |
| ------ | --- |
| Slow Cooker Honey Mustard Chicken | <https://www.woolworths.com.au/shop/recipes/slow-cooker-honey-mustard-chicken> |
| Slow Cooker Peanut Stew | <https://thegirlonbloor.com/slow-cooker-peanut-stew/> |
| One Pot Cheesy Taco Skillet | <https://sweetcsdesigns.com/one-pot-cheesy-taco-skillet/> |
| Mexican Stuffed Sweet Potatoes | <https://www.bytheforkful.com/mexican-stuffed-sweet-potatoes/> |
| Baked Chicken Breast | <https://healthyfitnessmeals.com/baked-chicken-breast/> |
| Slow Cooker Bacon Egg Hash Brown Casserole | <https://blog.myfitnesspal.com/slow-cooker-bacon-egg-hash-brown-casserole/> |
| Shawarma Spice Mix | <https://plantbasedfolk.com/shawarma-spice-mix/> |
| White Chicken Chili | <https://www.thecheesecakefactory.com/recipes/white-chicken-chili> |
| Shepherd's Pie | <https://www.lifehacker.com.au/2022/05/shepherds-pie-recipe-beef/> |
| Broccoli Courgette Soup | <https://www.weightlossresources.co.uk/recipes/calorie-counted/soups-broths/soup-broccoli-courgette-317269.htm> |
| Roasted Veggie Pasta Salad | <https://www.eatyourselfskinny.com/roasted-veggie-pasta-salad/> |

### JS-rendered — recipe content unavailable via static fetch

- **wellplated.com** × 3: low-carb lasagna, spicy ranch chicken, slow cooker beef & broccoli
- **budgetbytes.com** × 2: crunchy chicken ramen stir-fry, one-pot chicken and rice
- **ruled.me** × 3: keto chicken fajita casserole, keto instant pot cauliflower soup, keto philly cheesesteak skillet
- **eatingwell.com** × 6: smoked turkey kale rice bake, adobo chicken enchiladas, chicken brussels sprout salad, slow cooker chicken white bean stew, buffalo chicken cauliflower casserole, cheesy ground beef cauliflower casserole
- **mealime.com** × 2: charred broccoli bowl, sun-dried tomato chicken
- **eatbetterrecipes.com** × 1: air fryer chicken and broccoli
- **fitmencook.com** × ~8: sage butter chicken sausage squash, coconut curry slow cooker, basil bison chili, 15-min cajun chicken, grilled chicken rice soup, black-eyed pea butterbean soup, slow cooker low-carb gumbo, slow cooker chicken broccoli casserole, slow cooker cactus cilantro turkey chili

### Paywalled

- cooking.nytimes.com — crisp gnocchi with brussels sprouts & brown butter
- irishtimes.com — Ottolenghi cheesy potato cake
- smh.com.au — charred broccoli & shallot salad

### Not a single recipe page

- theguardian.com — Ottolenghi 30-min recipes (multi-recipe article)
- marthastewart.com — grilled chicken breast tips (tips article, not a recipe)
- reddit.com — MealPrepSunday post

### Dead links

- goodfood.com.au — roasted potato skins (redirects to homepage, recipe gone)
- darebee.com — mashed cauliflower (dead link)

### Social / video (excluded per user)

- TikTok × 2, Twitter/X × 1

---

## How to run

```sh
npm install       # only needed once, or after pulling
npm run dev       # dev server at localhost:4321
npm run build     # production build check
```

Visit `/recipes/` for the interactive browser. Visit `/recipes/<slug>/` for individual recipe pages.
