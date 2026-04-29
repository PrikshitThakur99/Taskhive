require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskhive';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Task.deleteMany({}),
      Bid.deleteMany({}), Transaction.deleteMany({}), Review.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@taskhive.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      skills: ['Management', 'Moderation'],
      walletBalance: 1000,
    });

    // Create Students
    const students = await User.create([
      {
        name: 'Alex Kim',
        email: 'alex@student.edu',
        password: 'password123',
        bio: 'Full-stack developer & CS senior. Love building things!',
        university: 'MIT',
        skills: ['React', 'Node.js', 'Python', 'MongoDB'],
        walletBalance: 250,
        totalEarned: 320,
        completedTasksCount: 5,
        averageRating: 4.8,
        totalReviews: 5,
      },
      {
        name: 'Sara Patel',
        email: 'sara@student.edu',
        password: 'password123',
        bio: 'UI/UX designer & graphic artist. Figma expert.',
        university: 'Stanford',
        skills: ['Figma', 'Illustrator', 'Photoshop', 'UI/UX'],
        walletBalance: 180,
        totalEarned: 450,
        completedTasksCount: 8,
        averageRating: 4.9,
        totalReviews: 8,
      },
      {
        name: 'Raj Mehta',
        email: 'raj@student.edu',
        password: 'password123',
        bio: 'Data science enthusiast & machine learning researcher.',
        university: 'UC Berkeley',
        skills: ['Python', 'TensorFlow', 'Pandas', 'SQL', 'R'],
        walletBalance: 90,
        totalEarned: 200,
        completedTasksCount: 3,
        averageRating: 4.6,
        totalReviews: 3,
      },
      {
        name: 'Lena Wu',
        email: 'lena@student.edu',
        password: 'password123',
        bio: 'Technical writer & blogger. Clear docs are my passion.',
        university: 'Harvard',
        skills: ['Technical Writing', 'SEO', 'Content Strategy', 'Copywriting'],
        walletBalance: 310,
        totalEarned: 175,
        completedTasksCount: 6,
        averageRating: 4.7,
        totalReviews: 6,
      },
      {
        name: 'Omar Hassan',
        email: 'omar@student.edu',
        password: 'password123',
        bio: 'Mobile dev & React Native specialist.',
        university: 'Carnegie Mellon',
        skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
        walletBalance: 420,
        totalEarned: 560,
        completedTasksCount: 9,
        averageRating: 4.5,
        totalReviews: 9,
      },
    ]);

    console.log(`👥 Created ${students.length + 1} users`);

    const [alex, sara, raj, lena, omar] = students;

    // Create Tasks
    const tasks = await Task.create([
      {
        title: 'Design a logo for our debate club',
        description: 'We need a modern, professional logo for our university debate club. Should include a speech bubble motif and feel academic yet dynamic. Provide PNG + SVG deliverables.',
        category: 'Design',
        budget: 40,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Figma', 'Illustrator', 'Logo Design'],
        tags: ['logo', 'design', 'club'],
        createdBy: raj._id,
        status: 'open',
        bidsCount: 2,
      },
      {
        title: 'Build REST API for student resources portal',
        description: 'Need a Node.js/Express REST API with JWT authentication, MongoDB integration, and full CRUD for a student resources portal. Swagger documentation required.',
        category: 'Code',
        budget: 80,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Node.js', 'MongoDB', 'Express', 'REST API'],
        tags: ['backend', 'api', 'nodejs'],
        createdBy: lena._id,
        status: 'open',
        bidsCount: 1,
      },
      {
        title: 'Write 3 blog posts on climate technology',
        description: '750–1000 words each. Need well-researched posts on solar energy, wind power, and carbon capture for our university sustainability blog. SEO optimized.',
        category: 'Writing',
        budget: 30,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Technical Writing', 'SEO', 'Research'],
        tags: ['writing', 'blog', 'climate'],
        createdBy: omar._id,
        status: 'open',
        bidsCount: 0,
      },
      {
        title: 'Analyze CSV sales dataset & create visualizations',
        description: 'Sales data for a student startup (3k rows). Need Python script + 5 matplotlib/seaborn charts showing trends, seasonality, and a summary report PDF.',
        category: 'Data',
        budget: 45,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Python', 'Pandas', 'Matplotlib', 'Data Analysis'],
        tags: ['data', 'python', 'visualization'],
        createdBy: sara._id,
        status: 'open',
        bidsCount: 1,
        views: 24,
      },
      {
        title: 'Linear Algebra tutoring — 2 sessions (Zoom)',
        description: 'Need help with eigenvalues, SVD, and matrix decompositions. Prefer someone who explains visually with diagrams. Graduate level. 90 min sessions.',
        category: 'Math',
        budget: 35,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Linear Algebra', 'Mathematics', 'Teaching'],
        tags: ['tutoring', 'math', 'algebra'],
        createdBy: omar._id,
        status: 'open',
        bidsCount: 0,
      },
      {
        title: 'React dashboard for project tracker (Kanban)',
        description: 'Build a Kanban-style project tracker with drag-and-drop, persistent state, dark mode, and task filtering. React + Tailwind. Deploy to Vercel.',
        category: 'Code',
        budget: 60,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        requiredSkills: ['React', 'Tailwind', 'JavaScript'],
        tags: ['react', 'frontend', 'dashboard'],
        createdBy: raj._id,
        status: 'in_progress',
        assignedTo: alex._id,
        acceptedAmount: 55,
        escrowReleased: false,
        bidsCount: 3,
        views: 42,
      },
      {
        title: 'Create infographic for sleep deprivation study',
        description: 'Academic poster-style infographic on sleep deprivation in students. Data will be provided. Should be print-ready A3 PDF with citations.',
        category: 'Design',
        budget: 50,
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Illustrator', 'Data Visualization', 'Infographic'],
        tags: ['infographic', 'design', 'academic'],
        createdBy: lena._id,
        status: 'open',
        bidsCount: 0,
      },
      {
        title: 'Transcribe 3 hours of lecture audio to formatted notes',
        description: 'MP3 recordings of 3 one-hour lectures. Need clean Google Doc with headings, bullet points, and key terms bolded. Fast turnaround needed.',
        category: 'Writing',
        budget: 20,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Transcription', 'Typing', 'Note-taking'],
        tags: ['transcription', 'notes', 'audio'],
        createdBy: raj._id,
        status: 'completed',
        assignedTo: lena._id,
        acceptedAmount: 18,
        escrowReleased: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        bidsCount: 2,
      },
      {
        title: 'Build a React Native quiz app for flashcards',
        description: 'Cross-platform flashcard quiz app with spaced repetition algorithm, progress tracking, and offline support. iOS + Android build.',
        category: 'Code',
        budget: 120,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requiredSkills: ['React Native', 'Firebase', 'Mobile'],
        tags: ['mobile', 'app', 'react-native'],
        createdBy: sara._id,
        status: 'open',
        bidsCount: 0,
        views: 15,
      },
      {
        title: 'Market research report on EdTech startups',
        description: 'Comprehensive 15-page market research report on top EdTech startups 2024. Include SWOT, market sizing, and competitor analysis. APA format.',
        category: 'Research',
        budget: 55,
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Research', 'Market Analysis', 'Writing'],
        tags: ['research', 'edtech', 'market'],
        createdBy: alex._id,
        status: 'open',
        bidsCount: 0,
      },
    ]);

    console.log(`📋 Created ${tasks.length} tasks`);

    // Create Bids
    const bids = await Bid.create([
      {
        task: tasks[0]._id, bidder: sara._id,
        amount: 35, deliveryDays: 2,
        message: 'I have designed 20+ logos for student clubs. Can provide 3 concept drafts and unlimited revisions until you are happy!',
        status: 'pending',
      },
      {
        task: tasks[0]._id, bidder: alex._id,
        amount: 40, deliveryDays: 3,
        message: 'Figma expert with experience in brand identity. Will provide PNG, SVG, and brand guidelines doc.',
        status: 'pending',
      },
      {
        task: tasks[1]._id, bidder: alex._id,
        amount: 75, deliveryDays: 7,
        message: '3 years of Node.js/Express experience. I will add Swagger docs, unit tests, and deploy to Railway for free.',
        status: 'pending',
      },
      {
        task: tasks[3]._id, bidder: raj._id,
        amount: 42, deliveryDays: 4,
        message: 'Data science student with pandas/matplotlib expertise. I have done similar analysis for 2 professors this semester.',
        status: 'pending',
      },
      {
        task: tasks[5]._id, bidder: alex._id,
        amount: 55, deliveryDays: 10,
        message: 'Built 4 React apps last semester including a Kanban board. Can add extra features like time tracking.',
        status: 'accepted',
      },
    ]);

    console.log(`💰 Created ${bids.length} bids`);

    // Create Transactions
    await Transaction.create([
      {
        user: alex._id, type: 'deposit', amount: 100,
        description: 'Welcome bonus', balanceBefore: 0, balanceAfter: 100,
      },
      {
        user: alex._id, type: 'credit', amount: 65,
        description: 'Payment for: "Build landing page"',
        task: tasks[5]._id, balanceBefore: 100, balanceAfter: 165,
      },
      {
        user: sara._id, type: 'deposit', amount: 200,
        description: 'Deposit via mock payment', balanceBefore: 0, balanceAfter: 200,
      },
      {
        user: raj._id, type: 'deposit', amount: 100,
        description: 'Welcome bonus', balanceBefore: 0, balanceAfter: 100,
      },
      {
        user: raj._id, type: 'escrow_lock', amount: 55,
        description: 'Escrow locked for: "React dashboard"',
        task: tasks[5]._id, balanceBefore: 100, balanceAfter: 45,
      },
      {
        user: lena._id, type: 'credit', amount: 18,
        description: 'Payment for: "Lecture transcription"',
        task: tasks[7]._id, balanceBefore: 10, balanceAfter: 28,
      },
    ]);

    console.log('💳 Created transactions');

    // Create Reviews
    await Review.create([
      {
        task: tasks[7]._id,
        reviewer: raj._id, reviewee: lena._id,
        rating: 5,
        comment: 'Lena delivered perfect transcriptions, well formatted with all key points. Highly recommend!',
        type: 'client_to_worker',
      },
      {
        task: tasks[7]._id,
        reviewer: lena._id, reviewee: raj._id,
        rating: 4,
        comment: 'Raj was clear with instructions and paid promptly. Great client to work with.',
        type: 'worker_to_client',
      },
    ]);

    console.log('⭐ Created reviews');
    console.log('\n🎉 Seed complete! Login credentials:');
    console.log('  Admin:  admin@taskhive.com / Admin@123456');
    console.log('  Alex:   alex@student.edu / password123');
    console.log('  Sara:   sara@student.edu / password123');
    console.log('  Raj:    raj@student.edu / password123');
    console.log('  Lena:   lena@student.edu / password123');
    console.log('  Omar:   omar@student.edu / password123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedData();
