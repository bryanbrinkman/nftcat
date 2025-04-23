# Bryan Brinkman NFT Catalog

A modern, responsive web application for displaying and filtering Bryan Brinkman's NFT catalog. Built with React, TypeScript, and Material-UI.

## Features

- Responsive grid layout
- Search functionality
- Filter by platform and type
- IPFS image integration
- Dark mode theme
- Mobile-friendly design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## Deployment

### Option 1: Deploy to Netlify

1. Create a new site on Netlify
2. Connect your repository
3. Set build command: `npm run build`
4. Set publish directory: `build`

### Option 2: Deploy to Vercel

1. Create a new project on Vercel
2. Connect your repository
3. Vercel will automatically detect the React build settings

### Option 3: Embed in Squarespace

1. Build the application:
```bash
npm run build
```

2. Host the built files on a static hosting service (Netlify, Vercel, etc.)

3. In Squarespace, add a Code Block and insert the following iframe:
```html
<iframe 
  src="YOUR_DEPLOYED_URL" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none;"
></iframe>
```

## Customization

- Modify the theme in `src/index.tsx`
- Adjust the grid layout in `src/App.tsx`
- Update the CSV data format in the `public` directory

## License

MIT 