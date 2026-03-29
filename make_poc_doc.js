const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, ExternalHyperlink,
} = require('docx');
const fs = require('fs');

// ── Helpers ───────────────────────────────────────────────────────────────────

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Arial', color: '1A5C38' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: '2D7A52' })],
  });
}

function body(text, { bold = false, italic = false, space = 120 } = {}) {
  return new Paragraph({
    spacing: { after: space },
    children: [new TextRun({ text, bold, italic, size: 22, font: 'Arial' })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })],
  });
}

function twoColRow(label, value, shaded = false) {
  return new TableRow({
    children: [
      new TableCell({
        borders, margins: cellMargins,
        width: { size: 2800, type: WidthType.DXA },
        shading: shaded ? { fill: 'F0F7F3', type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial' })] })],
      }),
      new TableCell({
        borders, margins: cellMargins,
        width: { size: 6560, type: WidthType.DXA },
        shading: shaded ? { fill: 'F0F7F3', type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Arial' })] })],
      }),
    ],
  });
}

function threeColRow(col1, col2, col3, shaded = false) {
  const fill = shaded ? { fill: 'F0F7F3', type: ShadingType.CLEAR } : undefined;
  return new TableRow({
    children: [col1, col2, col3].map((text, i) =>
      new TableCell({
        borders, margins: cellMargins,
        width: { size: [3120, 3120, 3120][i], type: WidthType.DXA },
        shading: fill,
        children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Arial' })] })],
      })
    ),
  });
}

function tableHeader(...labels) {
  return new TableRow({
    tableHeader: true,
    children: labels.map(text =>
      new TableCell({
        borders,
        margins: cellMargins,
        shading: { fill: '1A5C38', type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })],
        })],
      })
    ),
  });
}

