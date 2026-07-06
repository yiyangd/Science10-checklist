# BC Science Connections 10 Knowledge Point Checklist

This repository contains a GitHub Pages-ready interactive checklist for the BC Science Connections 10 full-course knowledge points.

## Files

- `index.html` - canonical GitHub Pages interactive checklist served from the site root.
- `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html` - redirect shim for old long URLs; it preserves hash anchors and sends visitors back to the clean site root.
- `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2_backup.html` - archived backup copy of the canonical interactive HTML checklist.
- `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist.md` - source Markdown checklist.
- `.nojekyll` - tells GitHub Pages to serve files as static assets without Jekyll processing.

## Use

Open the GitHub Pages root URL, or open `index.html` from the repository root. The checklist supports:

- Unit and Chapter navigation
- collapsible Units and Chapters
- searchable checklist content
- MathJax-rendered formulas
- checkbox progress saved in the browser
- Reset Progress with confirmation

## GitHub Pages Deployment

1. Create a GitHub repository and add these files to the repository root.
2. Commit and push the files.
3. In GitHub, open **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch containing these files, usually `main`, and choose the repository root folder.
6. Save the Pages settings and wait for GitHub to publish the site.
7. Open the published Pages URL. It should load the interactive checklist directly from the site root.

## Notes

- MathJax loads from `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js`. Formulas remain visible as raw TeX if the CDN is unavailable.
- Progress is saved with `localStorage` in the visitor's browser. It does not sync across browsers, devices, or private browsing sessions.
- The interactive HTML is standalone and does not require local images, CSS files, or JavaScript files.
- The source Markdown is included for review and future regeneration. The root `index.html` file is the canonical deployed interactive checklist.
- The old v2 filename redirects to the clean root URL. For example, `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html#unit-1` redirects to `./#unit-1`.
- The `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2_backup.html` file is archived only.

## Published URL Format

The deployed checklist should use clean root URLs:

- Main site: `https://yiyangd.github.io/Science10-checklist/`
- Unit anchors: `https://yiyangd.github.io/Science10-checklist/#unit-1`
- Chapter anchors: `https://yiyangd.github.io/Science10-checklist/#chapter-1-1`
