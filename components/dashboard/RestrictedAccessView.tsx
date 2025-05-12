'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  PartyPopper,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitAccessRequest, getUserAccessRequests } from '@/lib/api';
import {
  RequestAccessForm as RequestAccessFormType,
  RequestStatus,
} from '@/types/types';
import Image from 'next/image';
import { Confetti, ConfettiRef } from '@/components/magicui/confetti';

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
  const { walletAddress } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestAccessFormType>({
    defaultValues: {
      walletAddress,
      name: '',
      email: '',
    },
  });

  useEffect(() => {
    const checkExistingRequests = async () => {
      if (!walletAddress) {
        console.log('🚨 No wallet? No entry, fam!');
        return;
      }

      try {
        setIsLoading(true);
        const result = await getUserAccessRequests(walletAddress);

        if (result.success && result.requests && result.requests.length > 0) {
          // Grab the freshest request like it's hot 🍟
          const latestRequest = result.requests[0];
          setRequestStatus(latestRequest.status as RequestStatus);
          setShowForm(false);
        } else {
          setRequestStatus(null);
          setShowForm(isModal);
        }
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

    checkExistingRequests();
  }, [walletAddress, isModal]);

  // Confetti effect for PENDING state
  useEffect(() => {
    if (requestStatus === RequestStatus.PENDING && confettiRef.current) {
      // Fire confetti multiple times for a more celebratory effect
      const interval = setInterval(() => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 80,
          origin: { y: Math.random() * 0.3, x: Math.random() }
        });
      }, 1500);
      
      // Initial burst
      confettiRef.current?.fire({
        particleCount: 300,
        spread: 180,
        origin: { y: 0, x: 0.5 }
      });
      
      return () => clearInterval(interval);
    }
  }, [requestStatus]);

  const onSubmit = async (data: RequestAccessFormType) => {
    try {
      setIsSubmitting(true);
      console.log('📬 Sending VIP request to the crypto gods:', data);

      const result = await submitAccessRequest(data);

      if (result.success) {
        toast.success('🎉 YASSS! Your VIP pass is in the mail! 📮');
        setRequestStatus(RequestStatus.PENDING);
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
          {/* Kept OG blue-500 */}
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
  if (requestStatus === RequestStatus.PENDING) {
    return (
      <div className={`${containerClassName} animate-slide-up relative overflow-hidden`}>
        {/* Full page confetti using ref approach for more control */}
        <Confetti 
          ref={confettiRef}
          className="fixed inset-0 z-50 w-full h-full"
          globalOptions={{
            resize: true,
            useWorker: true
          }}
          manualstart={true}
        />
        
        {/* Background music - hidden but auto-playing */}
        <audio
          src="/song/cupid2.mp3"
          autoPlay
          loop
          className="hidden"
          about="Cupid"
          aria-label="Cupid"
        />
        
        <Card className="w-full max-w-md shadow-lg relative z-10">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CardTitle className="text-2xl flex items-center gap-2">
              <h1 className="animate-bounce text-primary-foreground">🎉</h1> Woohoo! Request Submitted!
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
              <h3 className="text-xl font-bold animate-pulse">Thanks for joining the party! 🥳</h3>
              <p className="text-md text-muted-foreground">
                Our crypto wizards are reviewing your application as we speak!
                We&apos;ll be in touch super soon.
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
      </div>
    );
  }

  // 😿 Rejected? Nah, just a plot twist!
  if (requestStatus === RequestStatus.REJECTED) {
    return (
      <div className={`${containerClassName} animate-slide-up`}>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              {' '}
              {/* Kept OG red-500 */}
              <AlertTriangle className="h-6 w-6 animate-wiggle" />
              <CardTitle className="text-2xl">Plot Twist Alert! 🚨</CardTitle>
            </div>
            <CardDescription>
              Your request got yeeted by the bouncer, but we&apos;re ready for
              round two!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No shade, but something didn&apos;t vibe. Maybe we need more deets,
                or the stars weren&apos;t aligned. 🌙 Wanna drop another request with
                extra sauce?
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className={isModal ? 'mr-2' : 'w-full'}
              onClick={() => setShowForm(true)}
            >
              Remix & Resubmit! 🎵
            </Button>
            {isModal && (
              <Button variant="outline" onClick={handleCancel}>
                Catch ya later! 👋
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 📝 Form time: Let's get those digits!
  if (showForm) {
    return (
      <div className={`${containerClassName} animate-slide-up`}>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500 animate-spin" />{' '}
              {/* Kept OG blue-500 */}
              <CardTitle className="text-2xl">Unlock the Party! 🎊</CardTitle>
            </div>
            <CardDescription>
              Drop your deets to snag a spot in the crypto cool kids club! 😎
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Superhero Alias</Label>
                <Input
                  id="name"
                  placeholder="Call me Captain Crypto!"
                  {...register('name', {
                    required: 'No alias, no entry, hero!',
                  })}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Your Crypto Key</Label>
                <Input
                  id="walletAddress"
                  placeholder="0xYourMagicString..."
                  {...register('walletAddress', {
                    required: 'No wallet, no party! 🎉',
                  })}
                  className={errors.walletAddress ? 'border-red-500' : ''}
                />
                {errors.walletAddress && (
                  <p className="text-red-500 text-sm">
                    {errors.walletAddress.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Intergalactic Inbox</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="crypto.king@galaxy.com"
                  {...register('email', {
                    required: 'Gotta know where to send the VIP invite! 📧',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "That email's looking sus, fam!",
                    },
                  })}
                  className={errors.email ? 'border-red-500' : ''}
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
              {isSubmitting ? 'Beaming request... 🛸' : 'Launch Me In! 🚀'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} animate-fade-in`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            {' '}
            {/* Kept OG amber-500 */}
            <Lock className="h-6 w-6 animate-wiggle" />
            <CardTitle className="text-2xl">
              Secret Clubhouse Alert! 🕵️
            </CardTitle>
          </div>
          <CardDescription>
            Yo, you found the VIP lounge! One quick step to join the crypto
            elite.
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
    </div>
  );
}
