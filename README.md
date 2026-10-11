# Belhaven Montessori School

A responsive, accessible school website for Belhaven Montessori School, Gurugu/Jisonayilli, Tamale. Built with semantic HTML, CSS and JavaScript. No framework or installation required.

## Run locally

Use Node.js 20 or later. Run `npm run dev` and open http://127.0.0.1:4173. Run `npm run check` to verify JavaScript, assets, anchors and core contact destinations.

## Publish

The complete static website is in `dist/`. It can be deployed to any static web host. `.openai/hosting.json` identifies the private Sites deployment. The GitHub origin remains Greatsage23/Belhaveen.

## Features

- Responsive navigation and accessible mobile menu
- Preschool, primary and junior high programme information
- Authentic school photographs, expandable quiz-team image and sourced achievements
- Admissions email composer, click-to-call and directions
- Existing EduLink parent portal integration through a direct link
- Native FAQ disclosures, keyboard support and reduced-motion support
- Search metadata, social preview and School structured data

The enquiry form prepares an email in the visitor’s email application. It does not send email automatically, collect records or pretend to submit an admission application. Google Fonts is the only remote presentation dependency; system fallback fonts work offline.

## Content and image sources

School information, logo and photographs: https://bms.edulinkghana.net/ and https://bms.edulinkghana.net/gallery. Retain the school’s permission for these images when publishing publicly. Source image filenames are documented in `ASSETS.md`.

Achievements link directly to the KNUST-hosted 2024 JSMQ report and the Sharks Quiz organiser’s 2026 report. Fees, admission deadlines, class sizes and examination results are not invented. Confirm these with the school before adding them.

## Editing

Edit `dist/index.html` for content, `dist/styles.css` for design and `dist/app.js` for interactions. The school’s published spelling, **Belhaven**, is used in page content; the supplied GitHub repository name, **Belhaveen**, is preserved.
