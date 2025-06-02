import HeroVideoDialog from '@/components/magicui/hero-video-dialog';

export default function HeroVideoDialogDemo() {
  return (
    <div className="relative h-screen w-screen">
      <HeroVideoDialog
        className="block dark:hidden h-[80%] w-[80%]"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/RpMAEqHVPKU?si=nwN_dBmvCWNCn9pB"
        thumbnailSrc="https://i9.ytimg.com/vi_webp/RpMAEqHVPKU/mq1.webp?sqp=CPys9cEG-oaymwEmCMACELQB8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgZShlMA8=&rs=AOn4CLAAgsLId4tq_f5kA6SwqfsRwCy_jQ"
        thumbnailAlt="Hero Video"
      />
      <HeroVideoDialog
        className="hidden dark:block h-[80%] w-[80%]"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/RpMAEqHVPKU?si=nwN_dBmvCWNCn9pB"
        thumbnailSrc="https://i9.ytimg.com/vi_webp/RpMAEqHVPKU/mq1.webp?sqp=CPys9cEG-oaymwEmCMACELQB8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgZShlMA8=&rs=AOn4CLAAgsLId4tq_f5kA6SwqfsRwCy_jQ"
        thumbnailAlt="Hero Video"
      />
    </div>
  );
}
