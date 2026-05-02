import 'dotenv/config';
import { sendInvitationEmail } from '../utils/auth/invite';

const TEST_EMAIL = 'test-kiybakveb@srv1.mail-tester.com';

const sampleBoat = {
  id: 'preview-boat-id-123',
  model: 'df32',
  price: 85000,
  currency: 'EUR',
  country: 'france',
  condition: 'excellent',
  description:
    'Beautiful Dragonfly 32 in excellent condition. Fully equipped for offshore sailing with recent sails and updated electronics. The boat has been meticulously maintained and is ready to sail.',
  photos: [],
  specifications: ['Carbon mast', 'Furling headsail', 'Trailer included', 'Chartplotter'],
};

async function main() {
  console.log(`Sending test invitation email to ${TEST_EMAIL}...`);
  await sendInvitationEmail(TEST_EMAIL, [sampleBoat]);
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
