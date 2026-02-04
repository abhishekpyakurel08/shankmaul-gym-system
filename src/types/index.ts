export type UserRole = 'admin' | 'staff' | 'trainer' | 'member';

export interface IUser {
    _id?: string;
    email: string;
    password?: string;
    role: UserRole;
    qrLoginToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMember {
    _id?: string;
    user: string | IUser; // Reference to User
    firstName: string;
    lastName: string;
    phone: string;
    qrCode?: string;
    status: 'active' | 'inactive' | 'suspended';
    joinedDate: Date;
    address?: string;
    emergencyContact?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    avatar?: string; // URL to avatar image (DiceBear or uploaded)
}

export interface ISubscription {
    _id?: string;
    member: string | IMember;
    planName: string;
    price: number;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    paymentStatus: 'paid' | 'pending' | 'failed';
}

export interface IAttendance {
    _id?: string;
    member: string | IMember;
    date: Date;
    checkInTime: Date;
    checkOutTime?: Date;
    method: 'qr' | 'manual' | 'auto';
    duration?: number; // minutes
}

export interface IPayment {
    _id?: string;
    member?: string | IMember; // Optional if it's a general income
    amount: number;
    currency: string; // e.g., 'NPR' or 'Rs.'
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    transactionId?: string;
    status: 'completed' | 'pending' | 'failed';
    date: Date;
    description?: string;
}

export type IncomeCategory = 'subscription' | 'personal_training' | 'merchandise' | 'other';

export interface IIncome {
    _id?: string;
    category: IncomeCategory;
    amount: number;
    description?: string;
    paymentMethod: string;
    memberId?: string | IMember;
    date: Date;
    status?: 'completed' | 'pending' | 'failed';
}

export type ExpenseCategory = 'equipment' | 'maintenance' | 'utilities' | 'salaries' | 'rent' | 'supplies' | 'marketing' | 'other';

export interface IExpense {
    _id?: string;
    category: ExpenseCategory;
    amount: number;
    description?: string;
    paymentMethod: string;
    vendor?: string;
    date: Date;
    receiptUrl?: string;
}

export interface INotification {
    _id?: string;
    recipient: string | IUser;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    createdAt: Date;
}

export interface ITraining {
    _id?: string;
    name: string;
    trainer: string | IUser;
    schedule: {
        dayOfWeek: number; // 0-6
        startTime: string; // HH:mm
        endTime: string;
        capacity: number;
    }[];
    description?: string;
}

export interface ITrainingMember {
    _id?: string;
    training: string | ITraining;
    member: string | IMember;
    enrolledDate: Date;
    status: 'active' | 'completed' | 'cancelled';
}

export interface IQRTokenPayload {
    memberId: string;
    type: 'CHECKIN';
}

export interface IProduct {
    _id?: string;
    name: string;
    description?: string;
    category: 'supplements' | 'gear' | 'apparel' | 'drinks' | 'other';
    price: number;
    costPrice?: number;
    stock: number;
    sku?: string;
    brand?: string;
    image?: string;
    isActive: boolean;
}
