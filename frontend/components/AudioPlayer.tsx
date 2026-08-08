type AudioPlayerProps = {
  src: string;
};

export function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-[#DCE9FB] bg-[#F5F9FF] p-4">
      <audio controls className="w-full" src={src} />
    </div>
  );
}
