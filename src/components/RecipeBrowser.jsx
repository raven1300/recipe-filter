import { useState, useEffect } from 'preact/hooks';
import { buildShoppingList } from '../data/categories.js';
import { tagEmojis } from '../data/tagConfig.js';

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={copy} class={`copy-btn${copied ? ' copied' : ''}`}>
      {copied ? 'Copied!' : 'Copy to clipboard'}
    </button>
  );
}

const LIST_KEY = 'raven-recipes-list';
const TAGS_KEY = 'raven-recipes-tags';
const LIST_MAX = 6;

function readSet(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

function tagLabel(tag) {
  return tagEmojis[tag] ? `${tagEmojis[tag]}\u2002${tag}` : tag;
}

export default function RecipeBrowser({ recipes }) {
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [myList, setMyList] = useState(new Set());
  const [view, setView] = useState('browse'); // 'browse' | 'list' | 'shopping'
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedTags(readSet(TAGS_KEY));
    setMyList(readSet(LIST_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) writeSet(LIST_KEY, myList); }, [myList, hydrated]);
  useEffect(() => { if (hydrated) writeSet(TAGS_KEY, selectedTags); }, [selectedTags, hydrated]);

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();
  const myListRecipes = [...myList].map(id => recipes.find(r => r.id === id)).filter(Boolean);

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

  const clearAll = () => {
    setMyList(new Set());
    setSelectedTags(new Set());
    localStorage.removeItem(LIST_KEY);
    localStorage.removeItem(TAGS_KEY);
  };

  const visibleRecipes = selectedTags.size === 0
    ? recipes
    : recipes.filter(r => [...selectedTags].every(t => r.tags.includes(t)));

  return (
    <div class="rb-layout">

      {/* Left sidebar — tag filters */}
      <aside class="rb-sidebar">
        <div class="rb-sidebar-title">Filters</div>
        <div class="rb-tag-list">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              class={`rb-tag${selectedTags.has(tag) ? ' selected' : ''}`}
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main class="rb-main">

        {/* Active filter chips */}
        {selectedTags.size > 0 && (
          <div class="rb-topbar">
            <span class="rb-filters-label">Filtering by:</span>
            {[...selectedTags].map(tag => (
              <span key={tag} class="rb-filter-chip">
                {tagLabel(tag)}
                <button
                  class="rb-filter-chip-x"
                  onClick={() => toggleTag(tag)}
                  aria-label={`Remove ${tag} filter`}
                >×</button>
              </span>
            ))}
          </div>
        )}

        {/* Results count */}
        <div class="rb-results-count">
          <strong>{visibleRecipes.length}</strong>{' '}
          {visibleRecipes.length === 1 ? 'recipe' : 'recipes'}
          {selectedTags.size > 0 ? ' match your filters' : ' available'}
        </div>

        {/* Recipe grid */}
        {visibleRecipes.length === 0
          ? <p class="rb-no-results">No recipes match all of your selected tags.</p>
          : <div class="rb-recipe-grid">
              {visibleRecipes.map(recipe => {
                const inList = myList.has(recipe.id);
                const canAdd = inList || myList.size < LIST_MAX;
                return (
                  <div key={recipe.id} class={`rb-recipe-card${inList ? ' in-list' : ''}`}>
                    <a href={`/recipes/${recipe.id}/`} class="rb-card-link">
                      {recipe.image?.url
                        ? <img src={recipe.image.url} alt={recipe.image.alt} class="rb-card-img" />
                        : <div class="rb-card-placeholder">{recipe.shortName}</div>
                      }
                    </a>
                    <div class="rb-card-body">
                      <div class="rb-card-name">{recipe.title}</div>
                      <div class="rb-card-tags">
                        {[...recipe.tags].sort((a, b) => selectedTags.has(b) - selectedTags.has(a)).slice(0, 3).map(tag => {
                          const hasEmoji = !!tagEmojis[tag];
                          return (
                            <span key={tag} class={`rb-card-tag${selectedTags.has(tag) ? ' matched' : ''}${hasEmoji ? ' emoji-only' : ''}`}>
                              {hasEmoji ? tagEmojis[tag] : tagLabel(tag)}
                            </span>
                          );
                        })}
                        {recipe.tags.length > 3 && (
                          <span class="rb-card-tag-more">+{recipe.tags.length - 3}</span>
                        )}
                      </div>
                      <div class="rb-card-footer">
                        <button
                          onClick={() => toggleMyList(recipe.id)}
                          class={`rb-add-btn${inList ? ' added' : ''}`}
                          disabled={!canAdd}
                        >
                          {inList ? '✓ Added' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </main>

      {/* Right panel — always visible */}
      <div class="rb-drawer">
        <div class="rb-drawer-header">
          <h2>My List</h2>
          {(myList.size > 0 || selectedTags.size > 0) && (
            <button onClick={clearAll} class="rb-clear-btn">✕ Clear</button>
          )}
        </div>
        <div class="rb-drawer-body">
          {myListRecipes.length === 0
            ? <p class="rb-drawer-empty">No recipes added yet.<br />Browse and click + Add to save recipes here.</p>
            : myListRecipes.map(recipe => (
                <div key={recipe.id} class="rb-list-item">
                  {recipe.image?.url
                    ? <img src={recipe.image.url} alt="" class="rb-list-item-thumb" />
                    : <div class="rb-list-item-thumb rb-list-thumb-placeholder" />
                  }
                  <span class="rb-list-item-name">{recipe.title}</span>
                  <button
                    class="rb-list-remove"
                    onClick={() => toggleMyList(recipe.id)}
                    aria-label={`Remove ${recipe.title}`}
                  >×</button>
                </div>
              ))
          }
        </div>
        {myListRecipes.length > 0 && (
          <div class="rb-drawer-actions">
            <button
              class="rb-drawer-action-btn"
              onClick={() => { setView('list'); setDrawerOpen(false); }}
            >
              View full recipes
            </button>
            <button
              class="rb-drawer-action-btn"
              onClick={() => { setView('shopping'); setDrawerOpen(false); }}
            >
              Shopping list
            </button>
          </div>
        )}
        <div class="rb-drawer-footer">{myList.size} / {LIST_MAX} recipes saved</div>
      </div>

      {/* Full recipe list overlay */}
      {view === 'list' && (
        <div class="rb-fullview">
          <div class="rb-fullview-header">
            <button class="rb-back-btn" onClick={() => setView('browse')}>← Back to Browse</button>
            <h2>My Recipe List</h2>
          </div>
          <div class="rb-fullview-body">
            {myListRecipes.length === 0
              ? <p>No recipes in your list. Go back and add some.</p>
              : myListRecipes.map(recipe => (
                  <div key={recipe.id} class="recipe-full">
                    <div class="recipe-full-header">
                      <h2>{recipe.title}</h2>
                      <button onClick={() => toggleMyList(recipe.id)} class="list-toggle">Remove</button>
                    </div>
                    {(() => {
                      const ings = recipe.ingredients ?? [];
                      const split = ings.length > 8;
                      const half = Math.ceil(ings.length / 2);
                      const col1 = split ? ings.slice(0, half) : ings;
                      const col2 = split ? ings.slice(half) : [];
                      return (
                        <div class={`recipe-full-columns${split ? ' three-col' : ''}`}>
                          {col1.length > 0 && (
                            <ul class="ingredients-list">
                              {col1.map(ing => <li key={ing}>{ing}</li>)}
                            </ul>
                          )}
                          {split && col2.length > 0 && (
                            <ul class="ingredients-list">
                              {col2.map(ing => <li key={ing}>{ing}</li>)}
                            </ul>
                          )}
                          {recipe.image?.url && (
                            <div class="recipe-full-img-wrap">
                              <img src={recipe.image.url} alt={recipe.image.alt} class="recipe-full-img" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div
                      class="recipe-body"
                      ref={(el) => {
                        if (el) {
                          const source = document.getElementById(`recipe-content-${recipe.id}`);
                          if (source) el.innerHTML = source.innerHTML;
                        }
                      }}
                    />
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* Shopping list overlay */}
      {view === 'shopping' && (
        <div class="rb-fullview">
          <div class="rb-fullview-header">
            <button class="rb-back-btn" onClick={() => setView('browse')}>← Back to Browse</button>
            <h2>Shopping List</h2>
          </div>
          <div class="rb-fullview-body">
            {myListRecipes.length === 0
              ? <p>No recipes in your list. Go back and add some.</p>
              : <div class="shopping-list-wrapper">
                  <CopyButton getText={() => buildShoppingList(myListRecipes)} />
                  <textarea
                    class="shopping-list-textarea"
                    value={buildShoppingList(myListRecipes)}
                    readOnly
                  />
                </div>
            }
          </div>
        </div>
      )}

    </div>
  );
}
