import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      {/* <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      <p className="text-sm text-gray-500" role="status">
        Loading...
      </p> */}
      <Loading_Gif className="w-20 h-20" count={3} />
    </div>
  );
}

export function Loading_Gif({
  className = '',
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  let src;
  switch (count) {
    case 1:
      src = 'https://media.tenor.com/Sy3vKl_rbMYAAAAi/laby-eating.gif';
      break;
    case 2:
      src =
        'https://media.tenor.com/42bcTn0iuVgAAAAi/under-construction-pikachu.gif';
      break;
    case 3:
      src = '/postSubmit.gif';
      break;
    case 4:
      src =
        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExajMyeDM4cGh1cXdxeTNrN3k3aWkyMnkzOHZiNGNyNXV1eG53amxtNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bGgsc5mWoryfgKBx1u/giphy.gif';
      break;
    case 5:
      src = 'https://media1.tenor.com/m/V_0ti1a3_GoAAAAC/loading-azurlane.gif';
      break;
    default:
      src = 'https://media.tenor.com/Sy3vKl_rbMYAAAAi/laby-eating.gif';
  }
  return (
    <div
      className={`flex items-center justify-center h-full w-full ${className}`}
    >
      <Image src={src} height={150} width={150} alt="loading_gif" priority />
    </div>
  );
}
