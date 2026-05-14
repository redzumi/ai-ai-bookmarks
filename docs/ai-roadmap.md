# AI Features Roadmap

This note captures the recommended AI roadmap for the product, optimized for a fast Product Hunt-ready release.

## MVP Priorities

1. AI Organize with preview and apply
   - The strongest and most immediate feature.
   - The current code already has AI categorization, so this is the fastest path to visible product value.
   - The user should preview the proposed structure before applying changes.

2. Semantic search across bookmarks
   - Let users search by intent, not just by title.
   - Example: "where did I save the article about vector databases?"
   - This turns the product from a cleanup tool into an assistant.

3. Duplicate detection and cleanup
   - Find duplicate and near-duplicate bookmarks.
   - Surface stale, redundant, or low-value items.
   - This is the most practical follow-up feature after organizing.

## 2-4 Week Roadmap

### Week 1: AI Organize v1
- Activate the `Update with AI` button.
- Add preview before apply.
- Scope the first version to the current folder or workspace.
- Save the result in the existing data model.

### Week 2: Organize polish
- Add progress per chunk.
- Improve error handling and retry.
- Allow canceling long-running requests.
- Harden the prompt and JSON response contract.

### Week 3: Semantic search v1
- Add a search field in the bookmarks view.
- Support natural-language queries.
- Return ranked results across the selected scope.
- Show a short explanation for each match.

### Week 4: Cleanup tools
- Detect duplicate and near-duplicate bookmarks.
- Suggest actions such as `keep`, `archive`, `merge`, or `review`.
- Add bulk actions for fast cleanup.

## Suggested Release Order

1. AI Organize preview + apply
2. Prompt hardening + chunking/progress
3. Semantic search
4. Duplicate detection
5. Cleanup suggestions + bulk actions
6. UX states for loading, empty, error, retry, and cancel

## Practical Scope for the First Release

If the goal is a fast and credible launch, ship these three things first:

- AI Organize with preview/apply
- Semantic search
- Duplicate detection

That combination is easy to demo, easy to explain, and solves a real problem: bookmark chaos.
