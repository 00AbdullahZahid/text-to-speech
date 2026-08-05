type AudioPlayerProps = {
  src: string;
};

export function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-[#E7E5F3] bg-[#F8F9FF] p-4">
      <audio controls className="w-full" src={src} />
    </div>
  );
}
