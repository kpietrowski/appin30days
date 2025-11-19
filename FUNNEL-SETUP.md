# Email Capture Funnel Setup Guide

This document explains how to set up and deploy the two-page email capture funnel.

## Files Created

1. **guide.html** - Email capture page with lead magnet offer
2. **launch.html** - Sales page shown after email capture
3. **api/subscribe-guide.js** - Vercel serverless function for handling subscriptions
4. **package.json** - Dependencies for API functions
5. **supabase-schema.sql** - Database schema for subscribers

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Table

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL to create the `email_subscribers` table

### 3. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
```

**Where to find these:**
- **SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
- **SUPABASE_SERVICE_KEY**: Supabase Dashboard → Settings → API → service_role key (keep secret!)
- **RESEND_API_KEY**: Resend Dashboard → API Keys

### 4. Create the Free Guide PDF

Upload your free guide PDF to:
```
/public/downloads/free-guide.pdf
```

Or update the download link in `api/subscribe-guide.js` (line 95) to point to your hosted file.

### 5. Verify Email Domain in Resend

1. Go to Resend Dashboard → Domains
2. Add and verify `appin30days.com`
3. Follow DNS setup instructions
4. Wait for verification (usually 5-10 minutes)

### 6. Set Up Stripe Payment (Optional)

When ready to accept payments:

1. Create a Stripe product for the $397 course
2. Get the Stripe payment link
3. Update `launch.html` line 538 to replace the alert with your Stripe URL:

```javascript
window.location.href = 'https://buy.stripe.com/your-checkout-url';
```

### 7. Deploy to Vercel

```bash
git add .
git commit -m "Add email capture funnel"
git push
```

Vercel will automatically:
- Build and deploy the site
- Set up the serverless API function
- Make everything available at appin30days.com

## Testing the Funnel

### Test Email Capture (Local)

1. Run `vercel dev` to test locally
2. Navigate to `http://localhost:3000/guide.html`
3. Fill out the form with a test email
4. Check:
   - Supabase table for new row
   - Email inbox for welcome email
   - Redirect to `/launch.html`

### Test in Production

1. Visit `https://appin30days.com/guide.html`
2. Submit the form
3. Verify the same checklist as above

## Monitoring & Analytics

### Track Funnel Performance in Supabase

```sql
-- Total subscribers
SELECT COUNT(*) FROM email_subscribers;

-- Subscribers by source
SELECT source, COUNT(*)
FROM email_subscribers
GROUP BY source;

-- Conversion funnel
SELECT
  COUNT(*) as total_subscribers,
  SUM(CASE WHEN guide_downloaded THEN 1 ELSE 0 END) as downloads,
  SUM(CASE WHEN clicked_launch_page THEN 1 ELSE 0 END) as viewed_sales,
  SUM(CASE WHEN purchased_course THEN 1 ELSE 0 END) as purchases
FROM email_subscribers
WHERE source = 'free_guide';

-- Recent subscribers (last 7 days)
SELECT name, email, created_at, opted_in_marketing
FROM email_subscribers
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Track Launch Page Visits

To track when someone visits the launch page, add this to `launch.html` after the opening `<body>` tag:

```javascript
<script>
// Track launch page visit
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
if (email) {
    fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, page: 'launch' })
    });
}
</script>
```

## Troubleshooting

### "Method not allowed" error
- API function only accepts POST requests
- Check that the form is submitting correctly

### "Failed to save subscription" error
- Verify Supabase environment variables are set in Vercel
- Check Supabase table exists and has correct schema
- Verify service_role key (not anon key) is being used

### Email not sending
- Verify Resend API key is set in Vercel
- Check domain is verified in Resend
- Look at Vercel function logs for error details

### Duplicate email error
- This is handled gracefully - user still gets the guide
- Email is unique in database to prevent duplicates

## Customization

### Update Email Template

Edit the HTML email in `api/subscribe-guide.js` starting at line 77.

### Update Scarcity ("17 spots left")

Make it dynamic by tracking enrollments:

1. Add a counter to Supabase
2. Query it in the launch page
3. Display real-time availability

### A/B Testing Headlines

Use Vercel's A/B testing or create variants:
- `guide-v2.html` with different headline
- Split traffic 50/50
- Track conversion rates in Supabase

## Next Steps

1. ✅ Complete Supabase setup
2. ✅ Verify Resend domain
3. ✅ Upload free guide PDF
4. ✅ Test funnel end-to-end
5. ⬜ Set up Stripe payment
6. ⬜ Add conversion tracking
7. ⬜ Drive traffic to `/guide.html`

## Support

Questions? Check:
- Vercel logs: `vercel logs`
- Supabase logs: Dashboard → Logs
- Resend logs: Dashboard → Logs

---

Built with ❤️ for App in 30 Days
