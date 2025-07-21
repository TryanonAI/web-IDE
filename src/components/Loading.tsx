import Loading_Gif from './LoadingGif';

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