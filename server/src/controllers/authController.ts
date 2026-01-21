import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/security';

export class AuthController {
  static async setupDefaultAdmin() {
    const count = await prisma.admin.count();
    if (count === 0) {
      const password = hashPassword('admin123');
      await prisma.admin.create({
        data: {
          username: 'admin',
          password,
        },
      });
      console.log('Default admin created: admin / admin123');
    }
  }

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin || !comparePassword(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: admin.id, username: admin.username });
    res.json({ token });
  }

  static async changePassword(req: Request, res: Response) {
    const { oldPassword, newPassword } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const admin = await prisma.admin.findUnique({ where: { id: userId } });

    if (!admin || !comparePassword(oldPassword, admin.password)) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    const hashedPassword = hashPassword(newPassword);
    await prisma.admin.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  }

  static async updateProfile(req: Request, res: Response) {
    // Implement password change if needed
    res.json({ message: "Not implemented yet" });
  }
}
