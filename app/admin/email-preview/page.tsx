'use client';

const BASE_URL = 'https://dragonfly-trimarans.com';
const ACTIVATE_URL = `${BASE_URL}/reset-password?token=preview-token-example-abc123xyz`;
const FIRST_NAME = 'Jean';
const PREVIEW_EMAIL = 'jean.dupont@example.com';

const boatCard = `
  <div style="border: 1px solid #CCD5DB; border-radius: 12px; overflow: hidden; margin-top: 32px;">
    <img src="/images/boat-1.webp" alt="Dragonfly 32" width="560"
         style="width: 100%; max-width: 560px; height: 240px; object-fit: cover; display: block;" />
    <div style="padding: 24px; background-color: #FDFDFD;">
      <div style="display: inline-block; padding: 6px 12px; background-color: #235B68; color: #FDFDFD; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">
        France
      </div>
      <div style="color: #58A4A7; font-size: 28px; font-weight: 700; line-height: 1.1; margin-bottom: 10px;">
        Dragonfly 32
      </div>
      <div style="color: #235B68; font-size: 22px; font-weight: 500; margin-bottom: 16px;">
        85,000 €
      </div>
      <div style="display: inline-block; padding: 4px 12px; background-color: #e6f3f3; color: #58A4A7; border-radius: 6px; font-size: 13px; font-weight: 500; margin-bottom: 16px;">
        Excellent
      </div>
      <div style="height: 1px; background-color: #ECEFF5; margin: 16px 0;"></div>
      <p style="color: #26282A; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Beautiful Dragonfly 32 in excellent condition. Fully equipped for offshore sailing with recent sails and updated electronics. The boat has been meticulously maintained and is ready to sail.
      </p>
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #ECEFF5; color: #235B68; border-radius: 6px; font-size: 13px; margin: 3px 4px 3px 0;">Carbon mast</span>
        <span style="display: inline-block; padding: 4px 10px; background-color: #ECEFF5; color: #235B68; border-radius: 6px; font-size: 13px; margin: 3px 4px 3px 0;">Furling headsail</span>
        <span style="display: inline-block; padding: 4px 10px; background-color: #ECEFF5; color: #235B68; border-radius: 6px; font-size: 13px; margin: 3px 4px 3px 0;">Trailer included</span>
        <span style="display: inline-block; padding: 4px 10px; background-color: #ECEFF5; color: #235B68; border-radius: 6px; font-size: 13px; margin: 3px 4px 3px 0;">Chartplotter</span>
      </div>
      <a href="${BASE_URL}/boat/preview-boat-id" style="color: #58A4A7; font-size: 14px; font-weight: 600; text-decoration: none;">
        View my listing &rarr;
      </a>
    </div>
  </div>
`;

const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFDFD; color: #26282A;">

  <!-- Header -->
  <div style="background-color: #235B68; padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="/logo-4-2.svg" alt="Dragonfly Trimarans" width="130" height="60"
         style="display: inline-block; filter: brightness(0) invert(1);" />
  </div>

  <!-- Body -->
  <div style="padding: 32px 28px;">

    <h1 style="color: #235B68; text-align: center; font-size: 22px; font-weight: 700; margin: 0 0 28px; line-height: 1.3;">
      Your listing is now live on the new Dragonfly Trimarans platform
    </h1>

    <div style="background-color: #ECEFF5; padding: 28px; border-radius: 12px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #26282A;">
        Hello <strong>${FIRST_NAME}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #26282A;">
        The Dragonfly Trimarans User Forum has a new home. We've upgraded our marketplace to make it easier to buy and sell Dragonfly trimarans — and your listing has already been transferred over.
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #26282A;">
        To manage your listing, update its details, or renew it when the time comes, simply create your password below. Your account is ready and waiting for you.
      </p>

      <div style="text-align: center; margin: 28px 0 20px;">
        <a href="${ACTIVATE_URL}"
           style="background-color: #58A4A7; color: #FDFDFD; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Activate my account
        </a>
      </div>
      <p style="text-align: center; margin: 0 0 20px;">
        <a href="${ACTIVATE_URL}" style="color: #A4B4BB; font-size: 12px; word-break: break-all;">${ACTIVATE_URL}</a>
      </p>

      <p style="color: #A4B4BB; font-size: 14px; margin: 0;">
        This link expires in 7 days. If you don't activate your account, your listing will remain visible but you won't be able to manage it online.
      </p>
    </div>

    <div style="margin-top: 40px;">
      <h2 style="color: #235B68; font-size: 18px; font-weight: 700; margin-bottom: 4px;">
        Your listing
      </h2>
      ${boatCard}
    </div>

  </div>

  <!-- Footer -->
  <div style="background-color: #26282A; padding: 36px 24px; border-radius: 0 0 12px 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="/logo-4-2.svg" alt="Dragonfly Trimarans" width="100" height="46"
           style="display: inline-block; filter: brightness(0) invert(1); opacity: 0.8;" />
    </div>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${BASE_URL}" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Home</a>
      <a href="${BASE_URL}/forsale" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">For sale</a>
      <a href="${BASE_URL}/forum" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Forum</a>
      <a href="${BASE_URL}/contact" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Contact</a>
      <a href="${BASE_URL}/privacy" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Privacy</a>
    </div>
    <p style="color: #CCD5DB; font-size: 12px; text-align: center; margin: 0 0 12px;">
      You received this because your listing was transferred from the Dragonfly Trimarans User Forum.<br>
      Questions? <a href="mailto:admin@dragonfly-trimarans.org" style="color: #58A4A7; text-decoration: none;">admin@dragonfly-trimarans.org</a>
    </p>
    <p style="color: #A4B4BB; font-size: 11px; text-align: center; margin: 0;">
      All rights reserved by Dragonfly Trimarans Marketplace &nbsp;·&nbsp; © 2026 Dragonfly
    </p>
  </div>

</div>
`;

export default function EmailPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Email preview — Invitation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            To: <span className="font-mono">{PREVIEW_EMAIL}</span> · Subject:{' '}
            <span className="font-mono">
              Dragonfly Trimarans User Forum — Your listing is now on the new
              platform
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-4 text-sm text-gray-500 font-mono">
              inbox / email preview
            </span>
          </div>

          <iframe
            srcDoc={emailHtml}
            title="Email preview"
            className="w-full  border-0"
            style={{ height: '1800px', paddingTop: '30px' }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Template : <span className="font-mono">utils/auth/invite.ts</span>
        </p>
      </div>
    </div>
  );
}