// ── Document ──────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1A5C38' },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '2D7A52' },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1A5C38', space: 4 } },
          children: [
            new TextRun({ text: 'Recipe Multiplier — AI-Assisted Development POC', size: 18, font: 'Arial', color: '666666' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: '1A5C38', space: 4 } },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: '666666' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: '666666' }),
          ],
        })],
      }),
    },
    children: [

      // ── Cover ──────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: 'Recipe Multiplier', bold: true, size: 56, font: 'Arial', color: '1A5C38' })],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'A Full-Stack Web Application', size: 30, font: 'Arial', color: '444444' })],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'AI-Assisted Development — Proof of Concept', size: 24, font: 'Arial', color: '666666', italic: true })],
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({ text: 'Celia Ho  \u2022  March 2026', size: 22, font: 'Arial', color: '888888' })],
      }),

      // Divider
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1A5C38', space: 4 } },
        spacing: { after: 320 },
        children: [],
      }),

      // ── Overview ──────────────────────────────────────────────────────────
      h1('Overview'),
      body('This document presents a proof-of-concept full-stack web application designed and built collaboratively with Claude (Anthropic AI) in a single session. It demonstrates how AI tools can accelerate software development while keeping engineering judgment, product decisions, and quality review in human hands.'),
      body('The app began as a Java servlet school project (CSC-285 Advanced Java, BHCC, Fall 2024) that scaled recipe ingredient quantities. Working with a local chef who needed a real tool, the scope expanded into a production-ready multi-user web application.'),

      // ── What was built ─────────────────────────────────────────────────────
      h1('What Was Built'),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          tableHeader('Component', 'Description'),
          twoColRow('Scaling engine', 'TypeScript port of Java fraction/math logic. Handles fractions (1/2), mixed numbers (1 1/2), decimals, whole numbers, and colloquial quantities (a pinch, a dash, a handful). Outputs mixed-number fractions. Scales numeric quantities found in instructions text.'),
          twoColRow('URL import', 'Paste a recipe URL; server fetches page and parses Schema.org Recipe JSON-LD (embedded by most major recipe sites) to pre-fill the form automatically.', true),
          twoColRow('User accounts', 'Email/password authentication via Supabase Auth. Sign up, log in, password reset, profile with avatar upload.'),
          twoColRow('Recipe library', 'Saved recipes persist per user. My Recipes tab + Shared with Me tab. Re-scale any saved recipe.', true),
          twoColRow('Sharing', 'Google Drive-style per-recipe sharing. Owner shares by email with view or edit permission. Manage access panel shows avatars, current permissions, and allows changes or revocation.'),
          twoColRow('Meal costing', 'Optional per-ingredient cost entry. Auto-calculates total cost and cost per serving. Shows most and least expensive ingredients.', true),
          twoColRow('Chef notes', 'Private owner-only notes field per recipe. Never visible to shared users, regardless of their permission level. Hidden from print view.'),
          twoColRow('Email', 'One-click mailto: link pre-filled with scaled ingredient list, servings ratio, and total cost. No email service required.', true),
          twoColRow('Export', 'Print button with clean CSS print view (hides nav, share controls, private notes). Copy ingredient list to clipboard.'),
        ],
      }),

      new Paragraph({ spacing: { after: 80 }, children: [] }),

      // ── Stack ──────────────────────────────────────────────────────────────
      h1('Technology Stack'),
      body('Selected to be 100% free to deploy and run:'),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 3000, 4160],
        rows: [
          tableHeader('Layer', 'Technology', 'Why'),
          threeColRow('Frontend + API', 'Next.js 14 (React)', 'One codebase for UI and serverless API routes. No cold starts.'),
          threeColRow('Hosting', 'Vercel (free tier)', 'Native Next.js platform. Custom domains + TLS free. No server sleep.', true),
          threeColRow('Database + Auth', 'Supabase (free tier)', 'Postgres + Row Level Security + built-in auth. 500 MB free.'),
          threeColRow('File storage', 'Supabase Storage', 'Avatar image uploads. 1 GB free.', true),
          threeColRow('Styling', 'Tailwind CSS', 'Mobile-responsive, utility-first. No separate CSS files.'),
        ],
      }),

      new Paragraph({ spacing: { after: 80 }, children: [] }),

      // ── Human vs AI ───────────────────────────────────────────────────────
      h1('What I Did vs. What AI Did'),

      h2('My contributions (product and engineering judgment)'),
      bullet('Defined the target user (chef/catering business owner) and their real use cases'),
      bullet('Decided to expand beyond a static site when user accounts and data persistence were required'),
      bullet('Chose between two proposed approaches (Java + Docker vs. static JS) and the rationale for each'),
      bullet('Specified the Google Drive-style sharing model and its permission rules'),
      bullet('Determined which features belong in v1 vs. later phases (e.g., colloquial quantities moved to MVP; secondary measurements parsing deferred)'),
      bullet('Requested that chef notes be private and never visible to shared users'),
      bullet('Reviewed and approved the data model, file structure, and API design before any code was written'),
      bullet('Reviewed all TypeScript errors caught in the build check'),

      new Paragraph({ spacing: { after: 160 }, children: [] }),
      h2('Claude\u2019s contributions (implementation acceleration)'),
      bullet('Explored and read all existing Java source files to understand the codebase'),
      bullet('Proposed two deployment options with full trade-off analysis; explained cold starts, serverless, and why Next.js suited this use case better than Java or Python'),
      bullet('Designed the full Postgres schema with Row Level Security policies'),
      bullet('Ported four Java math methods to TypeScript faithfully, adding the floating-point guard required for JS'),
      bullet('Extended the logic: mixed-number output, colloquial quantity lookup table, unit pluralization, instruction scaling'),
      bullet('Wrote all boilerplate: Next.js scaffold, Supabase client/server/middleware setup, API routes, all pages and components'),
      bullet('Diagnosed a real disk space issue mid-session (drive at 0 bytes free) and resolved it by identifying and clearing Gradle cache, vcpkg, and Maven target directories'),
      bullet('Fixed TypeScript type errors flagged during the build check'),
      bullet('Wrote this document'),

      new Paragraph({ spacing: { after: 160 }, children: [] }),

      // ── Key decision example ───────────────────────────────────────────────
      h1('Example: How a Decision Was Made'),
      body('When I first asked to deploy the Recipe Multiplier, Claude proposed two paths:'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 3780, 3780],
        rows: [
          tableHeader('', 'Option A: Keep Java + Docker + Render', 'Option B: Rewrite to JS + Vercel'),
          threeColRow('Cost', 'Free (limited)', 'Free (unlimited for static)'),
          threeColRow('Cold starts', '30\u201360 sec after 15 min idle', 'None', true),
          threeColRow('Setup', 'Dockerfile, pom.xml changes, Render config', 'One HTML file'),
          threeColRow('Java preserved?', 'Yes (live stack)', 'Yes (local + GitHub history)', true),
        ],
      }),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      body('Claude recommended Option B. I asked a follow-up question: \u201CI want different users to be able to log in, save, and retrieve recipe data on their accounts.\u201D That changed the scope \u2014 a static site can\u2019t do auth and persistence. Claude pivoted the recommendation to Next.js + Supabase and redesigned the architecture. My question drove the decision; Claude executed it.'),

      // ── Files ──────────────────────────────────────────────────────────────
      h1('Project Files'),
      body('All code lives at: C:\\Projects\\recipe-multiplier\\', { bold: true }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3600, 5760],
        rows: [
          tableHeader('File / Folder', 'Purpose'),
          twoColRow('src/lib/recipeLogic.ts', 'Core scaling engine (Java port + extensions)'),
          twoColRow('src/lib/recipeImport.ts', 'URL fetch + Schema.org JSON-LD parser', true),
          twoColRow('src/lib/supabase/', 'Supabase client, server, and middleware helpers'),
          twoColRow('src/app/api/', 'Serverless API routes: recipes CRUD, shares, import-url, avatar', true),
          twoColRow('src/components/', 'RecipeForm, RecipeResults, ShareManager, Avatar, Navbar, RecipeCard'),
          twoColRow('src/app/', 'All pages: landing, login, signup, account, recipes library, new recipe, view/edit, share', true),
          twoColRow('supabase-schema.sql', 'Full Postgres schema with RLS policies \u2014 run in Supabase SQL Editor'),
          twoColRow('PROCESS.md', 'Developer-facing version of this document (in repo, visible on GitHub)', true),
          twoColRow('.env.local', 'Supabase URL + anon key (not committed to repo)'),
        ],
      }),

      new Paragraph({ spacing: { after: 80 }, children: [] }),

      // ── Phases ────────────────────────────────────────────────────────────
      h1('Roadmap'),
      body('The app was built in a phased approach. Phasing was a deliberate choice: ship a working v1 that the chef can use and give feedback on, rather than delay launch to build every possible feature.'),

      h2('v1.0 \u2014 Shipped'),
      bullet('Recipe scaling with full fraction / colloquial / unit support'),
      bullet('URL import from major recipe sites'),
      bullet('Scaled instructions output'),
      bullet('User accounts, recipe library, chef notes'),
      bullet('Google Drive-style sharing with view/edit permissions and avatar display'),
      bullet('Meal costing (cost per serving, most/least expensive ingredients)'),
      bullet('Email recipe (mailto: link), copy to clipboard, print view'),

      new Paragraph({ spacing: { after: 120 }, children: [] }),
      h2('Phase 2'),
      bullet('Unit conversion (16 oz \u2192 1 lb, 3 tsp \u2192 1 tbsp) \u2014 needs threshold rules for when to convert'),
      bullet('Shopping list: consolidate ingredients from multiple recipes for catering orders'),
      bullet('Duplicate recipe + re-scale to new serving count'),

      new Paragraph({ spacing: { after: 120 }, children: [] }),
      h2('Phase 3'),
      bullet('Secondary measurements: scale \u201C2 lbs chicken (7\u20138 thighs)\u201D \u2014 scale the qty, preserve the note'),
      bullet('Invite by email for users not yet registered'),
      bullet('Recipe tags / categories'),

      new Paragraph({ spacing: { after: 80 }, children: [] }),

      // ── Closing ────────────────────────────────────────────────────────────
      h1('Takeaway'),
      body('This project demonstrates how AI tools can compress development time significantly without replacing the developer. Claude handled boilerplate, research, porting, and bug-fixing. I handled product definition, architecture approval, and scope decisions.'),
      body('The original Java assignment is preserved at its original path and on GitHub as a separate repository, documenting the starting point. The new app is a separate codebase, deployable to recipe.celiaho.com via Vercel + Supabase with zero infrastructure cost.'),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({ text: 'Original Java source: ', size: 20, font: 'Arial', color: '666666' }),
          new ExternalHyperlink({
            link: 'https://github.com/celiaho',
            children: [new TextRun({ text: 'github.com/celiaho', size: 20, font: 'Arial', color: '1A5C38', underline: {} })],
          }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('C:\\Projects\\recipe-multiplier\\Recipe_Multiplier_POC.docx', buffer);
  console.log('Created: C:\\Projects\\recipe-multiplier\\Recipe_Multiplier_POC.docx');
});
