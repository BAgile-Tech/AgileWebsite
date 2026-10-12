# How to add a Chatterbox post

Each post is one file in `content/posts/`. Add a file, and the post gets its own page, shows on Chatterbox, and the newest one is featured at the top.

## Steps (all in the GitHub website, no software needed)

1. Open the repository on GitHub and go to `content/posts/`.
2. Open `_TEMPLATE.md`, select all the text and copy it. Then click **Add file > Create new file** while inside `content/posts/`.
3. Name the file with the date and a short name, for example `2026-11-04-revit-slow-models.md`. The part after the date becomes the web address: `/chatterbox/revit-slow-models/`.
4. Paste in the contents of `_TEMPLATE.md`, then change the settings at the top and write the post below the second `---` line.
5. Click **Commit changes**. Choose "Create a new branch" if you want to preview first, or commit to main to publish.

Once the change reaches main, your host rebuilds the site and the post goes live.

## Settings at the top of the file

| Setting | Required | What it does |
|---|---|---|
| `title` | yes | The headline |
| `date` | yes | Written as `2026-11-04`. Newest date is shown first and featured |
| `summary` | yes | Short description under the headline and on the card |
| `topic` | no | One of: `managed`, `egnyte`, `software`, `ai`, `security` (default `managed`) |
| `description` | no | Text for Google results (default: the summary) |
| `image` | no | Cover picture. Upload to `public/posts/` and use `/posts/file-name.png`, or paste a full https address |
| `image_alt` | no | Short description of the picture |
| `author` | no | Default is "Brian @ Agile" |
| `slug` | no | Web address. Default comes from the file name |
| `tile` | no | Short text shown on the card when there is no image, such as "8 steps" |
| `draft` | no | `draft: true` keeps the post hidden until you remove the line |

## Notes

- Posts with a mistake in the settings are skipped, not published, and a check on GitHub sends you an email saying which file and why.
- To change a post, edit its file. To remove one, delete the file or add `draft: true`.
- Files whose names start with `_` are ignored, so `_TEMPLATE.md` is safe to leave in place.
- For a richly laid out post (like the onboarding article), add `format: html` and write HTML below the settings.
- Pictures: upload to `public/posts/` (Add file > Upload files), then refer to them as `/posts/name.png`.
