# Ok's House - SvelteKit Version

A vacation rental booking system converted from vanilla HTML/CSS/JS to SvelteKit.

## Features

- 🏠 **Home Page**: Welcome screen with navigation to reservation and management
- 📅 **Reservation System**: 3-step booking process
  - Step 1: Select duration (1-10 nights)
  - Step 2: Choose check-in date with calendar
  - Step 3: Enter guest information
- ⚙️ **Management**: View and modify existing reservations
- 🔒 **Privacy Consent**: GDPR-compliant privacy policy modal
- 📱 **Responsive Design**: Mobile-first, accessible UI

## Technology Stack

- **Framework**: SvelteKit
- **Styling**: CSS Custom Properties (CSS Variables)
- **State Management**: Svelte Stores
- **Navigation**: SvelteKit routing
- **Build Tool**: Vite

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── Calendar.svelte          # Interactive calendar component
│   │   ├── DurationSelector.svelte  # Duration selection buttons
│   │   ├── PrivacyConsent.svelte   # Privacy policy modal
│   │   └── StepIndicator.svelte    # Progress indicator
│   └── stores/
│       └── reservation.js          # Reservation state management
├── routes/
│   ├── +layout.svelte              # Main layout
│   ├── +page.svelte                # Home page
│   ├── manage/
│   │   └── +page.svelte            # Reservation management
│   └── reservation/
│       └── +page.svelte            # Booking process
├── app.css                         # Global styles
└── app.html                        # HTML template
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Design System

### Colors
- **Primary**: Blue gradient (`#4338ca` to `#312e81`)
- **Warning**: Orange gradient (`#d97706` to `#b45309`)
- **Success**: Green (`#047857`)
- **Error**: Red (`#dc2626`)

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Accessible sizing for 50-60+ users
- **Contrast**: WCAG AA compliant

### Components
- **Buttons**: Gradient backgrounds with hover effects
- **Form inputs**: Large touch targets (50px min height)
- **Calendar**: Grid-based with weekend highlighting
- **Cards**: Elevated with subtle shadows

## Accessibility Features

- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Screen Readers**: Proper ARIA labels and landmarks
- ✅ **High Contrast**: WCAG AA compliant color combinations
- ✅ **Large Targets**: 44px minimum touch target size
- ✅ **Focus Indicators**: Visible focus states
- ✅ **Responsive Text**: Scales appropriately on mobile

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ CSS Grid and Flexbox support required

## License

Private project for Ok's House vacation rental system.