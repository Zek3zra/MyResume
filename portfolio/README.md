# MyResume

Jerow Amelo's personal portfolio, featuring engineering, embedded systems, IoT, and web development projects in a responsive black and white design.

Built with **HTML, CSS, and JavaScript**, with no build step or package dependencies.

## Features

- Responsive layout with a sticky header and mobile navigation.
- Portrait and project previews with grayscale-to-color hover effects.
- Full-size image dialogs with keyboard support.
- An Electronics section with 18 titled images across six categories: timing and displays, power supplies, LED circuits, PCB fabrication, digital logic, and serial communication.
- Five web projects with screenshots and live website links.
- Client projects: Automated Fish Dryer, Arduino Client Projects, and Biometric Attendance.
- Automatically updating GitHub contribution calendar for [@Zek3zra](https://github.com/Zek3zra), plus manual refresh.
- Education, certifications, experience, contact links, and a downloadable CV.
- White-background portrait favicon and consistent section dividers.

## Project structure

```text
MyResume/portfolio/
├── README.md
├── .gitignore
└── dist/
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── Jerow-Amelo-CV.pdf
    └── assets/
```

`dist` contains the complete website and is the folder to serve when hosting it.

## Run locally

With Python 3 installed, open a terminal in the `MyResume/portfolio` folder and run:

```sh
python -m http.server 4173 --directory dist
```

Then visit [http://localhost:4173](http://localhost:4173). On Windows, you can use `py` instead of `python` if that is your installed launcher.

## Customize

| File | Contents |
| --- | --- |
| `dist/index.html` | Personal details, sections, project links, and image references |
| `dist/styles.css` | Theme, layout, responsive styles, and hover effects |
| `dist/script.js` | Mobile menu, image dialogs, contribution calendar, and footer year |
| `dist/assets/` | Portrait, favicon, university seal, project screenshots, and photos |
| `dist/Jerow-Amelo-CV.pdf` | Downloadable resume |

After editing the CSS or JavaScript, update the corresponding version query in `index.html` so returning visitors receive the new file.

## GitHub contribution data

The calendar uses the public [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api) endpoint for `Zek3zra`. It loads when the page opens, refreshes every five minutes while the page is visible, and supports manual refresh. No access token is required.

The feed can cache data for one hour, and new contributions may take time to appear. If a refresh fails, the last successfully loaded chart remains visible. The calendar supports keyboard navigation and horizontal scrolling on mobile.

Google Fonts supplies DM Sans and Space Grotesk, with local font fallbacks. Contact links use email and telephone applications.

## Upload to GitHub

The main `MyResume` folder is the Git repository connected to `https://github.com/Zek3zra/MyResume.git`. Open this folder in GitHub Desktop. Commit the website changes, then click **Push origin**.

Alternatively, from the main `MyResume` folder:

```sh
git add .
git commit -m "Add personal portfolio"
git push origin main
```

The website lives in `portfolio/dist`. Local hosting metadata, temporary files, and the backup of the original nested Git repository are excluded by `.gitignore`.

## Deploy on Vercel

Import the GitHub repository and use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `portfolio` |
| Build Command | Override enabled, left empty |
| Output Directory | `dist` |

The homepage is `portfolio/dist/index.html`. No build step is required.

## Author

**Jerow A. Amelo**  
BS Engineering Technology Major in Computer Engineering Technology  
Technological University of the Philippines Visayas

[GitHub](https://github.com/Zek3zra)

## Portfolio order

About → Electronics → Client hardware → Web systems → Skills → Education → Experience → Contact. Electronics includes original PCB layouts, 3D views, fabricated boards, ALU work, and UART/SPI/I²C labs. Every new image uses the existing full-size preview dialog. Sticky navigation links directly to Electronics, Client hardware, and Web systems.
