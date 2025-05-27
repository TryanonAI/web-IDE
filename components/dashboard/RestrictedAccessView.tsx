'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/carda';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, Lock, PartyPopper, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import {
  FieldErrors,
  useForm,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitAccessRequest } from '@/lib/api';
import Image from 'next/image';
import { Confetti, ConfettiRef } from '@/components/magicui/confetti';

// Define a simpler form type since we're not using RequestAccess model
interface TrialRequestFormType {
  walletAddress: string;
  name: string;
  email: string;
}

// Define a simple status enum for UI rendering
enum TrialStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
}

interface RestrictedAccessViewProps {
  containerClassName?: string;
  isModal?: boolean;
  onRequestSuccess?: () => void;
  onCancel?: () => void;
}

export default function RestrictedAccessView({
  containerClassName = 'flex flex-col items-center justify-center w-full h-full h-screen p-6', // Kept OG container style, no gradient
  isModal = false,
  onRequestSuccess,
  onCancel,
}: RestrictedAccessViewProps) {
  const { walletAddress, trialStatus } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState<TrialStatus>(
    TrialStatus.NOT_SUBMITTED
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Audio loading handler
  const handleAudioLoaded = () => {
    console.log('🎵 Audio loaded, starting celebration!');
    setAudioLoaded(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TrialRequestFormType>({
    defaultValues: {
      walletAddress,
      name: '',
      email: '',
    },
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!walletAddress) {
        console.log('🚨 No wallet? No entry, fam!');
        return;
      }

      try {
        setIsLoading(true);
        setRequestStatus(trialStatus);
        setShowForm(isModal);
      } catch (error) {
        console.error(
          '💥 Access check crashed harder than a 90s dial-up:',
          error
        );
        setShowForm(isModal);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [walletAddress, isModal, trialStatus]);

  // Confetti effect for PENDING state
  useEffect(() => {
    if (requestStatus === TrialStatus.PENDING && confettiRef.current) {
      // Fire confetti multiple times for a more celebratory effect
      const interval = setInterval(() => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 80,
          origin: { y: Math.random() * 0.3, x: Math.random() },
        });
      }, 1500);

      // Initial burst
      confettiRef.current?.fire({
        particleCount: 300,
        spread: 180,
        origin: { y: 0, x: 0.5 },
      });

      return () => clearInterval(interval);
    }
  }, [requestStatus]);

  const onSubmit = async (data: TrialRequestFormType) => {
    try {
      setIsSubmitting(true);
      console.log('📬 Sending VIP request to the crypto gods:', data);

      const result = await submitAccessRequest(data);

      if (result.success) {
        toast.success('🎉 YASSS! Your VIP pass is in the mail! 📮');
        setRequestStatus(TrialStatus.PENDING);
        setShowForm(false);
        reset(); // Wipe the slate clean, new game plus!
        if (onRequestSuccess) onRequestSuccess();
      } else {
        toast.error(
          result.message || '😵 Oof, the blockchain gremlins ate your request!'
        );
      }
    } catch (error) {
      console.error('🔥 Submission went full 404:', error);
      toast.error('🚨 Houston, we have a problem! Retry in T-minus 10...');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚪 Bounce back to the main view
  const handleCancel = () => {
    setShowForm(false);
    if (onCancel) onCancel();
  };

  // ⏳ Loading screen worthy of a AAA game
  if (isLoading) {
    return (
      <div className={`${containerClassName} animate-fade-in`}>
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 mx-auto text-primary animate-spin" />{' '}
          <h3 className="text-2xl font-bold">
            Hold up, brewing some magic... 🪄
          </h3>
          <p className="text-muted-foreground animate-pulse">
            Checking if you&apos;re on the galactic guest list... 🌟
          </p>
        </div>
      </div>
    );
  }

  // 🎫 Pending status: You're in the queue, VIP!
  if (requestStatus === TrialStatus.PENDING) {
    return (
      <div
        className={`${containerClassName} animate-slide-up relative overflow-hidden`}
      >
        {/* Audio element that triggers loading state */}
        <audio
          src="/song/cupid2.mp3"
          autoPlay
          loop
          className="hidden"
          about="Cupid"
          aria-label="Cupid"
          onCanPlay={handleAudioLoaded}
        />

        {/* Only show celebration when audio is loaded */}
        {audioLoaded ? (
          <>
            {/* Full page confetti using ref approach for more control */}
            <Confetti
              ref={confettiRef}
              className="fixed inset-0 z-50 w-full h-full"
              globalOptions={{
                resize: true,
                useWorker: true,
              }}
              manualstart={true}
            />

            <Card className="w-full max-w-md shadow-lg relative z-10">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <h1 className="animate-bounce text-primary-foreground">
                      🎉
                    </h1>{' '}
                    Woohoo! Request Submitted!
                  </CardTitle>
                </div>
                <CardDescription className="text-lg">
                  Your VIP application is on the way to Anon Vibe Coding Club!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-4 flex flex-col justify-center items-center">
                <div className="relative w-full h-[200px] flex justify-center items-center">
                  <Image
                    className="rounded-lg"
                    src="postSubmit.gif"
                    height={200}
                    width={200}
                    alt="celebration meme"
                  />
                </div>

                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold animate-pulse">
                    Thanks for joining the party! 🥳
                  </h3>
                  <p className="text-md text-muted-foreground">
                    Our crypto wizards are reviewing your application as we
                    speak! We&apos;ll be in touch super soon.
                  </p>
                </div>
              </CardContent>
              {isModal && (
                <CardFooter>
                  <Button className="w-full" onClick={handleCancel}>
                    Peace out, I&apos;m good! ✌️
                  </Button>
                </CardFooter>
              )}
            </Card>
          </>
        ) : (
          // Loading state while audio is loading
          <div className="flex flex-col items-center justify-center">
            <div className="animate-pulse mb-4">
              <PartyPopper className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-medium">Getting the party started...</p>
          </div>
        )}
      </div>
    );
  }

  // 📝 Form time: Let's get those digits!
  if (showForm) {
    return (
      <div className={`${containerClassName} animate-slide-up`}>
        <RestrictedView2
          onSubmit={onSubmit}
          handleSubmit={handleSubmit}
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          handleCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className={`${containerClassName} animate-fade-in`}>
      <RestrictedView1 setShowForm={setShowForm} />
    </div>
  );
}

const RestrictedView1 = ({
  setShowForm,
}: {
  setShowForm: (show: boolean) => void;
}) => {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-amber-500 mb-2">
          <Lock className="h-6 w-6 animate-wiggle" />
          <CardTitle className="text-2xl">Secret Clubhouse Alert! 🕵️</CardTitle>
        </div>
        <CardDescription>
          Yo, you found the VIP lounge! One quick step to join the crypto elite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Why so exclusive?</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;re cooking up something epic behind the scenes. Think
              speakeasy vibes, but with more memes and fewer fedoras. 😏
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold">How do I get in?</h3>
            <p className="text-sm text-muted-foreground">
              Smash that button, flex your deets, and we&apos;ll hook you up
              faster than a DeFi yield farm! (Ok, maybe 48 hours, but still!) 🚜
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => setShowForm(true)}>
          <PartyPopper className="mr-2 h-4 w-4" /> Snag the VIP Pass!
        </Button>
      </CardFooter>
    </Card>
  );
};

// RequestAccessForm
const RestrictedView2 = ({
  onSubmit,
  handleSubmit,
  register,
  errors,
  isSubmitting,
  handleCancel,
}: {
  onSubmit: (data: TrialRequestFormType) => Promise<void>;
  handleSubmit: UseFormHandleSubmit<TrialRequestFormType>;
  register: UseFormRegister<TrialRequestFormType>;
  errors: FieldErrors<TrialRequestFormType>;
  isSubmitting: boolean;
  handleCancel: () => void;
}) => {
  const { walletAddress } = useWallet();

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500 animate-spin" />
          <CardTitle className="text-2xl">Unlock the Party! </CardTitle>
        </div>
        <CardDescription>
          Drop your deets to join Anon Vibe Coding Club! 😎
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Dum Dum"
              {...register('name', {
                required: 'No alias, no entry, hero!',
              })}
              className={`${
                errors.name ? 'border-red-500 focus:border-red-500' : ''
              } outline-none focus-visible:ring-0`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress" className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Wallet Address
              <span className="py-0.5 text-[0.6rem] font-medium border rounded-full px-2 bg-primary/10 text-primary border-primary/20">
                Connected
              </span>
            </Label>
            <div className="relative">
              <Input
                id="walletAddress"
                value={walletAddress}
                {...register('walletAddress')}
                readOnly
                disabled
                className={`bg-muted pr-10 cursor-not-allowed ${
                  errors.walletAddress
                    ? 'border-red-500 focus:border-red-500'
                    : ''
                } outline-none focus-visible:ring-0`}
              />
            </div>
            {errors.walletAddress && (
              <p className="text-red-500 text-sm">
                {errors.walletAddress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="hello@tryanon.ai"
              {...register('email', {
                required: 'Gotta know where to send the VIP invite! 📧',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "That email's looking sus, fam!",
                },
              })}
              className={`outline-none focus-visible:ring-0 ${
                errors.email ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Bail for now! 🏃‍♂️
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting... 🛸' : 'Join in!'}
        </Button>
      </CardFooter>
    </Card>
  );
};
