import { db } from '@/db';
import { transactions } from '@/db/schema';

async function main() {
    const currentTime = new Date().toISOString();
    
    const sampleTransactions = [
        // Income transactions - Salary payments
        {
            userId: 1,
            title: 'Monthly Salary - Software Engineer',
            amount: 3500.00,
            type: 'income',
            category: 'Salary',
            date: '2024-01-15',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Monthly Salary - Software Engineer',
            amount: 3500.00,
            type: 'income',
            category: 'Salary',
            date: '2024-02-15',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Monthly Salary - Software Engineer',
            amount: 3800.00,
            type: 'income',
            category: 'Salary',
            date: '2024-03-15',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        
        // Income transactions - Freelance work
        {
            userId: 1,
            title: 'Website Development Project',
            amount: 950.00,
            type: 'income',
            category: 'Others',
            date: '2024-03-22',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Mobile App UI Design',
            amount: 1150.00,
            type: 'income',
            category: 'Others',
            date: '2024-02-28',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Consulting Services',
            amount: 800.00,
            type: 'income',
            category: 'Others',
            date: '2024-03-05',
            createdAt: currentTime,
            updatedAt: currentTime,
        },

        // Expense transactions - Food
        {
            userId: 1,
            title: 'Grocery Shopping - Walmart',
            amount: 127.50,
            type: 'expense',
            category: 'Food',
            date: '2024-03-20',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Dinner at Italian Restaurant',
            amount: 85.75,
            type: 'expense',
            category: 'Food',
            date: '2024-03-12',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Coffee Shop - Starbucks',
            amount: 28.40,
            type: 'expense',
            category: 'Food',
            date: '2024-02-25',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Weekly Groceries - Target',
            amount: 142.30,
            type: 'expense',
            category: 'Food',
            date: '2024-01-28',
            createdAt: currentTime,
            updatedAt: currentTime,
        },

        // Expense transactions - Rent
        {
            userId: 1,
            title: 'Monthly Rent Payment',
            amount: 1350.00,
            type: 'expense',
            category: 'Rent',
            date: '2024-03-01',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Monthly Rent Payment',
            amount: 1350.00,
            type: 'expense',
            category: 'Rent',
            date: '2024-02-01',
            createdAt: currentTime,
            updatedAt: currentTime,
        },

        // Expense transactions - Entertainment
        {
            userId: 1,
            title: 'Movie Theater - AMC',
            amount: 45.50,
            type: 'expense',
            category: 'Entertainment',
            date: '2024-03-18',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Concert Tickets',
            amount: 115.00,
            type: 'expense',
            category: 'Entertainment',
            date: '2024-03-08',
            createdAt: currentTime,
            updatedAt: currentTime,
        },

        // Expense transactions - Transport
        {
            userId: 1,
            title: 'Gas Station Fill-up',
            amount: 72.25,
            type: 'expense',
            category: 'Transport',
            date: '2024-03-14',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Uber Rides',
            amount: 35.80,
            type: 'expense',
            category: 'Transport',
            date: '2024-02-20',
            createdAt: currentTime,
            updatedAt: currentTime,
        },

        // Expense transactions - Utilities
        {
            userId: 1,
            title: 'Electricity Bill - March',
            amount: 125.40,
            type: 'expense',
            category: 'Utilities',
            date: '2024-03-05',
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            userId: 1,
            title: 'Internet & Cable Bill',
            amount: 89.99,
            type: 'expense',
            category: 'Utilities',
            date: '2024-02-10',
            createdAt: currentTime,
            updatedAt: currentTime,
        }
    ];

    await db.insert(transactions).values(sampleTransactions);
    
    console.log('✅ Transactions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});