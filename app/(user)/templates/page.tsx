import Image from "next/image";

export default function Page() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center h-full">
      <Image
        src="/soon.webp"
        alt="project Not Found"
        width={200}
        height={200}
        priority
      />
      <p className="text-muted-foreground max-w-2xs text-center">
        Bringing you cool designs to kickstart your project.
      </p>
    </div>
  );
}
