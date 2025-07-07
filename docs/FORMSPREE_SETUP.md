# Formspree Setup - DrinkedIn Business

This project uses Formspree for handling contact form submissions without requiring a backend server.

## Current Configuration

- **Formspree Endpoint**: `https://formspree.io/f/mldnyrgw`
- **Method**: POST
- **Form Location**: Contact section (#contact)

## Form Fields

The contact form includes the following fields:
- **Name** (required)
- **Email** (required) 
- **Company** (optional)
- **Message** (required)

## How It Works

1. User fills out the contact form
2. Form submits to Formspree endpoint
3. Formspree processes the submission and sends email notification
4. User is redirected to a thank you page or back to the form

## Setup Instructions

If you need to change the Formspree endpoint:

1. Create an account at [formspree.io](https://formspree.io)
2. Create a new form project
3. Copy the form endpoint URL
4. Update the `action` attribute in `src/index.html`:
   ```html
   <form class="contact-form" action="YOUR_NEW_ENDPOINT" method="POST">
   ```

## Customization

### Thank You Page
- You can customize the redirect after form submission in your Formspree dashboard
- Or create a custom thank you page in your project

### Validation
- Basic HTML5 validation is already implemented
- Additional client-side validation can be added in `src/scripts/main.js`

### Styling
- Form styles are defined in `src/styles/main.css` under the `.contact` and `.contact-form` selectors

## Testing

To test the form:
1. Run the development server: `npm run dev`
2. Navigate to the contact section
3. Fill out and submit the form
4. Check your email for the notification

## Deployment Notes

- The form will work immediately when deployed to any static hosting platform
- No additional server configuration required
- Make sure the Formspree endpoint is active and configured properly
