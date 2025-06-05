'use client';

import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@/hooks';
import { Plan } from '@/types';
import { motion } from 'framer-motion';
import {
  User,
  Wallet,
  Calendar,
  CreditCard,
  Coins,
  Loader2,
  Check,
  X,
  RefreshCw,
  Upload,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { uploadToTurbo } from '@/lib/turbo-utils';

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
});

const Profile = () => {
  const router = useRouter();
  const { user, connected, updateUser } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || '',
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!user || !connected) {
    return null;
  }

  const planColorMap: Record<Plan, string> = {
    [Plan.Free]: 'text-neutral-500',
    [Plan.Pro]: 'text-indigo-500',
    [Plan.Enterprise]: 'text-purple-500',
  };

  const profileDetails = [
    {
      icon: Wallet,
      title: 'Wallet Address',
      content: (
        <code className="text-xs bg-secondary/50 px-2 py-1 rounded break-all">
          {user.walletAddress}
        </code>
      ),
    },
    {
      icon: CreditCard,
      title: 'Current Plan',
      content: (
        <p className={`text-sm font-medium ${planColorMap[user.plan]}`}>
          {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
        </p>
      ),
    },
    {
      icon: Coins,
      title: 'Available Tokens',
      content: (
        <p className="text-sm font-medium">lfg! infinite tokens 🐘🐘🐘</p>
      ),
    },
    {
      icon: Calendar,
      title: 'Member Since',
      content: (
        <p className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </p>
      ),
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      const validatedData = updateUserSchema.parse(formData);
      setIsSubmitting(true);

      // Send update request to backend
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user`,
        {
          ...validatedData,
          userId: user?.userId, // Add userId from current user
        }
      );

      // Update local state
      updateUser({
        ...user,
        ...response.data.user,
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {} as typeof errors;
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error('Please check the form for errors');
      } else if (axios.isAxiosError(error)) {
        // Handle API errors
        if (error.response?.status === 400) {
          // Handle specific backend validation errors
          const errorMessage = error.response.data.error;
          if (errorMessage.includes('Email')) {
            setErrors((prev) => ({ ...prev, email: errorMessage }));
          } else if (errorMessage.includes('Username')) {
            setErrors((prev) => ({ ...prev, username: errorMessage }));
          }
          toast.error(errorMessage);
        } else {
          toast.error('Failed to update profile. Please try again later.');
        }
      } else {
        console.log('Profile update error:', error);
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.walletAddress) {
      toast.error('No wallet address found');
      return;
    }

    setIsRefreshing(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
        { walletAddress: user.walletAddress }
      );

      if (!data.success) {
        throw new Error(data.message || 'Failed to refresh profile');
      }

      updateUser(data.user);
      setFormData({
        username: data.user.username,
        email: data.user.email || '',
      });
      toast.success('Profile refreshed successfully');
    } catch (error) {
      console.error('Profile refresh error:', error);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Failed to refresh profile'
        );
      } else {
        toast.error('An unexpected error occurred while refreshing');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      // Update user avatar in database

      const txnId = await uploadToTurbo(file, user.walletAddress);

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user`,
        {
          userId: user?.userId,
          avatarUrl: `https://arweave.net/${txnId}`,
        }
      );

      // Update local state
      updateUser({
        ...user,
        ...response.data.user,
      });

      toast.success('Avatar updated successfully');
    } catch (error) {
      if ((error as Error).message.includes('Insufficient balance')) {
        toast.error('Image should be less than 100KB');
        return;
      }
      console.log(error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // <div className="main-container mx-auto px-4 py-8 max-w-4xl">
  return (
    // <div id="main-container" className="flex flex-1 min-h-0 overflow-hidden">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:bg-gray-100"
          >
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            variant={isEditing ? 'destructive' : 'outline'}
            onClick={() => {
              if (isEditing) {
                setFormData({
                  username: user.username,
                  email: user.email || '',
                });
                setErrors({ username: '', email: '' });
              }
              setIsEditing(!isEditing);
            }}
            className="hover:bg-gray-100"
          >
            {isEditing ? (
              <>
                <X className="mr-2 h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="mr-2 h-5 w-5" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-lg border border-border/50 overflow-hidden shadow-md">
        {/* User Info Section */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="relative h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {user.avatarUrl ? (
                  <>
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      className="h-full w-full rounded-full object-cover group-hover:opacity-50 transition-opacity"
                      width={64}
                      height={64}
                      priority={true}
                    />
                    <Upload
                      size={20}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                    />
                  </>
                ) : (
                  <>
                    <User
                      size={24}
                      className="text-muted-foreground group-hover:opacity-50 transition-opacity"
                    />
                    <Upload
                      size={20}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                    />
                  </>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Username"
                        className={
                          errors.username
                            ? 'border-destructive'
                            : 'border-gray-300'
                        }
                      />
                      {errors.username && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.username}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        type="email"
                        className={
                          errors.email
                            ? 'border-destructive'
                            : 'border-gray-300'
                        }
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-medium">{user.username}</h2>
                    <p className="text-sm text-muted-foreground">
                      {user.email || 'No email set'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {profileDetails.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-md bg-secondary/30 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon size={16} className="text-primary/80" />
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.content}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="border-t border-border/50 bg-card/50 p-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="hover:bg-primary/80"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
    // </div>
  );
};

export default Profile;
