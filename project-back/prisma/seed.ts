import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function main() {
  // Clear existing data
  await prisma.savedImage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.item.deleteMany();

  // Create test user with hashed password
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'user',
    },
  });
  console.log('Test user created:', testUser.email);

  // Source image path - update this to your actual jewel.png location
  const sourcePath =
    'C:\\Users\\feyta\\Documents\\dev\\tech_assessment\\jewel.png';

  // Generate unique filename and copy to uploads folder
  const timestamp = Date.now();
  const filename = `${timestamp}-jewel.png`;
  const destPath = path.join(uploadsDir, filename);

  // Copy the file to uploads folder
  fs.copyFileSync(sourcePath, destPath);

  await prisma.item.create({
    data: {
      name: 'Jewel PNG (seed)',
      imagePath: filename, // Store just the filename, not the full path
      imageMime: 'image/png',
      defaultSize: 30,
      category: 'strass',
    },
  });

  console.log(
    'Seed completed: 1 item inserted with image file copied to uploads/',
  );
  console.log('\n--- Test Credentials ---');
  console.log('Email: test@test.com');
  console.log('Password: Test123!');
}

main()
  .catch((e: unknown) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
