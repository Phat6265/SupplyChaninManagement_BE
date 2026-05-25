import { User, UserRole } from '../models/User';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { AppError } from '../utils/response';

export class AuthService {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new AppError('User already exists', 409);

    const hashedPassword = await hashPassword(data.password);
    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role || UserRole.STAFF,
    });

    await user.save();
    const obj = user.toObject() as any;
    delete obj.password;
    return obj;
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const obj = user.toObject() as any;
    delete obj.password;
    return obj;
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(userId: string, data: Partial<{ firstName: string; lastName: string; phone: string; warehouseId: string }>) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new AppError('User not found', 404);
    return { message: 'User deleted successfully' };
  }

  async getAllUsers(skip = 0, limit = 20) {
    return User.find().select('-password').skip(skip).limit(limit);
  }

  /** With filters: role, isActive, search — matches original UserService.getAllUsers */
  async getAllUsersFiltered(filters: any = {}, skip = 0, limit = 20) {
    return User.find(filters).select('-password').skip(skip).limit(limit);
  }

  async countUsersFiltered(filters: any = {}) {
    return User.countDocuments(filters);
  }

  /** Soft-delete: set isActive = false — matches original UserService.changeStatus */
  async changeUserStatus(userId: string, isActive: boolean) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async countUsers() {
    return User.countDocuments();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    user.password = await hashPassword(newPassword);
    await user.save();
    return { message: 'Password changed successfully' };
  }
}

export const authService = new AuthService();
