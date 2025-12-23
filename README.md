# Sheriff of Words - Poems & Quotes Website

A beautiful, responsive static website for displaying poems and quotes with an interactive playground feature.

## Features

### Core Features

- **Clean, Elegant Design**: Beautiful typography with smooth animations and 3D card effects
- **Dark Mode**: Toggle between light and dark themes with persistent localStorage
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Dynamic Category Filtering**: Dropdown automatically populated with new categories from your content (poems/quotes)
- **Search & Filter**: Real-time debounced search across title, content, author, and category
- **Copy to Clipboard**: Copy poems and quotes with toast notifications
- **Keyboard Shortcuts**:
  - `Alt + 1`: Show all categories
  - `Alt + D`: Toggle theme (dark/light)

### Interactive Features

- **3D Card Effects**: Mouse-tracking tilt effects on hover
- **Staggered Animations**: Beautiful entry animations for cards
- **Poet's Playground**: Interactive sandbox where visitors can experiment with adding their own content (stored in localStorage only)

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: JSON file (`data/content.json`)
- **Hosting**: GitHub Pages
- **Dependencies**: Pure vanilla code, no frameworks needed

## Project Structure

```
sheriffofwords/
├── css/
│   ├── styles.css         # Main website styles
│   └── playground.css     # Playground styles
├── data/
│   └── content.json       # Content (poems & quotes) storage
├── js/
│   ├── app.js             # Main website logic
│   └── playground.js      # Playground logic
├── index.html             # Main website page
├── LICENSE                # Copy right MIT license
├── playground.html        # Poet's Playground (interactive sandbox)
├── README.md              # This file ;-)
```

## Community Submissions

Visitors can submit their poems and quotes for permanent publication on the site!

## Continue development

### Local Development

1. Clone or download this repository
2. Open `index.html` in your browser, or use a local server

### Managing Content

You can update your content by editing `data/content.json` directly

```json
{
  "poems": [
    {
      "id": 1234,
      "title": "Your Poem Title",
      "content": "Your poem content\nMultiple lines supported",
      "category": "romantic",
      "author": "Your Name",
      "date": "2025-12-21"
    }
  ],
  "quotes": [
    {
      "id": 1234,
      "text": "Your inspirational quote",
      "category": "motivational",
      "author": "Your Name",
      "date": "2025-12-21"
    }
  ]
}
```

### Updating content

1. Edit data/content.json with your changes

## License

Feel free to customize and make it your own!

---

Made with ❤️ for poetry and quotes.
