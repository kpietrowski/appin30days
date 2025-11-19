import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, optedIn } = req.body;

        // Validate inputs
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Name and email are required'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Insert record into database
        const { data: subscriber, error: dbError } = await supabase
            .from('email_subscribers')
            .insert([
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    opted_in_marketing: optedIn ?? true,
                    source: 'free_guide',
                    guide_downloaded: false,
                    clicked_launch_page: false,
                    purchased_course: false
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);

            // Check for duplicate email
            if (dbError.code === '23505') {
                // Email already exists - still send the guide but don't fail
                console.log('Email already subscribed:', email);
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to save subscription'
                });
            }
        }

        // Initialize Resend client
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send welcome email with guide
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Katie <katie@appin30days.com>',
            to: [email],
            subject: 'Your Free Guide: Build Your First iOS App with AI',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2a2824; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ff8066 0%, #e85d3e 100%); padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Your Free Guide is Ready! 🎉</h1>
                    </div>

                    <div style="background: white; padding: 40px 30px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name}!</p>

                        <p style="margin-bottom: 20px;">Thanks for downloading the free guide! I'm excited to help you start building your first iOS app with AI.</p>

                        <div style="text-align: center; margin: 40px 0;">
                            <a href="https://appin30days.com/downloads/free-guide.pdf" style="display: inline-block; background: linear-gradient(135deg, #ff8066 0%, #e85d3e 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">
                                Download Your Guide →
                            </a>
                        </div>

                        <div style="background: #fef7f3; padding: 24px; border-radius: 16px; margin: 30px 0;">
                            <h3 style="margin-top: 0; color: #ff8066; font-size: 20px;">Inside This Guide:</h3>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 10px;">How to install & configure Claude Code (step-by-step)</li>
                                <li style="margin-bottom: 10px;">The exact prompts to start building your first app</li>
                                <li style="margin-bottom: 10px;">Build a working counter app in under 2 hours</li>
                                <li style="margin-bottom: 10px;">See your code running on your actual iPhone</li>
                                <li style="margin-bottom: 10px;">Understanding Claude Code basics (without getting overwhelmed)</li>
                            </ul>
                        </div>

                        <p style="margin-bottom: 20px;"><strong>Quick tip:</strong> Don't just read the guide - actually follow along and build the counter app. That's when things really click!</p>

                        <div style="background: #f0f9ff; border-left: 4px solid #7fb069; padding: 20px; margin: 30px 0; border-radius: 8px;">
                            <h3 style="margin-top: 0; color: #7fb069;">Ready to Build a Real App?</h3>
                            <p style="margin-bottom: 15px;">The guide gets you started, but building a complete, revenue-generating app requires more. If you want guidance every step of the way...</p>
                            <a href="https://appin30days.com/launch.html" style="color: #7fb069; text-decoration: none; font-weight: bold;">
                                Learn About the December Cohort →
                            </a>
                        </div>

                        <p style="color: #8c8884; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                            Questions? Just reply to this email - I read every message.<br>
                            — Katie
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; color: #8c8884; font-size: 12px;">
                        <p>Build Your First App with Claude Code</p>
                        <p>© ${new Date().getFullYear()} appin30days.com</p>
                    </div>
                </body>
                </html>
            `,
        });

        if (emailError) {
            console.error('Email error:', emailError);
            // Don't fail the request if email fails - user is subscribed
            // They can still access the launch page
        }

        // Update guide_downloaded flag
        if (subscriber) {
            await supabase
                .from('email_subscribers')
                .update({ guide_downloaded: true })
                .eq('id', subscriber.id);
        }

        return res.status(200).json({
            success: true,
            message: 'Guide sent successfully!'
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({
            success: false,
            error: 'An unexpected error occurred. Please try again.'
        });
    }
}
